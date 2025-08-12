<template>
  <div class="json-preview">
    <el-card shadow="never">
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

      <div v-loading="loading" element-loading-text="正在生成数据...">
        <!-- 调试信息 -->
        <div v-if="result" style="margin-bottom: 16px; padding: 8px; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 4px;">
          <p style="margin: 0; font-size: 12px; color: #0369a1;">
            调试信息: result存在={{ !!result }}, data存在={{ !!result?.data }}, data长度={{ result?.data?.length || 0 }}
          </p>
        </div>

        <div v-if="!result && !loading" class="empty-state">
          <el-empty description="暂无数据，请先配置规则并生成数据" />
        </div>

        <div v-else-if="result?.data && result.data.length > 0" class="preview-content">
          <!-- 统计信息 -->
          <div v-if="result.stats" class="stats-section">
            <el-descriptions :column="4" size="small" border>
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
            <el-radio-group v-model="previewMode" size="small">
              <el-radio-button value="table">表格视图</el-radio-button>
              <el-radio-button value="json">JSON视图</el-radio-button>
              <el-radio-button value="raw">原始数据</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 表格视图 -->
          <div v-if="previewMode === 'table'" class="table-view">
            <el-table
              :data="paginatedData"
              border
              size="small"
              style="width: 100%"
              max-height="500"
            >
              <el-table-column
                v-for="column in tableColumns"
                :key="column.key"
                :prop="column.key"
                :label="column.title"
                :width="column.width"
                show-overflow-tooltip
              />
            </el-table>
            
            <el-pagination
              v-if="result.data.length > pageSize"
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="result.data.length"
              layout="total, sizes, prev, pager, next, jumper"
              style="margin-top: 16px; text-align: center"
            />
          </div>

          <!-- JSON视图 -->
          <div v-else-if="previewMode === 'json'" class="json-view">
            <el-input
              type="textarea"
              :model-value="JSON.stringify(result.data, null, 2)"
              :rows="20"
              readonly
              style="font-family: 'Courier New', monospace; font-size: 12px;"
            />
          </div>

          <!-- 原始数据视图 -->
          <div v-else-if="previewMode === 'raw'" class="raw-view">
            <el-input
              type="textarea"
              :model-value="JSON.stringify(result.data, null, 2)"
              :rows="20"
              readonly
              style="font-family: 'Courier New', monospace; font-size: 12px;"
            />
          </div>
        </div>

        <!-- 数据为空的情况 -->
        <div v-else-if="result?.data && result.data.length === 0" class="empty-data">
          <el-alert
            title="生成结果为空"
            description="数据生成成功，但结果为空。请检查字段配置和生成策略。"
            type="warning"
            show-icon
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ElCard,
  ElSpace,
  ElTag,
  ElButton,
  ElEmpty,
  ElDescriptions,
  ElDescriptionsItem,
  ElRadioGroup,
  ElRadioButton,
  ElTable,
  ElTableColumn,
  ElInput,
  ElPagination,
  ElMessage,
  ElIcon,
  ElAlert
} from 'element-plus'
import {
  CopyDocument,
  Download
} from '@element-plus/icons-vue'
import type { GenerationResult } from '../types'

// Props
interface Props {
  result: GenerationResult | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  export: [format: string]
}>()

// State
const previewMode = ref<'table' | 'json' | 'raw'>('table')
const currentPage = ref(1)
const pageSize = ref(20)

// 计算属性
const tableColumns = computed(() => {
  if (!props.result?.data || props.result.data.length === 0) return []
  
  const firstItem = props.result.data[0]
  const columns = Object.keys(firstItem).map(key => ({
    title: key,
    key: key,
    width: 150
  }))
  
  return columns
})

const paginatedData = computed(() => {
  if (!props.result?.data) return []
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return props.result.data.slice(start, end)
})

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
  
  // 创建下载链接
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `generated-data-${timestamp}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('文件下载已开始')
  emit('export', 'json')
}

// 监听结果变化
watch(() => props.result, (newResult) => {
  console.log('JsonPreview 接收到新结果:', newResult)
  // 重置分页
  currentPage.value = 1
}, { deep: true })
</script>

<style scoped>
.json-preview {
  height: 100%;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

.empty-data {
  padding: 20px;
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