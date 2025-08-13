<template>
  <MainLayout 
    :current-step="currentStep"
    :steps="steps"
    :sidebar-collapsed="sidebarCollapsed"
    @go-home="goToHome"
    @toggle-sidebar="toggleSidebar"
    @step-click="handleStepClick"
  >
    <!-- 首页 -->
    <section v-if="currentStep === 0" class="home-section">
      <ConfigurationHome
        :local-configs="localConfigs"
        :imported-configs="importedConfigs"
        @start-new="startNewConfig"
        @load-config="loadConfigFromHome"
        @import-config="importConfigFromHome"
        @delete-local="deleteLocalConfig"
        @delete-imported="deleteImportedConfig"
      />
    </section>

    <!-- 配置步骤 -->
    <section v-else class="step-section">
      <StepLayout
        :title="getStepTitle()"
        :description="getStepDescription()"
        :step-title="steps[currentStep - 1]?.title"
        :show-prev-button="currentStep > 1"
        :show-next-button="currentStep < steps.length"
        :next-button-text="getNextButtonText()"
        :next-disabled="!canProceedToNext()"
        @prev-step="prevStep"
        @next-step="nextStep"
      >
        <!-- 步骤1: 生成策略 -->
        <div v-if="currentStep === 1" class="step-panel">
          <JsonGeneratorComponent
            v-model="strategyConfig"
            @configChange="handleStrategyChange"
          />
        </div>
        
        <!-- 步骤2: 字段配置 -->
        <div v-if="currentStep === 2" class="step-panel">
          <FieldsConfigComponent
            v-model="fields"
            :strategy-config="strategyConfig"
            @change="handleFieldsChange"
          />
        </div>
        
        <!-- 步骤3: 预览生成 -->
        <div v-if="currentStep === 3" class="step-panel">
          <DataPreviewPage
            :strategy-config="strategyConfig"
            :fields="fields"
            :generation-result="generationResult"
            :has-config-changed="hasConfigChanged"
            :generating="generating"
            @go-home="goToHome"
            @show-save-dialog="showSaveConfigDialog"
            @show-load-dialog="showLoadConfigDialog"
            @export-config="exportConfig"
            @clear-config="clearAllConfigs"
            @prev-step="prevStep"
            @edit-strategy="currentStep = 1"
            @edit-fields="currentStep = 2"
            @generate="handleGenerate"
            @export="handleExport"
          />
        </div>
      </StepLayout>
    </section>

    <!-- 保存配置对话框 -->
    <el-dialog
      v-model="showSaveDialog"
      title="保存配置"
      width="500px"
      :before-close="handleSaveDialogClose"
    >
      <el-form :model="saveConfigForm" label-width="80px">
        <el-form-item label="配置名称">
          <el-input 
            v-model="saveConfigForm.name" 
            placeholder="请输入配置名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="配置描述">
          <el-input 
            v-model="saveConfigForm.description" 
            type="textarea"
            placeholder="请输入配置描述（可选）"
            maxlength="200"
            show-word-limit
            :rows="3"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="handleSaveDialogClose">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmSaveConfig"
          :disabled="!saveConfigForm.name.trim()"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 加载配置对话框 -->
    <el-dialog
      v-model="showLoadDialog"
      title="加载配置"
      width="800px"
      :before-close="handleLoadDialogClose"
    >
      <el-tabs v-model="loadActiveTab">
        <el-tab-pane label="本地保存" name="local" v-if="localConfigs.length > 0">
          <div class="config-grid">
            <div 
              v-for="config in localConfigs" 
              :key="config.id"
              class="config-item"
              @click="loadSelectedConfig(config)"
            >
              <h4>{{ config.name }}</h4>
              <p>{{ config.description || '无描述' }}</p>
              <small>保存时间: {{ formatDate(config.savedAt) }}</small>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="导入配置" name="imported" v-if="importedConfigs.length > 0">
          <div class="config-grid">
            <div 
              v-for="config in importedConfigs" 
              :key="config.id"
              class="config-item"
              @click="loadSelectedConfig(config)"
            >
              <h4>{{ config.name }}</h4>
              <p>{{ config.description || '无描述' }}</p>
              <small>导入时间: {{ formatDate(config.importedAt) }}</small>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <el-button @click="handleLoadDialogClose">取消</el-button>
      </template>
    </el-dialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 导入布局组件
import MainLayout from './layouts/MainLayout.vue'
import StepLayout from './layouts/StepLayout.vue'

// 导入功能组件
import ConfigurationHome from './components/config/ConfigurationHome.vue'
import JsonGeneratorComponent from './components/common/JsonGeneratorComponent.vue'
import FieldsConfigComponent from './components/fields/FieldsConfigComponent.vue'
import DataPreviewPage from './components/preview/DataPreviewPage.vue'

// ===== 核心状态 =====
const currentStep = ref(0) // 当前步骤: 0=首页, 1=策略, 2=字段, 3=预览
const sidebarCollapsed = ref(false) // 侧边栏折叠状态

// ===== 配置数据 =====
const strategyConfig = ref({
  strategy: 'fixed',
  count: 10,
  isValid: false
})

const fields = ref([])
const generationResult = ref(null)
const generating = ref(false)
const hasConfigChanged = ref(false)

// ===== 配置管理 =====
const localConfigs = ref([])
const importedConfigs = ref([])

// ===== 对话框状态 =====
const showSaveDialog = ref(false)
const showLoadDialog = ref(false)
const loadActiveTab = ref('local')

const saveConfigForm = ref({
  name: '',
  description: ''
})

// ===== 步骤定义 =====
const steps = [
  { 
    title: '生成策略', 
    description: '配置数据生成的基本策略和参数',
    icon: 'Setting'
  },
  { 
    title: '字段配置', 
    description: '定义每个字段的类型和生成规则',
    icon: 'Grid'
  },
  { 
    title: '预览生成', 
    description: '预览数据并导出配置文件',
    icon: 'View'
  }
]

// ===== 计算属性 =====
const isFieldsValid = computed(() => {
  return fields.value.length > 0 && fields.value.every(field => field.name && field.type)
})

// ===== 核心方法 =====

// 侧边栏控制
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 步骤样式类
const getStepClasses = (stepNumber: number) => {
  return {
    'step-active': currentStep.value === stepNumber,
    'step-completed': currentStep.value > stepNumber,
    'step-clickable': stepNumber <= currentStep.value
  }
}

// 步骤点击
const handleStepClick = (stepNumber: number) => {
  if (stepNumber <= currentStep.value) {
    currentStep.value = stepNumber
  }
}

// 获取步骤标题
const getStepTitle = () => {
  const stepMap = {
    1: '配置生成策略',
    2: '配置数据字段',
    3: '预览与导出'
  }
  return stepMap[currentStep.value] || ''
}

// 获取步骤描述
const getStepDescription = () => {
  const descMap = {
    1: '选择数据生成的基本策略和参数设置',
    2: '定义每个字段的类型、数据源和生成规则',
    3: '预览生成的数据并导出配置文件'
  }
  return descMap[currentStep.value] || ''
}

// 检查是否可以进入下一步
const canProceedToNext = () => {
  switch (currentStep.value) {
    case 1: return strategyConfig.value?.isValid
    case 2: return isFieldsValid.value
    case 3: return false
    default: return false
  }
}

// 获取下一步按钮文本
const getNextButtonText = () => {
  const textMap = {
    1: '下一步：字段配置',
    2: '下一步：预览生成'
  }
  return textMap[currentStep.value] || '下一步'
}

// ===== 导航方法 =====
const goToHome = () => {
  currentStep.value = 0
}

const startNewConfig = () => {
  currentStep.value = 1
}

const nextStep = () => {
  if (currentStep.value < steps.length && canProceedToNext()) {
    currentStep.value += 1
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value -= 1
  }
}

// ===== 配置处理方法 =====
const handleStrategyChange = (config) => {
  strategyConfig.value = config
  hasConfigChanged.value = true
}

const handleFieldsChange = (newFields) => {
  fields.value = newFields
  hasConfigChanged.value = true
}

// ===== 首页事件处理 =====
const loadConfigFromHome = (config) => {
  strategyConfig.value = config.strategyConfig
  fields.value = config.fields
  hasConfigChanged.value = false
  currentStep.value = 1
  ElMessage.success(`已加载配置"${config.name}"`)
}

const importConfigFromHome = (config) => {
  importedConfigs.value.push(config)
  saveImportedConfigs()
}

const deleteLocalConfig = (configId) => {
  localConfigs.value = localConfigs.value.filter(c => c.id !== configId)
  saveLocalConfigs()
  ElMessage.success('配置已删除')
}

const deleteImportedConfig = (configId) => {
  importedConfigs.value = importedConfigs.value.filter(c => c.id !== configId)
  saveImportedConfigs()
  ElMessage.success('配置已删除')
}

// ===== 配置保存/加载 =====
const showSaveConfigDialog = () => {
  saveConfigForm.value = {
    name: '',
    description: ''
  }
  showSaveDialog.value = true
}

const showLoadConfigDialog = () => {
  loadActiveTab.value = localConfigs.value.length > 0 ? 'local' : 'imported'
  showLoadDialog.value = true
}

const handleSaveDialogClose = () => {
  showSaveDialog.value = false
}

const handleLoadDialogClose = () => {
  showLoadDialog.value = false
}

const confirmSaveConfig = () => {
  const config = {
    id: Date.now().toString(),
    name: saveConfigForm.value.name,
    description: saveConfigForm.value.description,
    strategyConfig: strategyConfig.value,
    fields: fields.value,
    savedAt: new Date().toISOString(),
    version: '1.0'
  }
  
  localConfigs.value.push(config)
  saveLocalConfigs()
  hasConfigChanged.value = false
  showSaveDialog.value = false
  ElMessage.success(`配置"${config.name}"已保存`)
}

const loadSelectedConfig = (config) => {
  strategyConfig.value = config.strategyConfig
  fields.value = config.fields
  hasConfigChanged.value = false
  showLoadDialog.value = false
  ElMessage.success(`已加载配置"${config.name}"`)
}

// ===== 本地存储 =====
const saveLocalConfigs = () => {
  localStorage.setItem('json-generator-local-configs', JSON.stringify(localConfigs.value))
}

const loadLocalConfigs = () => {
  const saved = localStorage.getItem('json-generator-local-configs')
  if (saved) {
    try {
      localConfigs.value = JSON.parse(saved)
    } catch (error) {
      console.error('加载本地配置失败:', error)
    }
  }
}

const saveImportedConfigs = () => {
  localStorage.setItem('json-generator-imported-configs', JSON.stringify(importedConfigs.value))
}

const loadImportedConfigs = () => {
  const saved = localStorage.getItem('json-generator-imported-configs')
  if (saved) {
    try {
      importedConfigs.value = JSON.parse(saved)
    } catch (error) {
      console.error('加载导入配置失败:', error)
    }
  }
}

// ===== 工具方法 =====
const formatDate = (dateString) => {
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

// ===== 占位符方法 =====
const exportConfig = () => {
  ElMessage.info('导出配置功能开发中...')
}

const clearAllConfigs = () => {
  ElMessageBox.confirm('确定要清除所有配置吗？此操作不可恢复。', '确认清除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localConfigs.value = []
    importedConfigs.value = []
    saveLocalConfigs()
    saveImportedConfigs()
    ElMessage.success('所有配置已清除')
  }).catch(() => {
    // 用户取消
  })
}

const handleGenerate = () => {
  generating.value = true
  // 模拟生成数据
  setTimeout(() => {
    generating.value = false
    generationResult.value = { 
      data: [], 
      count: strategyConfig.value.count 
    }
    ElMessage.success('数据生成完成')
  }, 2000)
}

const handleExport = (format) => {
  ElMessage.info(`导出${format}格式功能开发中...`)
}

// ===== 初始化 =====
// 组件挂载时加载配置
loadLocalConfigs()
loadImportedConfigs()

// 监听配置变化
watch([strategyConfig, fields], () => {
  hasConfigChanged.value = true
}, { deep: true })
</script>

// ... existing code ...

<style scoped>
/* ===== 现代化应用布局 ===== */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  color: var(--color-text-primary);
}

/* ===== 现代化头部样式 ===== */
.app-header {
  height: var(--header-height);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  box-shadow: var(--shadow-sm);
}

.header-container {
  max-width: var(--app-max-width);
  margin: 0 auto;
  height: 100%;
  padding: 0 var(--space-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-brand {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--primary);
  margin: 0;
  line-height: var(--leading-tight);
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
  font-weight: var(--font-medium);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* ===== 现代化主体布局 ===== */
.app-body {
  flex: 1;
  display: flex;
  max-width: var(--app-max-width);
  margin: 0 auto;
  width: 100%;
  min-height: calc(100vh - var(--header-height));
}

/* ===== 现代化侧边栏样式 ===== */
.app-sidebar {
  width: var(--sidebar-width-sm);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  transition: all var(--duration-300) var(--ease-out);
  position: sticky;
  top: var(--header-height);
  height: calc(100vh - var(--header-height));
  overflow: hidden;
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  background: rgba(var(--primary-50), 0.3);
}

.sidebar-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
  white-space: nowrap;
  opacity: 1;
  transition: opacity var(--duration-200) var(--ease-out);
}

.sidebar-collapsed .sidebar-title {
  opacity: 0;
}

.sidebar-toggle {
  flex-shrink: 0;
  border-radius: var(--radius-lg);
  background: white;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xs);
  transition: all var(--duration-200) var(--ease-out);
}

.sidebar-toggle:hover {
  box-shadow: var(--shadow-sm);
  transform: scale(1.05);
}

/* ===== 现代化步骤导航 ===== */
.steps-navigation {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  position: relative;
  overflow-y: auto;
}

.progress-track {
  position: absolute;
  left: calc(var(--space-6) + 20px);
  top: var(--space-12);
  bottom: var(--space-12);
  width: 3px;
  background: var(--color-border-light);
  border-radius: var(--radius-full);
}

.progress-fill {
  width: 100%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: var(--radius-full);
  transition: height var(--duration-700) var(--ease-out);
}

.steps-list {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
  z-index: 1;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  border-radius: var(--radius-xl);
  cursor: default;
  transition: all var(--duration-300) var(--ease-out);
  position: relative;
}

.step-clickable {
  cursor: pointer;
}

.step-clickable:hover {
  background: rgba(var(--primary-50), 0.5);
  transform: translateX(4px);
}

.step-active {
  background: linear-gradient(135deg, var(--primary-50), var(--secondary-50));
  color: var(--color-text-primary);
  box-shadow: var(--shadow-sm);
}

.step-marker {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  flex-shrink: 0;
  transition: all var(--duration-300) var(--ease-out);
  background: white;
  color: var(--color-text-muted);
  border: 2px solid var(--color-border);
  box-shadow: var(--shadow-xs);
}

.step-active .step-marker,
.step-completed .step-marker {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border-color: transparent;
  box-shadow: var(--shadow-md);
}

.step-content {
  flex: 1;
  min-width: 0;
  opacity: 1;
  transition: all var(--duration-200) var(--ease-out);
}

.sidebar-collapsed .step-content {
  opacity: 0;
  pointer-events: none;
}

.step-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
  line-height: var(--leading-tight);
}

.step-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

/* ===== 现代化主内容区 ===== */
.app-main {
  flex: 1;
  min-width: 0;
  background: var(--color-background);
  transition: margin-left var(--duration-300) var(--ease-out);
}

.main-expanded {
  margin-left: 0;
}

.main-container {
  height: 100%;
  overflow-y: auto;
}

/* ===== 现代化页面区块 ===== */
.home-section {
  padding: var(--space-10);
  max-width: 1200px;
  margin: 0 auto;
}

.step-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.step-wrapper {
  flex: 1;
  background: white;
  margin: var(--space-8);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--color-border-light);
}

/* ===== 现代化步骤头部 ===== */
.step-header {
  padding: var(--space-10) var(--space-10) var(--space-8);
  border-bottom: 1px solid var(--color-border-light);
  background: linear-gradient(135deg, var(--gray-50), rgba(var(--primary-50), 0.3));
}

.step-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-medium);
}

.breadcrumb-separator {
  color: var(--color-text-muted);
  font-weight: var(--font-normal);
}

.breadcrumb-current {
  color: var(--primary);
  font-weight: var(--font-semibold);
}

.step-heading {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-3);
  line-height: var(--leading-tight);
  background: linear-gradient(135deg, var(--color-text-primary), var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.step-subtitle {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
  font-weight: var(--font-medium);
}

/* ===== 现代化步骤内容 ===== */
.step-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.step-panel {
  padding: var(--space-10);
  height: 100%;
}

/* ===== 现代化步骤操作 ===== */
.step-actions {
  padding: var(--space-8) var(--space-10);
  border-top: 1px solid var(--color-border-light);
  background: var(--gray-50);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
}

.actions-left,
.actions-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* ===== 响应式设计 ===== */

/* 超小屏幕 (< 480px) */
@media (max-width: 479px) {
  .header-container {
    padding: 0 var(--space-4);
  }
  
  .brand-title {
    font-size: var(--text-xl);
  }
  
  .brand-subtitle {
    font-size: var(--text-xs);
  }
  
  .app-body {
    flex-direction: column;
  }
  
  .app-sidebar {
    width: 100%;
    height: auto;
    position: static;
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
    max-height: 240px;
  }
  
  .sidebar-collapsed {
    width: 100%;
  }
  
  .steps-navigation {
    padding: var(--space-4);
  }
  
  .steps-list {
    display: flex;
    gap: var(--space-3);
    overflow-x: auto;
    padding-bottom: var(--space-3);
  }
  
  .step-item {
    flex-direction: column;
    text-align: center;
    min-width: 100px;
    margin-bottom: 0;
    padding: var(--space-3);
  }
  
  .step-content {
    margin-top: var(--space-2);
  }
  
  .step-description {
    display: none;
  }
  
  .progress-track {
    display: none;
  }
  
  .home-section {
    padding: var(--space-4);
  }
  
  .step-wrapper {
    margin: var(--space-4);
  }
  
  .step-header {
    padding: var(--space-6);
  }
  
  .step-heading {
    font-size: var(--text-2xl);
  }
  
  .step-subtitle {
    font-size: var(--text-base);
  }
  
  .step-panel {
    padding: var(--space-6);
  }
  
  .step-actions {
    padding: var(--space-4);
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .actions-left,
  .actions-right {
    width: 100%;
    justify-content: center;
  }
  
  .step-actions .el-button {
    flex: 1;
  }
}

/* 小屏幕 (480px - 767px) */
@media (min-width: 480px) and (max-width: 767px) {
  .app-body {
    flex-direction: column;
  }
  
  .app-sidebar {
    width: 100%;
    height: auto;
    position: static;
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
  }
  
  .sidebar-collapsed {
    width: 100%;
  }
  
  .steps-list {
    display: flex;
    justify-content: space-between;
  }
  
  .step-item {
    flex: 1;
    text-align: center;
    flex-direction: column;
  }
  
  .progress-track {
    left: 50%;
    transform: translateX(-50%);
    top: var(--space-6);
    bottom: auto;
    height: 3px;
    width: calc(100% - var(--space-8));
  }
  
  .progress-fill {
    width: calc(var(--step-progress) * 100%);
    height: 100%;
  }
  
  .home-section {
    padding: var(--space-6);
  }
  
  .step-wrapper {
    margin: var(--space-4);
  }
  
  .step-actions {
    flex-direction: column;
  }
  
  .actions-left,
  .actions-right {
    width: 100%;
    justify-content: center;
  }
}

/* 中等屏幕 (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .app-sidebar {
    width: 300px;
  }
  
  .home-section {
    padding: var(--space-8);
  }
  
  .step-wrapper {
    margin: var(--space-6);
  }
  
  .step-header {
    padding: var(--space-8);
  }
  
  .step-panel {
    padding: var(--space-8);
  }
}

/* 大屏幕 (1024px - 1279px) */
@media (min-width: 1024px) and (max-width: 1279px) {
  .app-sidebar {
    width: var(--sidebar-width-sm);
  }
}

/* 超大屏幕 (≥ 1280px) */
@media (min-width: 1280px) {
  .app-sidebar {
    width: var(--sidebar-width-md);
  }
  
  .home-section {
    padding: var(--space-12);
  }
  
  .step-wrapper {
    margin: var(--space-10);
  }
  
  .step-header {
    padding: var(--space-12) var(--space-12) var(--space-10);
  }
  
  .step-heading {
    font-size: var(--text-5xl);
  }
  
  .step-panel {
    padding: var(--space-12);
  }
  
  .step-actions {
    padding: var(--space-10) var(--space-12);
  }
}

/* ===== 无障碍性增强 ===== */
@media (prefers-reduced-motion: reduce) {
  .app-sidebar,
  .step-marker,
  .progress-fill,
  .step-item,
  .sidebar-toggle {
    transition: none;
  }
}

/* ===== 打印样式 ===== */
@media print {
  .app-sidebar,
  .step-actions,
  .header-actions {
    display: none;
  }
  
  .app-main {
    margin-left: 0;
  }
  
  .step-wrapper {
    box-shadow: none;
    border: 2px solid var(--gray-400);
    margin: 0;
  }
}
</style>