<template>
  <el-config-provider :locale="zhCN">
    <div class="app">
      <header class="app-header">
        <h1>JSON数据生成工具</h1>
        <p>快速生成测试数据，支持多种生成策略和字段配置</p>
      </header>
      
      <main class="app-main">
        <!-- 步骤导航 -->
        <div class="steps-container" v-if="currentStep > 0">
          <el-steps :active="currentStep - 1" finish-status="success" align-center>
            <el-step title="生成策略" description="选择数据生成方式" />
            <el-step title="字段配置" description="配置JSON字段信息" />
            <el-step title="预览生成" description="生成并预览数据" />
          </el-steps>
        </div>
        
        <!-- 步骤0: 配置管理首页 -->
        <div v-if="currentStep === 0" class="step-content">
          <ConfigurationHome
            :local-configs="localConfigs"
            :imported-configs="importedConfigs"
            @start-new="startNewConfig"
            @load-config="loadConfigFromHome"
            @delete-local="deleteLocalConfig"
            @delete-imported="deleteImportedConfig"
            @import-config="handleImportConfig"
          />
        </div>
        
        <!-- 步骤1: 生成策略 -->
        <div v-if="currentStep === 1" class="step-content">
          <JsonGeneratorComponent
            :initial-config="strategyConfig"
            @nextStep="handleStrategyNext"
            @configChange="handleStrategyChange"
          />
        </div>
        
        <!-- 步骤2: 字段配置 -->
        <div v-if="currentStep === 2" class="step-content">
          <FieldsConfigComponent
            v-model="fields"
            :strategy-config="strategyConfig"
            @change="handleFieldsChange"
          />
          
          <!-- 步骤导航按钮 -->
          <div class="step-actions">
            <el-button @click="prevStep">上一步</el-button>
            <el-button
              type="primary"
              @click="nextStep"
              :disabled="!isFieldsValid"
            >
              下一步：预览生成
            </el-button>
          </div>
        </div>
        
        <!-- 步骤3: 预览生成 -->
        <div v-if="currentStep === 3" class="step-content">
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
      </main>
      
      <!-- 保存配置对话框 -->
      <el-dialog
        v-model="saveConfigDialogVisible"
        title="保存配置"
        width="500px"
        class="config-dialog"
      >
        <el-form :model="saveConfigForm" label-width="80px" class="config-form">
          <el-form-item label="配置名称" required>
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
          <div class="dialog-footer">
            <el-button @click="saveConfigDialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              @click="confirmSaveConfig"
              :disabled="!saveConfigForm.name.trim()"
            >
              保存
            </el-button>
          </div>
        </template>
      </el-dialog>
      
      <!-- 加载配置对话框 -->
      <el-dialog
        v-model="loadConfigDialogVisible"
        title="加载配置"
        width="600px"
        class="config-dialog"
      >
        <el-tabs v-model="activeConfigTab" class="config-tabs">
          <el-tab-pane label="本地保存" name="local">
            <div class="config-list">
              <div v-if="localConfigs.length === 0" class="empty-config">
                暂无本地保存的配置
              </div>
              <div v-else class="config-items">
                <div
                  v-for="config in localConfigs"
                  :key="config.id"
                  class="config-item"
                  :class="{ active: selectedConfigId === config.id }"
                  @click="selectedConfigId = config.id"
                >
                  <div class="config-header">
                    <h4>{{ config.name }}</h4>
                    <el-tag size="small" type="success">本地保存</el-tag>
                  </div>
                  <p class="config-description">{{ config.description || '无描述' }}</p>
                  <div class="config-meta">
                    <span>保存时间: {{ formatDate(config.savedAt) }}</span>
                    <span>策略: {{ getStrategyLabel(config.strategyConfig.strategy) }}</span>
                    <span>字段: {{ config.fields.length }} 个</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="导入配置" name="imported">
            <div class="config-list">
              <div v-if="importedConfigs.length === 0" class="empty-config">
                暂无导入的配置
              </div>
              <div v-else class="config-items">
                <div
                  v-for="config in importedConfigs"
                  :key="config.id"
                  class="config-item"
                  :class="{ active: selectedConfigId === config.id }"
                  @click="selectedConfigId = config.id"
                >
                  <div class="config-header">
                    <h4>{{ config.name }}</h4>
                    <el-tag size="small" type="warning">导入配置</el-tag>
                  </div>
                  <p class="config-description">{{ config.description || '无描述' }}</p>
                  <div class="config-meta">
                    <span>导入时间: {{ formatDate(config.importedAt) }}</span>
                    <span>策略: {{ getStrategyLabel(config.strategyConfig.strategy) }}</span>
                    <span>字段: {{ config.fields.length }} 个</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="loadConfigDialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              @click="confirmLoadConfig"
              :disabled="!selectedConfigId"
            >
              加载配置
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import zhCN from 'element-plus/es/locale/lang/zh-cn'
import JsonGeneratorComponent from './components/JsonGeneratorComponent.vue'
import FieldsConfigComponent from './components/FieldsConfigComponent.vue'
import ConfigurationHome from './components/ConfigurationHome.vue'
import DataPreviewPage from './components/DataPreviewPage.vue'

// 当前步骤 (0: 配置首页, 1: 生成策略, 2: 字段配置, 3: 预览生成)
const currentStep = ref(0)

// 配置对象
const config = ref({
  batchSize: 1000,
  enableValidation: true,
  outputFormat: 'json',
  prettify: true
})

// 生成策略配置
const strategyConfig = ref({
  strategy: 'fixed',
  isValid: false
})

// 字段配置
const fields = ref<any[]>([])

// 生成状态
const generating = ref(false)
const generatedData = ref<any[]>([])
const generationResult = ref<any>(null)

// 配置变更检测
const lastGeneratedConfig = ref<any>(null)
const configChangeAlertDismissed = ref(false)

// 本地配置存储
const LOCAL_CONFIGS_KEY = 'json-generator-local-configs'
const IMPORTED_CONFIGS_KEY = 'json-generator-imported-configs'

// 配置对话框状态
const saveConfigDialogVisible = ref(false)
const loadConfigDialogVisible = ref(false)
const activeConfigTab = ref('local')
const selectedConfigId = ref('')

// 保存配置表单
const saveConfigForm = ref({
  name: '',
  description: ''
})

// 配置列表
const localConfigs = ref<any[]>([])
const importedConfigs = ref<any[]>([])

// 计算属性
const isFieldsValid = computed(() => {
  return fields.value.length > 0 && fields.value.every(field => 
    field.name && 
    field.key && 
    field.type && 
    field.dataSource &&
    isSourceConfigValid(field)
  )
})

const isConfigComplete = computed(() => {
  return strategyConfig.value.isValid && isFieldsValid.value
})

// 检查是否有任何配置
const hasAnyConfig = computed(() => {
  return localConfigs.value.length > 0 || importedConfigs.value.length > 0
})

// 检测配置是否已变更
const hasConfigChanged = computed(() => {
  if (!lastGeneratedConfig.value || !generationResult.value || configChangeAlertDismissed.value) {
    return false
  }
  
  // 比较策略配置
  const currentStrategyHash = JSON.stringify(strategyConfig.value)
  const lastStrategyHash = JSON.stringify(lastGeneratedConfig.value.strategy)
  
  // 比较字段配置
  const currentFieldsHash = JSON.stringify(fields.value)
  const lastFieldsHash = JSON.stringify(lastGeneratedConfig.value.fields)
  
  return currentStrategyHash !== lastStrategyHash || currentFieldsHash !== lastFieldsHash
})

// 验证数据来源配置
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

// 监听配置变化，重置提醒状态
watch([strategyConfig, fields], () => {
  configChangeAlertDismissed.value = false
}, { deep: true })

// 组件挂载时加载配置列表
onMounted(() => {
  loadConfigLists()
})

// 首页方法
const startNewConfig = () => {
  // 重置配置
  strategyConfig.value = {
    strategy: 'fixed',
    isValid: false
  }
  fields.value = []
  generationResult.value = null
  
  // 跳转到生成策略配置
  currentStep.value = 1
  ElMessage.info('开始创建新配置')
}

const loadConfigFromHome = (config: any) => {
  try {
    strategyConfig.value = { ...config.strategyConfig }
    fields.value = [...config.fields]
    
    // 直接跳转到预览界面
    currentStep.value = 3
    ElMessage.success(`已加载配置"${config.name}"，跳转到预览界面`)
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.error('加载配置失败: ' + (error as Error).message)
  }
}

const goToHome = () => {
  currentStep.value = 0
  ElMessage.info('已返回配置首页')
}

// 新增的处理导入配置的方法
const handleImportConfig = (importedConfig: any) => {
  importedConfigs.value.push(importedConfig)
  localStorage.setItem(IMPORTED_CONFIGS_KEY, JSON.stringify(importedConfigs.value))
  
  // 直接加载并跳转到预览界面
  loadConfigFromHome(importedConfig)
}

// 配置管理方法
const loadConfigLists = () => {
  try {
    const localConfigsData = localStorage.getItem(LOCAL_CONFIGS_KEY)
    if (localConfigsData) {
      localConfigs.value = JSON.parse(localConfigsData)
    }
    
    const importedConfigsData = localStorage.getItem(IMPORTED_CONFIGS_KEY)
    if (importedConfigsData) {
      importedConfigs.value = JSON.parse(importedConfigsData)
    }
  } catch (error) {
    console.error('加载配置列表失败:', error)
  }
}

const showSaveConfigDialog = () => {
  saveConfigForm.value = {
    name: '',
    description: ''
  }
  saveConfigDialogVisible.value = true
}

const confirmSaveConfig = () => {
  try {
    const configData = {
      id: Date.now().toString(),
      name: saveConfigForm.value.name.trim(),
      description: saveConfigForm.value.description.trim(),
      strategyConfig: strategyConfig.value,
      fields: fields.value,
      savedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    localConfigs.value.push(configData)
    localStorage.setItem(LOCAL_CONFIGS_KEY, JSON.stringify(localConfigs.value))
    
    saveConfigDialogVisible.value = false
    ElMessage.success(`配置"${configData.name}"已保存到本地`)
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败: ' + (error as Error).message)
  }
}

const showLoadConfigDialog = () => {
  selectedConfigId.value = ''
  loadConfigDialogVisible.value = true
}

const confirmLoadConfig = () => {
  try {
    let selectedConfig = null
    
    if (activeConfigTab.value === 'local') {
      selectedConfig = localConfigs.value.find(config => config.id === selectedConfigId.value)
    } else {
      selectedConfig = importedConfigs.value.find(config => config.id === selectedConfigId.value)
    }
    
    if (!selectedConfig) {
      ElMessage.error('未找到选中的配置')
      return
    }
    
    strategyConfig.value = { ...selectedConfig.strategyConfig }
    fields.value = [...selectedConfig.fields]
    
    loadConfigDialogVisible.value = false
    ElMessage.success(`已加载配置"${selectedConfig.name}"`)
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.error('加载配置失败: ' + (error as Error).message)
  }
}

const deleteLocalConfig = async (configId: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个本地配置吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    localConfigs.value = localConfigs.value.filter(config => config.id !== configId)
    localStorage.setItem(LOCAL_CONFIGS_KEY, JSON.stringify(localConfigs.value))
    
    ElMessage.success('配置已删除')
  } catch (error) {
    // 用户取消删除
  }
}

const deleteImportedConfig = async (configId: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个导入配置吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    importedConfigs.value = importedConfigs.value.filter(config => config.id !== configId)
    localStorage.setItem(IMPORTED_CONFIGS_KEY, JSON.stringify(importedConfigs.value))
    
    ElMessage.success('配置已删除')
  } catch (error) {
    // 用户取消删除
  }
}

// 步骤导航方法
const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 策略配置处理
const handleStrategyNext = (config: any) => {
  strategyConfig.value = config
  nextStep()
}

const handleStrategyChange = (config: any) => {
  strategyConfig.value = config
}

const handleFieldsChange = (newFields: any[]) => {
  fields.value = newFields
}

// 工具方法
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getStrategyLabel = (strategy: string) => {
  const labels: Record<string, string> = {
    fixed: '固定数量',
    range: '范围生成',
    template: '模板生成'
  }
  return labels[strategy] || strategy
}

// 导出配置
const exportConfig = () => {
  try {
    const configData = {
      name: `配置导出-${new Date().toLocaleString()}`,
      description: '导出的配置文件',
      strategyConfig: strategyConfig.value,
      fields: fields.value,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `json-generator-config-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success('配置文件已导出')
  } catch (error) {
    console.error('导出配置失败:', error)
    ElMessage.error('导出配置失败')
  }
}

// 清除所有配置
const clearAllConfigs = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有配置吗？此操作不可恢复。',
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    localConfigs.value = []
    importedConfigs.value = []
    localStorage.removeItem(LOCAL_CONFIGS_KEY)
    localStorage.removeItem(IMPORTED_CONFIGS_KEY)
    
    ElMessage.success('所有配置已清除')
  } catch (error) {
    // 用户取消操作
  }
}

// 生成和导出方法（占位符，实际实现需要根据具体需求）
const handleGenerate = () => {
  generating.value = true
  // TODO: 实现数据生成逻辑
  setTimeout(() => {
    generating.value = false
    generationResult.value = { success: true, count: 100 }
    ElMessage.success('数据生成完成')
  }, 2000)
}

const handleExport = (format: string) => {
  // TODO: 实现数据导出逻辑
  ElMessage.success(`数据已导出为 ${format} 格式`)
}
</script>

<style scoped>
/* CSS 变量定义 - 简化配色方案，减少渐变 */
:root {
  /* 主色调 - 简洁的蓝色系 */
  --primary-color: #3b82f6;
  --primary-light: #60a5fa;
  --primary-dark: #1d4ed8;
  --primary-hover: #2563eb;
  
  /* 辅助色彩 */
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --info-color: #06b6d4;
  
  /* 文字颜色 */
  --text-primary: #1f2937;
  --text-secondary: #4b5563;
  --text-muted: #6b7280;
  --text-light: #9ca3af;
  --text-inverse: #ffffff;
  
  /* 背景色 - 简化层次 */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  --bg-accent: #fefefe;
  
  /* 边框颜色 */
  --border-color: #e5e7eb;
  --border-light: #f3f4f6;
  --border-medium: #d1d5db;
  --border-strong: #9ca3af;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  /* 圆角 */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  
  /* 间距系统 - 统一间距标准 */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 0.75rem;   /* 12px */
  --spacing-lg: 1rem;      /* 16px */
  --spacing-xl: 1.5rem;    /* 24px */
  --spacing-2xl: 2rem;     /* 32px */
  --spacing-3xl: 3rem;     /* 48px */
  
  /* 字体大小 */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
}

/* 基础样式重置 */
* {
  box-sizing: border-box;
}

/* 应用主体 - 移除复杂渐变 */
.app {
  min-height: 100vh;
  background: var(--bg-secondary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--text-primary);
}

/* 头部样式 - 简化设计 */
.app-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  padding: var(--spacing-2xl) var(--spacing-lg);
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.app-header h1 {
  margin: 0 0 var(--spacing-sm);
  color: var(--primary-color);
  font-size: clamp(var(--text-2xl), 4vw, var(--text-3xl));
  font-weight: 700;
  letter-spacing: -0.025em;
}

.app-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: clamp(var(--text-sm), 2vw, var(--text-lg));
  max-width: 600px;
  margin: 0 auto;
}

/* 主内容区域 - 优化间距 */
.app-main {
  padding: var(--spacing-xl);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* 步骤导航容器 - 简化背景 */
.steps-container {
  margin-bottom: var(--spacing-xl);
  background: var(--bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

/* 步骤内容 - 统一间距 */
.step-content {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  min-height: 500px;
}

/* 步骤操作按钮 - 改善对齐和间距 */
.step-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
  gap: var(--spacing-lg);
}

/* 对话框样式优化 */
.config-dialog {
  --el-dialog-border-radius: var(--radius-xl);
}

.config-form {
  padding: var(--spacing-md) 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

.config-tabs {
  margin-bottom: var(--spacing-lg);
}

.config-list {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

.config-list::-webkit-scrollbar {
  width: 6px;
}

.config-list::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.config-list::-webkit-scrollbar-thumb {
  background: var(--border-medium);
  border-radius: var(--radius-sm);
}

.config-list::-webkit-scrollbar-thumb:hover {
  background: var(--border-strong);
}

.config-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.config-item {
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-primary);
}

.config-item:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.config-item.active {
  border-color: var(--primary-color);
  background: rgba(59, 130, 246, 0.05);
  box-shadow: var(--shadow-md);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
}

.config-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-base);
  font-weight: 600;
  line-height: 1.4;
}

.config-description {
  margin: 0 0 var(--spacing-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.config-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.config-meta span {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.empty-config {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--text-muted);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-medium);
  font-size: var(--text-sm);
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --text-muted: #9ca3af;
    --text-light: #6b7280;
    --text-inverse: #111827;
    
    --bg-primary: #1f2937;
    --bg-secondary: #111827;
    --bg-tertiary: #374151;
    --bg-accent: #0f172a;
    
    --border-color: #374151;
    --border-light: #1f2937;
    --border-medium: #4b5563;
    --border-strong: #6b7280;
  }
  
  .app {
    background: var(--bg-secondary);
  }
  
  .app-header {
    background: var(--bg-primary);
    border-bottom-color: var(--border-color);
  }
  
  .app-header h1 {
    color: var(--primary-light);
  }
}

/* 响应式设计 - 改善移动端体验 */
@media (max-width: 1024px) {
  .app-main {
    max-width: 100%;
    padding: var(--spacing-lg);
  }
  
  .step-content {
    padding: var(--spacing-xl);
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: var(--spacing-xl) var(--spacing-lg);
  }
  
  .app-main {
    padding: var(--spacing-md);
  }
  
  .step-content {
    padding: var(--spacing-lg);
    min-height: auto;
  }
  
  .steps-container {
    padding: var(--spacing-lg);
  }
  
  .step-actions {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .step-actions .el-button {
    width: 100%;
  }
  
  .config-meta {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .config-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-start;
  }
  
  .dialog-footer {
    flex-direction: column-reverse;
    gap: var(--spacing-sm);
  }
  
  .dialog-footer .el-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: var(--spacing-lg) var(--spacing-md);
  }
  
  .app-main {
    padding: var(--spacing-sm);
  }
  
  .step-content {
    padding: var(--spacing-md);
  }
  
  .steps-container {
    padding: var(--spacing-md);
  }
  
  .config-item {
    padding: var(--spacing-md);
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  :root {
    --border-color: #000000;
    --border-medium: #000000;
    --text-muted: var(--text-secondary);
  }
  
  .config-item {
    border-width: 2px;
  }
  
  .config-item:hover,
  .config-item.active {
    border-width: 3px;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .config-item:hover {
    transform: none;
  }
}

/* 焦点样式 - 改善可访问性 */
.el-button:focus-visible,
.config-item:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* 动画效果 - 简化 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.step-content {
  animation: fadeIn 0.3s ease-out;
}

/* 打印样式 */
@media print {
  .app-header,
  .step-actions,
  .dialog-footer {
    display: none;
  }
  
  .app {
    background: white;
  }
  
  .step-content {
    box-shadow: none;
    border: 1px solid #000;
  }
}
</style>