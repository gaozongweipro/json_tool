<template>
  <el-card 
    class="config-card"
    @click="$emit('load')"
    shadow="hover"
    tabindex="0"
    role="button"
    aria-label="加载配置"
    @keydown.enter="$emit('load')"
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
  position: relative;
  border-radius: var(--radius-2xl);
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-300) var(--ease-out);
  overflow: hidden;
}

.config-card:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.config-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gray-50);
  opacity: 0;
  transition: opacity var(--duration-300) var(--ease-out);
}

.config-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 4px;
  width: 100%;
  background: var(--primary);
  opacity: 0.6;
}

.config-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-200);
}

.config-card:hover::before {
  opacity: 1;
}

.config-card:active {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 调整 el-card 内边距 */
.config-card :deep(.el-card__body) {
  padding: var(--space-6);
}

/* Header */
.config-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.config-card-header h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 最多两行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Tag 轻量化 */
.config-card-header :deep(.el-tag) {
  border: none;
  font-weight: var(--font-medium);
  letter-spacing: 0.2px;
}

.config-card-header :deep(.el-tag--success) {
  background: var(--success-light);
  color: var(--success);
}

.config-card-header :deep(.el-tag--warning) {
  background: var(--warning-light);
  color: var(--warning);
}

/* 描述 */
.config-description {
  color: var(--color-text-secondary);
  margin: var(--space-3) 0 0;
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 最多两行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 元信息区域 */
.config-meta {
  margin: var(--space-6) 0 var(--space-2);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3) var(--space-4);
}

@media (max-width: 480px) {
  .config-meta {
    grid-template-columns: 1fr;
  }
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xs);
}

.meta-label {
  color: var(--color-text-muted);
}

.meta-value {
  color: var(--color-text-secondary);
  font-weight: var(--font-medium);
}

/* 操作区 */
.config-card-actions {
  margin-top: var(--space-6);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

/* 按钮视觉统一为现代风格 */
.config-card-actions :deep(.el-button--primary) {
  background: var(--primary);
  border-color: var(--primary);
  box-shadow: var(--shadow-xs);
}

.config-card-actions :deep(.el-button--primary:hover) {
  background: var(--primary-600);
  border-color: var(--primary-600);
  box-shadow: var(--shadow-sm);
}

.config-card-actions :deep(.el-button--danger) {
  background: var(--error);
  border-color: var(--error);
  box-shadow: var(--shadow-xs);
}

.config-card-actions :deep(.el-button--danger:hover) {
  filter: brightness(0.95);
  box-shadow: var(--shadow-sm);
}
</style>