<template>
  <el-dropdown :disabled="disabled">
    <el-button :disabled="disabled">
      <template #icon><el-icon><Download /></el-icon></template>
      导出数据
      <el-icon><ArrowDown /></el-icon>
    </el-button>
    
    <template #dropdown>
      <el-dropdown-menu @command="handleMenuClick">
        <el-dropdown-item command="json">
          <el-icon><Document /></el-icon>
          导出为 JSON
        </el-dropdown-item>
        <el-dropdown-item command="jsonl">
          <el-icon><Document /></el-icon>
          导出为 JSONL
        </el-dropdown-item>
        <el-dropdown-item command="csv">
          <el-icon><Grid /></el-icon>
          导出为 CSV
        </el-dropdown-item>
        <el-dropdown-item divided />
        <el-dropdown-item command="custom">
          <el-icon><Setting /></el-icon>
          自定义导出
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>

  <!-- 自定义导出对话框 -->
  <el-dialog
    v-model="customExportVisible"
    title="自定义导出"
    width="600px"
    @confirm="handleCustomExport"
  >
    <el-form :model="exportConfig" label-position="top">
      <el-form-item label="导出格式">
        <el-radio-group v-model="exportConfig.format">
          <el-radio value="json">JSON</el-radio>
          <el-radio value="jsonl">JSONL</el-radio>
          <el-radio value="csv">CSV</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="文件名">
        <el-input
          v-model="exportConfig.filename"
          placeholder="请输入文件名（不含扩展名）"
        />
      </el-form-item>

      <el-form-item v-if="exportConfig.format === 'json'" label="JSON选项">
        <el-space direction="vertical" style="width: 100%">
          <el-checkbox v-model="exportConfig.prettify">
            格式化输出（美化JSON）
          </el-checkbox>
          <el-checkbox v-model="exportConfig.minify">
            压缩输出（移除空格）
          </el-checkbox>
        </el-space>
      </el-form-item>

      <el-form-item v-if="exportConfig.format === 'csv'" label="CSV选项">
        <el-space direction="vertical" style="width: 100%">
          <div>
            <label>分隔符：</label>
            <el-radio-group v-model="exportConfig.csvSeparator" size="small">
              <el-radio value=",">逗号 (,)</el-radio>
              <el-radio value=";">分号 (;)</el-radio>
              <el-radio value="\t">制表符</el-radio>
            </el-radio-group>
          </div>
          <el-checkbox v-model="exportConfig.includeHeaders">
            包含表头
          </el-checkbox>
          <el-checkbox v-model="exportConfig.quoteStrings">
            字符串加引号
          </el-checkbox>
        </el-space>
      </el-form-item>

      <el-form-item label="数据范围">
        <el-space direction="vertical" style="width: 100%">
          <el-radio-group v-model="exportConfig.range">
            <el-radio value="all">全部数据</el-radio>
            <el-radio value="current">当前页数据</el-radio>
            <el-radio value="custom">自定义范围</el-radio>
          </el-radio-group>
          
          <div v-if="exportConfig.range === 'custom'">
            <el-space>
              <span>从第</span>
              <el-input-number
                v-model="exportConfig.startIndex"
                :min="1"
                :max="data.length"
                size="small"
              />
              <span>条到第</span>
              <el-input-number
                v-model="exportConfig.endIndex"
                :min="exportConfig.startIndex || 1"
                :max="data.length"
                size="small"
              />
              <span>条</span>
            </el-space>
          </div>
        </el-space>
      </el-form-item>

      <el-form-item label="字段选择">
        <el-checkbox-group
          v-model="exportConfig.selectedFields"
          style="width: 100%"
        >
          <el-row>
            <el-col v-for="field in availableFields" :key="field" :span="8">
              <el-checkbox :value="field">{{ field }}</el-checkbox>
            </el-col>
          </el-row>
        </el-checkbox-group>
        
        <div style="margin-top: 8px">
          <el-space>
            <el-button size="small" @click="selectAllFields">全选</el-button>
            <el-button size="small" @click="clearAllFields">清空</el-button>
          </el-space>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElRadioGroup,
  ElRadio,
  ElInput,
  ElCheckbox,
  ElCheckboxGroup,
  ElSpace,
  ElRow,
  ElCol,
  ElInputNumber,
  ElMessage,
  ElIcon
} from 'element-plus'
import {
  Download,
  ArrowDown,
  Document,
  Grid,
  Setting
} from '@element-plus/icons-vue'
import { saveAs } from 'file-saver'
import { exportToJson, exportToJsonl, exportToCsv } from '../utils'

// Props
interface Props {
  data: any[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// Emits
const emit = defineEmits<{
  export: [options: any]
}>()

// State
const customExportVisible = ref(false)
const exportConfig = ref({
  format: 'json' as 'json' | 'jsonl' | 'csv',
  filename: '',
  prettify: true,
  minify: false,
  csvSeparator: ',',
  includeHeaders: true,
  quoteStrings: true,
  range: 'all' as 'all' | 'current' | 'custom',
  startIndex: 1,
  endIndex: 1,
  selectedFields: [] as string[]
})

// 计算可用字段
const availableFields = computed(() => {
  if (!props.data || props.data.length === 0) return []
  
  const fields = new Set<string>()
  props.data.forEach(item => {
    Object.keys(item).forEach(key => fields.add(key))
  })
  
  return Array.from(fields)
})

// 监听数据变化，更新配置
watch(() => props.data, (newData) => {
  if (newData && newData.length > 0) {
    exportConfig.value.endIndex = newData.length
    if (exportConfig.value.selectedFields.length === 0) {
      exportConfig.value.selectedFields = availableFields.value.slice(0, 5) // 默认选择前5个字段
    }
  }
}, { immediate: true })

// 处理菜单点击
const handleMenuClick = (command: string) => {
  if (command === 'custom') {
    customExportVisible.value = true
    return
  }
  
  const options = {
    format: command,
    filename: `export_${Date.now()}`,
    data: props.data
  }
  
  performExport(options)
  emit('export', options)
}

// 全选字段
const selectAllFields = () => {
  exportConfig.value.selectedFields = [...availableFields.value]
}

// 清空字段选择
const clearAllFields = () => {
  exportConfig.value.selectedFields = []
}

// 处理自定义导出
const handleCustomExport = () => {
  if (!exportConfig.value.filename.trim()) {
    ElMessage.error('请输入文件名')
    return
  }
  
  if (exportConfig.value.selectedFields.length === 0) {
    ElMessage.error('请至少选择一个字段')
    return
  }
  
  // 获取导出数据
  let exportData = [...props.data]
  
  // 应用数据范围
  if (exportConfig.value.range === 'custom') {
    const start = exportConfig.value.startIndex - 1
    const end = exportConfig.value.endIndex
    exportData = exportData.slice(start, end)
  }
  
  // 应用字段选择
  exportData = exportData.map(item => {
    const filtered: any = {}
    exportConfig.value.selectedFields.forEach(field => {
      if (field in item) {
        filtered[field] = item[field]
      }
    })
    return filtered
  })
  
  const options = {
    ...exportConfig.value,
    data: exportData
  }
  
  performExport(options)
  emit('export', options)
  customExportVisible.value = false
}

// 执行导出
const performExport = (options: any) => {
  try {
    let content: string
    let mimeType: string
    let extension: string
    
    switch (options.format) {
      case 'json':
        content = exportToJson(options.data, {
          prettify: options.prettify,
          minify: options.minify
        })
        mimeType = 'application/json'
        extension = 'json'
        break
        
      case 'jsonl':
        content = exportToJsonl(options.data)
        mimeType = 'application/jsonl'
        extension = 'jsonl'
        break
        
      case 'csv':
        content = exportToCsv(options.data, {
          separator: options.csvSeparator,
          includeHeaders: options.includeHeaders,
          quoteStrings: options.quoteStrings
        })
        mimeType = 'text/csv'
        extension = 'csv'
        break
        
      default:
        throw new Error(`不支持的导出格式: ${options.format}`)
    }
    
    const blob = new Blob([content], { type: mimeType })
    const filename = `${options.filename}.${extension}`
    saveAs(blob, filename)
    
    ElMessage.success(`已导出 ${filename}`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}
</script>

<style scoped>
.export-panel {
  display: inline-block;
}
</style>