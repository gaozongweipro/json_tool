<template>
  <div class="preview-container">
    <!-- 返回首页按钮 -->
    <div class="back-to-home">
      <el-button @click="$emit('goHome')">
        <template #icon><Folder /></template>
        返回配置首页
      </el-button>
    </div>
    
    <!-- 配置变更提醒 -->
    <el-alert
      v-if="hasConfigChanged && !configChangeAlertDismissed"
      title="配置已变更"
      type="warning"
      description="检测到生成策略或字段配置有变更，建议重新生成数据以获得最新结果。"
      show-icon
      closable
      @close="configChangeAlertDismissed = true"
      class="config-change-alert"
    />
    
    <!-- 配置摘要 -->
    <div class="config-summary">
      <h3>📊 配置摘要</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="生成策略">
          {{ getStrategyLabel(strategyConfig.strategy) }}
        </el-descriptions-item>
        <el-descriptions-item label="预计生成数量">
          {{ estimatedCount }} 条
        </el-descriptions-item>
        <el-descriptions-item label="字段数量">
          {{ fields.length }} 个
        </el-descriptions-item>
        <el-descriptions-item label="配置状态">
          <el-tag :type="isConfigValid ? 'success' : 'danger'">
            {{ isConfigValid ? '配置完整' : '配置不完整' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>
    
    <!-- 字段预览 -->
    <div class="fields-preview">
      <h3>🔧 字段配置预览</h3>
      <el-table :data="fields" border style="width: 100%">
        <el-table-column prop="name" label="字段名" width="150" />
        <el-table-column prop="dataSource" label="数据来源" width="120">
          <template #default="scope">
            {{ getDataSourceLabel(scope.row.dataSource) }}
          </template>
        </el-table-column>
        <el-table-column label="配置详情" min-width="200">
          <template #default="scope">
            {{ getSourceConfigDisplay(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="isSourceConfigValid(scope.row) ? 'success' : 'danger'" size="small">
              {{ isSourceConfigValid(scope.row) ? '有效' : '无效' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 配置操作区域 -->
    <div class="config-operations">
      <h3>⚙️ 配置管理</h3>
      <div class="config-buttons">
        <el-button @click="$emit('showSaveDialog')">
          <template #icon><DocumentAdd /></template>
          保存配置
        </el-button>
        <el-button @click="$emit('showLoadDialog')">
          <template #icon><FolderOpened /></template>
          加载配置
        </el-button>
        <el-button @click="$emit('exportConfig')">
          <template #icon><Download /></template>
          导出配置
        </el-button>
        <el-button @click="$emit('clearConfig')" type="danger">
          <template #icon><Delete /></template>
          清除配置
        </el-button>
      </div>
    </div>
    
    <!-- 生成操作区域 -->
    <div class="generate-actions">
      <div class="nav-buttons">
        <el-button @click="$emit('prevStep')">
          <template #icon><ArrowLeft /></template>
          上一步：字段配置
        </el-button>
        <el-button @click="$emit('editStrategy')">
          <template #icon><Edit /></template>
          修改生成策略
        </el-button>
        <el-button @click="$emit('editFields')">
          <template #icon><Setting /></template>
          修改字段配置
        </el-button>
      </div>
      
      <div class="action-buttons">
        <el-button
          type="primary"
          size="large"
          @click="$emit('generate')"
          :disabled="!isConfigValid"
          :loading="generating"
        >
          <template #icon><Refresh /></template>
          {{ generationResult ? '重新生成数据' : '生成数据' }}
        </el-button>
      </div>
    </div>
    
    <!-- 数据预览区域 -->
    <div v-if="generationResult" class="data-preview">
      <JsonPreview
        :data="generationResult.data"
        :total-count="generationResult.totalCount"
        :generation-time="generationResult.generationTime"
        @export="$emit('export', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
  Folder, DocumentAdd, FolderOpened, Download, Delete, 
  ArrowLeft, Edit, Setting, Refresh 
} from '@element-plus/icons-vue'
import JsonPreview from './JsonPreview.vue'

interface Props {
  strategyConfig: any
  fields: any[]
  generationResult: any
  hasConfigChanged: boolean
  generating: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  goHome: []
  showSaveDialog: []
  showLoadDialog: []
  exportConfig: []
  clearConfig: []
  prevStep: []
  editStrategy: []
  editFields: []
  generate: []
  export: [format: string]
}>()

const configChangeAlertDismissed = ref(false)

const estimatedCount = computed(() => {
  // 根据策略配置计算预计生成数量
  switch (props.strategyConfig.strategy) {
    case 'fixed':
      return props.strategyConfig.fixedCount || 0
    case 'traverse':
      if (props.strategyConfig.traverseType === 'json') {
        try {
          const data = JSON.parse(props.strategyConfig.jsonData || '[]')
          return Array.isArray(data) ? data.length : 0
        } catch {
          return 0
        }
      } else if (props.strategyConfig.traverseType === 'range') {
        const start = props.strategyConfig.rangeStart || 0
        const end = props.strategyConfig.rangeEnd || 0
        const step = props.strategyConfig.rangeStep || 1
        return Math.max(0, Math.floor((end - start) / step) + 1)
      }
      return 0
    case 'complex':
      // 复杂遍历的数量计算
      const levels = props.strategyConfig.complexLevels || []
      if (levels.length === 0) return 0
      
      let totalCount = 1
      levels.forEach((level: any) => {
        if (level.sourceType === 'json') {
          try {
            const data = JSON.parse(level.jsonData || '[]')
            totalCount *= Array.isArray(data) ? data.length : 1
          } catch {
            totalCount *= 1
          }
        } else {
          const start = level.rangeStart || 0
          const end = level.rangeEnd || 0
          const step = level.step || 1
          totalCount *= Math.max(1, Math.floor((end - start) / step) + 1)
        }
      })
      return totalCount
    default:
      return 0
  }
})

const isConfigValid = computed(() => {
  return props.strategyConfig.isValid && 
         props.fields.length > 0 && 
         props.fields.every(isSourceConfigValid)
})

const isSourceConfigValid = (field: any) => {
  switch (field.dataSource) {
    case 'fixed':
      return field.sourceConfig?.fixedValue !== undefined && field.sourceConfig.fixedValue !== ''
    case 'increment':
      return field.sourceConfig?.startValue !== undefined && field.sourceConfig?.step > 0
    case 'template':
      return field.sourceConfig?.template && field.sourceConfig.template.trim() !== ''
    default:
      return false
  }
}

const getStrategyLabel = (strategy: string) => {
  const labels: Record<string, string> = {
    fixed: '固定数量生成',
    traverse: '数据遍历生成',
    complex: '复杂遍历生成'
  }
  return labels[strategy] || strategy
}

const getDataSourceLabel = (dataSource: string) => {
  const labels: Record<string, string> = {
    fixed: '固定值',
    increment: '递增序列',
    template: '自定义模板'
  }
  return labels[dataSource] || dataSource
}

const getSourceConfigDisplay = (field: any) => {
  switch (field.dataSource) {
    case 'fixed':
      return field.sourceConfig.fixedValue || '-'
    case 'increment':
      return `起始: ${field.sourceConfig.startValue}, 步长: ${field.sourceConfig.step}`
    case 'template':
      return field.sourceConfig.template || '-'
    default:
      return '-'
  }
}
</script>

<style scoped>
.preview-container {
  max-width: 100%;
}

.back-to-home {
  margin-bottom: var(--spacing-lg);
}

.config-change-alert {
  margin-bottom: var(--spacing-lg);
}

.config-summary {
  margin-bottom: var(--spacing-xl);
}

.config-summary h3,
.fields-preview h3,
.config-operations h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.fields-preview {
  margin-bottom: var(--spacing-xl);
}

.config-operations {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.config-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
}

.generate-actions {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(99, 102, 241, 0.05) 100%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.nav-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  justify-content: center;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.data-preview {
  margin-top: var(--spacing-xl);
}
</style>