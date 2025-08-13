<template>
  <div class="step-wrapper">
    <!-- 步骤头部 -->
    <header class="step-header">
      <div class="step-breadcrumb">
        <span class="breadcrumb-item">配置向导</span>
        <span class="breadcrumb-separator">·</span>
        <span class="breadcrumb-current">{{ title }}</span>
      </div>
      <h2 class="step-heading">{{ title }}</h2>
      <p class="step-subtitle">{{ description }}</p>
    </header>

    <!-- 步骤内容 -->
    <div class="step-content">
      <slot></slot>
    </div>

    <!-- 步骤操作 -->
    <footer class="step-actions">
      <div class="actions-left">
        <slot name="actions-left">
          <el-button 
            v-if="showPrevButton" 
            @click="$emit('prev-step')"
            icon="ArrowLeft"
          >
            上一步
          </el-button>
        </slot>
      </div>
      
      <div class="actions-right">
        <slot name="actions-right">
          <el-button 
            v-if="showNextButton"
            type="primary"
            @click="$emit('next-step')"
            :disabled="nextDisabled"
            icon="ArrowRight"
            icon-placement="right"
          >
            {{ nextButtonText }}
          </el-button>
        </slot>
      </div>
    </footer>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  showPrevButton: {
    type: Boolean,
    default: true
  },
  showNextButton: {
    type: Boolean,
    default: true
  },
  nextButtonText: {
    type: String,
    default: '下一步'
  },
  nextDisabled: {
    type: Boolean,
    default: false
  }
});

defineEmits(['prev-step', 'next-step']);
</script>

<style scoped>
.step-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: var(--color-background);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  padding: 1.5rem;
}

.step-header {
  margin-bottom: 1rem;
}

.step-breadcrumb {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
}

.breadcrumb-current {
  font-weight: 500;
  color: var(--color-primary);
}

.step-heading {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem;
}

.step-subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.step-content {
  flex: 1;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}
</style>