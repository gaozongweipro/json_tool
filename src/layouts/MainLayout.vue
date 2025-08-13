<template>
  <div class="app-layout">
    <!-- 应用头部 -->
    <header class="app-header">
      <div class="header-container">
        <div class="header-brand">
          <h1 class="brand-title">JSON数据生成器</h1>
          <p class="brand-subtitle">智能配置，快速生成高质量测试数据</p>
        </div>
        
        <!-- 头部操作区 -->
        <div class="header-actions" v-if="currentStep > 0">
          <el-button 
            size="small" 
            @click="goToHome"
            icon="House"
          >
            返回首页
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="app-body">
      <!-- 侧边导航 -->
      <aside class="app-sidebar" v-if="currentStep > 0" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <div class="sidebar-header">
          <h3 class="sidebar-title">配置向导</h3>
          <el-button 
            class="sidebar-toggle" 
            size="small" 
            text 
            @click="toggleSidebar"
            :icon="sidebarCollapsed ? 'Expand' : 'Fold'"
          />
        </div>
        
        <nav class="steps-navigation">
          <!-- 进度指示器 -->
          <div class="progress-track">
            <div 
              class="progress-fill" 
              :style="{ height: `${(currentStep / steps.length) * 100}%` }"
            ></div>
          </div>
          
          <!-- 步骤列表 -->
          <ol class="steps-list">
            <li 
              v-for="(step, index) in steps" 
              :key="index"
              class="step-item"
              :class="getStepClasses(index + 1)"
              @click="handleStepClick(index + 1)"
            >
              <div class="step-marker">
                <span v-if="currentStep > index + 1" class="step-icon">✓</span>
                <span v-else class="step-number">{{ index + 1 }}</span>
              </div>
              
              <div class="step-content" v-if="!sidebarCollapsed">
                <h4 class="step-title">{{ step.title }}</h4>
                <p class="step-description">{{ step.description }}</p>
              </div>
            </li>
          </ol>
        </nav>
      </aside>

      <!-- 主内容 -->
      <main class="app-main" :class="{ 'main-expanded': currentStep === 0 || sidebarCollapsed }">
        <div class="main-container">
          <slot></slot>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  currentStep: {
    type: Number,
    default: 0
  },
  steps: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['go-home', 'toggle-sidebar', 'step-click']);

const sidebarCollapsed = ref(false);

function goToHome() {
  emit('go-home');
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  emit('toggle-sidebar', sidebarCollapsed.value);
}

function handleStepClick(stepIndex) {
  emit('step-click', stepIndex);
}

function getStepClasses(stepIndex) {
  return {
    'step-active': props.currentStep === stepIndex,
    'step-completed': props.currentStep > stepIndex,
    'step-pending': props.currentStep < stepIndex
  };
}
</script>

<style scoped>
/* 从App.vue复制相关样式 */
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.header-brand {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.brand-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0;
}

.app-body {
  display: flex;
  flex: 1;
  background-color: var(--color-background-soft);
}

.app-sidebar {
  width: 280px;
  background-color: var(--color-background);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.steps-navigation {
  flex: 1;
  padding: 1rem 0;
  position: relative;
  overflow-y: auto;
}

.progress-track {
  position: absolute;
  left: 2rem;
  top: 2rem;
  bottom: 2rem;
  width: 2px;
  background-color: var(--color-border);
}

.progress-fill {
  background-color: var(--color-primary);
  width: 100%;
  transition: height 0.3s ease;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.step-item {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.step-item:hover {
  background-color: var(--color-background-mute);
}

.step-marker {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--color-background);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.step-active .step-marker {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.step-completed .step-marker {
  background-color: var(--color-success);
  border-color: var(--color-success);
  color: white;
}

.step-content {
  flex: 1;
}

.step-title {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.step-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.app-main {
  flex: 1;
  padding: 1.5rem;
  transition: margin-left 0.3s ease;
}

.main-expanded {
  margin-left: 0;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>