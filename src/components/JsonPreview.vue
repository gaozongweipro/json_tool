<template>
  <div class="json-preview">
    <el-card header="生成结果" shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>生成结果</span>
          <el-space>
            <el-tag v-if="result?.data" type="info">
              共 {{ result.data.length }} 条数据
            </el-tag>
            <el-tag v-if="result?.stats?.duration" type="success">
              耗时 {{ result.stats.duration }}ms
            </el-tag>
            <el-button
              size="small"
              :disabled="!result?.data"
              @click="copyToClipboard"
            >
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
            <el-button
              size="small"
              :disabled="!result?.data"
              @click="downloadJson"
            >
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </el-space>
        </div>
      </template>

      <el-loading :loading="loading" element-loading-text="正在生成数据...">
        <div v-if="!result && !loading" class="empty-state">
          <el-empty description="暂无数据，请先配置规则并生成数据" />
        </div>

        <div v-else-if="result?.data" class="preview-content">
          <!-- 统计信息 -->
          <div v-if="result.stats" class="stats-section">
            <el-descriptions :column="4" size="small">
              <el-descriptions-item label="数据条数">
                {{ result.data.length }}
              </el-descriptions-item>
              <el-descriptions-item label="生成耗时">
                {{ result.stats.duration }}ms
              </el-descriptions-item>
              <el-descriptions-item label="数据大小">
                {{ formatFileSize(JSON.stringify(result.data).length) }}
              </el-descriptions-item>
              <el-descriptions-item label="生成时间">
                {{ new Date(result.stats.timestamp).toLocaleString() }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 预览模式切换 -->
          <div class="preview-controls">
            <a-radio-group v-model:value="previewMode" size="small">
              <a-radio-button value="table">表格视图</a-radio-button>
              <a-radio-button value="json">JSON视图</a-radio-button>
              <a-radio-button value="raw">原始数据</a-radio-button>
            </a-radio-group>
            
            <a-input-number
              v-if="previewMode === 'table'"
              v-model:value="pageSize"
              :min="10"
              :max="100"
              :step="10"
              size="small"
              addon-before="每页"
              addon-after="条"
              style="width: 150px; margin-left: 16px"
            />
          </div>

          <!-- 表格视图 -->
          <div v-if="previewMode === 'table'" class="table-view">
            <a-table
              :columns="tableColumns"
              :data-source="paginatedData"
              :pagination="{
                current: currentPage,
                pageSize: pageSize,
                total: result.data.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }"
              size="small"
              :scroll="{ x: 'max-content' }"
              @change="handleTableChange"
            />
          </div>

          <!-- JSON视图 -->
          <div v-else-if="previewMode === 'json'" class="json-view">
            <div ref="jsonEditorContainer" style="height: 400px; border: 1px solid #d9d9d9"></div>
          </div>

          <!-- 原始数据视图 -->
          <div v-else-if="previewMode === 'raw'" class="raw-view">
            <a-textarea
              :value="JSON.stringify(result.data, null, 2)"
              :rows="20"
              readonly
              style="font-family: 'Courier New', monospace"
            />
          </div>
        </div>
      </el-loading>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  ElCard,
  ElSpace,
  ElTag,
  ElButton,
  ElLoading,
  ElEmpty,
  ElDescriptions,
  ElDescriptionsItem,
  ElRadioGroup,
  ElRadioButton,
  ElInputNumber,
  ElTable,
  ElTableColumn,
  ElInput,
  ElTabs,
  ElTabPane,
  ElPagination,
  ElMessage,
  ElIcon
} from 'element-plus'
import {
  CopyDocument,
  Download
} from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor'
import { saveAs } from 'file-saver'
import type { GenerationResult } from '../types'

// Props
interface Props {
  result: GenerationResult | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// State
const previewMode = ref<'table' | 'json' | 'raw'>('table')
const currentPage = ref(1)
const pageSize = ref(50)
const jsonEditorContainer = ref<HTMLElement>()
let jsonEditor: monaco.editor.IStandaloneCodeEditor | null = null

// 计算属性
const tableColumns = computed(() => {
  if (!props.result?.data || props.result.data.length === 0) return []
  
  const firstItem = props.result.data[0]
  const columns = Object.keys(firstItem).map(key => ({
    title: key,
    dataIndex: key,
    key: key,
    ellipsis: true,
    width: 150
  }))
  
  return columns
})

const paginatedData = computed(() => {
  if (!props.result?.data) return []
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return props.result.data.slice(start, end).map((item, index) => ({
    ...item,
    key: start + index
  }))
})

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 初始化JSON编辑器
const initJsonEditor = async () => {
  if (!jsonEditorContainer.value) return
  
  jsonEditor = monaco.editor.create(jsonEditorContainer.value, {
    value: props.result ? JSON.stringify(props.result.data, null, 2) : '',
    language: 'json',
    theme: 'vs',
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14
  })
}

// 更新JSON编辑器内容
const updateJsonEditor = () => {
  if (jsonEditor && props.result) {
    jsonEditor.setValue(JSON.stringify(props.result.data, null, 2))
  }
}

// 表格分页变化
const handleTableChange = (pagination: any) => {
  currentPage.value = pagination.current
  pageSize.value = pagination.pageSize
}

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!props.result?.data) return
  
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.result.data, null, 2))
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 下载JSON文件
const downloadJson = () => {
  if (!props.result?.data) return
  
  const jsonStr = JSON.stringify(props.result.data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  saveAs(blob, `generated-data-${timestamp}.json`)
}

// 监听预览模式变化
watch(previewMode, async (newMode) => {
  if (newMode === 'json') {
    await nextTick()
    if (!jsonEditor) {
      await initJsonEditor()
    } else {
      updateJsonEditor()
    }
  }
})

// 监听结果变化
watch(() => props.result, () => {
  if (previewMode.value === 'json') {
    updateJsonEditor()
  }
  // 重置分页
  currentPage.value = 1
}, { deep: true })

// 生命周期
onMounted(async () => {
  if (previewMode.value === 'json') {
    await nextTick()
    await initJsonEditor()
  }
})

onUnmounted(() => {
  if (jsonEditor) {
    jsonEditor.dispose()
  }
})
</script>

<style scoped>
.json-preview {
  height: 100%;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

.preview-content {
  margin-top: 16px;
}

.stats-section {
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.preview-controls {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.table-view,
.json-view,
.raw-view {
  margin-top: 16px;
}
</style>