<template>
  <el-card 
    class="config-card"
    @click="$emit('load')"
    shadow="hover"
  >
    <div class="config-card-header">
      <h4>{{ config.name }}</h4>
      <el-tag 
        size="small" 
        :type="type === 'local' ? 'success' : 'warning'"
      >
        {{ type === 'local' ? '本地保存' : '导入配置' }}
      </el-tag>
    </div>
    <p class="config-description">{{ config.description || '无描述' }}</p>
    <div class="config-meta">
      <div class="meta-item">
        <span class="meta-label">{{ type === 'local' ? '保存时间' : '导入时间' }}:</span>
        <span class="meta-value">{{ formatDate(config.savedAt || config.importedAt) }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">策略:</span>
        <span class="meta-value">{{ getStrategyLabel(config.strategyConfig.strategy) }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">字段:</span>
        <span class="meta-value">{{ config.fields.length }} 个</span>
      </div>
    </div>
    <div class="config-card-actions" @click.stop>
      <el-button 
        size="small" 
        type="primary"
        @click="$emit('load')"
      >
        加载
      </el-button>
      <el-button 
        size="small" 
        type="danger" 
        @click="$emit('delete')"
      >
        删除
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
interface Props {
  config: any
  type: 'local' | 'imported'
}

defineProps<Props>()

defineEmits<{
  load: []
  delete: []
}>()

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '-'
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
</script>

<style scoped>
.config-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  position: relative;
  box-shadow: var(--shadow-sm);
}

.config-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(99, 102, 241, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.config-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.config-card:hover::before {
  opacity: 1;
}

.config-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  position: relative;
  z-index: 1;
}

.config-card-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
}

.config-description {
  color: var(--text-secondary);
  margin: var(--spacing-sm) 0;
  font-size: 0.875rem;
  line-height: 1.5;
  position: relative;
  z-index: 1;
}

.config-meta {
  margin: var(--spacing-md) 0;
  position: relative;
  z-index: 1;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.meta-label {
  color: var(--text-muted);
}

.meta-value {
  color: var(--text-secondary);
  font-weight: 500;
}

.config-card-actions {
  margin-top: var(--spacing-sm);
  display: flex;
  gap: var(--spacing-sm);
  position: relative;
  z-index: 1;
}
</style>