<template>
  <div class="config-home">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">
          <el-icon class="title-icon"><Setting /></el-icon>
          JSON数据生成工具
        </h1>
        <p class="welcome-subtitle">
          智能配置，快速生成高质量测试数据 - 让数据创建变得简单高效
        </p>
      </div>
    </div>
    
    <!-- 快速操作区域 -->
    <div class="actions-section">
      <h2 class="section-title">快速开始</h2>
      <div class="quick-actions">
        <div class="action-card primary-action" @click="$emit('startNew')">
          <div class="action-icon">
            <el-icon><Plus /></el-icon>
          </div>
          <div class="action-content">
            <h3>创建新配置</h3>
            <p>从头开始配置生成策略和字段信息</p>
          </div>
          <!-- <div class="action-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div> -->
        </div>
        
        <el-upload
          ref="uploadRef"
          :show-file-list="false"
          :before-upload="handleImport"
          accept=".json"
          style="display: flex;flex: 1;"
        >
          <div class="action-card secondary-action">
            <div class="action-icon">
              <el-icon><Upload /></el-icon>
            </div>
            <div class="action-content">
              <h3>导入配置文件</h3>
              <p>从本地文件导入已有的配置</p>
            </div>
            <!-- <div class="action-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div> -->
          </div>
        </el-upload>
      </div>
    </div>
    
    <!-- 已保存的配置列表 - 重新设计 -->
    <div v-if="hasAnyConfig" class="configs-section">
      <div class="configs-header">
        <div class="header-content">
          <div class="header-main">
            <h2 class="section-title">
              <el-icon class="section-icon"><FolderOpened /></el-icon>
              我的配置
            </h2>
            <p class="section-subtitle">管理和加载您的数据生成配置</p>
          </div>
          
          <div class="configs-stats">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><DocumentCopy /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-number">{{ totalConfigCount }}</span>
                <span class="stat-label">总配置</span>
              </div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-number">{{ lastUpdateTime }}</span>
                <span class="stat-label">最近更新</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="config-container">
        <el-tabs v-model="activeTab" class="config-tabs" type="card">
          <el-tab-pane 
            v-if="localConfigs.length > 0"
            name="local"
          >
            <template #label>
              <div class="tab-label">
                <el-icon><Box /></el-icon>
                <span>本地保存</span>
                <el-badge :value="localConfigs.length" class="tab-badge" />
              </div>
            </template>
            
            <div class="config-grid-wrapper">
              <div class="config-grid">
                <ConfigCard 
                  v-for="config in localConfigs" 
                  :key="config.id"
                  :config="config"
                  type="local"
                  @load="$emit('loadConfig', config)"
                  @delete="$emit('deleteLocal', config.id)"
                />
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane 
            v-if="importedConfigs.length > 0"
            name="imported"
          >
            <template #label>
              <div class="tab-label">
                <el-icon><Download /></el-icon>
                <span>导入配置</span>
                <el-badge :value="importedConfigs.length" class="tab-badge" />
              </div>
            </template>
            
            <div class="config-grid-wrapper">
              <div class="config-grid">
                <ConfigCard 
                  v-for="config in importedConfigs" 
                  :key="config.id"
                  :config="config"
                  type="imported"
                  @load="$emit('loadConfig', config)"
                  @delete="$emit('deleteImported', config.id)"
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    
    <!-- 空状态提示 -->
    <div v-else class="empty-section">
      <div class="empty-state">
        <div class="empty-icon">
          <el-icon><Folder /></el-icon>
        </div>
        <h3>暂无已保存的配置</h3>
        <p>创建您的第一个配置来开始生成数据</p>
        <el-button type="primary" size="large" @click="$emit('startNew')">
          <el-icon><Plus /></el-icon>
          创建配置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Setting, Upload, Plus, ArrowRight, Folder, FolderOpened, 
  DocumentCopy, Clock, Box, Download 
} from '@element-plus/icons-vue'
import ConfigCard from './ConfigCard.vue'

interface Props {
  localConfigs: any[]
  importedConfigs: any[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  startNew: []
  loadConfig: [config: any]
  deleteLocal: [id: string]
  deleteImported: [id: string]
  importConfig: [config: any]
}>()

const activeTab = ref('local')

const hasAnyConfig = computed(() => {
  return props.localConfigs.length > 0 || props.importedConfigs.length > 0
})

const totalConfigCount = computed(() => {
  return props.localConfigs.length + props.importedConfigs.length
})

const lastUpdateTime = computed(() => {
  const allConfigs = [...props.localConfigs, ...props.importedConfigs]
  if (allConfigs.length === 0) return '-'
  
  const latestConfig = allConfigs.reduce((latest, config) => {
    const configTime = new Date(config.savedAt || config.importedAt || 0)
    const latestTime = new Date(latest.savedAt || latest.importedAt || 0)
    return configTime > latestTime ? config : latest
  })
  
  const time = new Date(latestConfig.savedAt || latestConfig.importedAt)
  return time.toLocaleDateString('zh-CN', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const handleImport = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const configData = JSON.parse(e.target?.result as string)
        
        // 验证配置数据结构
        if (!configData.strategyConfig || !configData.fields) {
          throw new Error('配置文件格式不正确，缺少必要的配置项')
        }
        
        // 验证字段配置
        if (!Array.isArray(configData.fields)) {
          throw new Error('字段配置格式不正确')
        }
        
        // 创建导入配置
        const importedConfig = {
          id: Date.now().toString(),
          name: configData.name || `导入配置-${new Date().toLocaleString()}`,
          description: configData.description || '从文件导入的配置',
          strategyConfig: configData.strategyConfig,
          fields: configData.fields,
          importedAt: new Date().toISOString(),
          originalExportedAt: configData.exportedAt,
          version: configData.version || '1.0'
        }
        
        emit('importConfig', importedConfig)
        ElMessage.success(`配置文件导入成功，已加载配置"${importedConfig.name}"`)
        resolve(true)
      } catch (error) {
        console.error('导入配置失败:', error)
        ElMessage.error('导入配置失败: ' + (error as Error).message)
        reject(error)
      }
    }
    
    reader.onerror = () => {
      ElMessage.error('读取文件失败')
      reject(new Error('读取文件失败'))
    }
    
    reader.readAsText(file)
  })
}
</script>

<style scoped>
/* 现代化首页样式 */
.configuration-home {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  color: var(--color-text-primary);
}

/* 现代化欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
  position: relative;
  padding: var(--space-20) var(--space-8);
  margin: calc(-1 * var(--space-8)) calc(-1 * var(--space-8)) var(--space-10);
  border-radius: 0 0 var(--radius-3xl) var(--radius-3xl);
  overflow: hidden;
}

/* .welcome-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  opacity: 0.4;
} */

.welcome-content {
  position: relative;
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
}

.welcome-title {
  font-size: clamp(var(--text-3xl), 6vw, var(--text-5xl));
  font-weight: var(--font-extrabold);
  margin: 0 0 var(--space-5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  line-height: var(--leading-tight);
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-icon {
  font-size: 1.2em;
  color: var(--primary);
  background: white;
  padding: var(--space-3);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.welcome-subtitle {
  font-size: clamp(var(--text-base), 3vw, var(--text-xl));
  margin: 0;
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  font-weight: var(--font-medium);
}

/* 现代化区域标题 */
.section-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  position: relative;
  padding-left: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* .section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: var(--space-8);
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: var(--radius-full);
} */

.section-icon {
  font-size: var(--text-xl);
  color: var(--primary);
  background: var(--primary-100);
  padding: var(--space-2);
  border-radius: var(--radius-lg);
}

/* 现代化快速操作区域 */
.actions-section {
  margin-bottom: var(--space-16);
}

.quick-actions {
  margin-bottom: var(--space-16);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

:deep(.el-upload) {
  flex: 1;
}

.action-card {
  flex: 1;
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-2xl);
  padding: var(--space-8);
  cursor: pointer;
  transition: all var(--duration-300) var(--ease-out);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: var(--space-6);
  min-height: 140px;
  box-shadow: var(--shadow-sm);
}

/* .action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(99, 102, 241, 0.05) 100%);
  opacity: 0;
  transition: opacity var(--duration-300) var(--ease-out);
} */

.action-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary);
}

.action-card:hover::before {
  opacity: 1;
}

.action-card:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.primary-action:hover {
  border-color: var(--primary);
  box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.25);
}

.secondary-action:hover {
  border-color: var(--secondary);
  box-shadow: 0 25px 50px -12px rgba(6, 182, 212, 0.25);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-2xl);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  box-shadow: var(--shadow-md);
}

.primary-action .action-icon {
  background: linear-gradient(135deg, var(--primary), var(--primary-600));
  color: white;
}

.secondary-action .action-icon {
  background: linear-gradient(135deg, var(--secondary), var(--secondary-600));
  color: white;
}

.action-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.action-content h3 {
  white-space: nowrap;
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
  line-height: var(--leading-tight);
}

.action-content p {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
}

.action-arrow {
  font-size: var(--text-xl);
  color: var(--color-text-muted);
  transition: all var(--duration-300) var(--ease-out);
  position: relative;
  z-index: 1;
}

.action-card:hover .action-arrow {
  color: var(--primary);
  transform: translateX(4px);
}

/* 现代化配置区域 */
.configs-section {
  background: white;
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  position: relative;
}

/* .configs-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
} */

/* 配置头部重新设计 */
.configs-header {
  padding: var(--space-10) var(--space-8) var(--space-8);
  background: var(--gray-50);
  border-bottom: 1px solid var(--color-border-light);
  position: relative;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-8);
  flex-wrap: wrap;
}

.header-main {
  flex: 1;
  min-width: 300px;
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  position: relative;
}

.section-icon {
  font-size: var(--text-2xl);
  color: var(--primary);
  background: var(--primary-100);
  padding: var(--space-3);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.section-subtitle {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin: 0;
  font-weight: var(--font-medium);
}

/* 统计信息重新设计 */
.configs-stats {
  display: flex;
  gap: var(--space-6);
  flex-wrap: wrap;
}

.stat-item {
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-width: 140px;
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-200) var(--ease-out);
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-200);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
  background: var(--primary-100);
  color: var(--primary);
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.stat-number {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  line-height: var(--leading-none);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 配置容器优化 */
.config-container {
  padding: 0;
}

/* 配置网格包装器 */
.config-grid-wrapper {
  padding: var(--space-8);
  background: var(--color-background);
  min-height: 200px;
}

/* 配置网格重新设计 */
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--space-6);
  position: relative;
}

/* 配置卡片容器动画 */
.config-grid-wrapper {
  animation: fadeInUp 0.6s var(--ease-out);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* === 标签页样式优化 === */
.config-tabs {
  margin-bottom: 0;
  position: relative;
}

.config-tabs :deep(.el-tabs__header) {
  margin: 0;
  border: none;
  background: var(--gray-50);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: var(--space-4) var(--space-8);
  position: relative;
  box-shadow: var(--shadow-xs);
  border-bottom: 1px solid var(--color-border-light);
}

.config-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0;
  margin: 0;
}

.config-tabs :deep(.el-tabs__nav) {
  border: none;
  float: none;
  display: flex;
  gap: var(--space-2);
}

.config-tabs :deep(.el-tabs__item) {
  height: 52px;
  line-height: 52px;
  padding: 0 var(--space-8);
  margin: 0;
  border: none;
  border-radius: var(--radius-xl);
  transition: all var(--duration-300) var(--ease-out);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background: transparent;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  font-size: var(--text-sm);
  white-space: nowrap;
}

.config-tabs :deep(.el-tabs__item:hover) {
  background: rgba(var(--primary), 0.08);
  color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--primary-200);
}

.config-tabs :deep(.el-tabs__item.is-active) {
  background: var(--primary);
  color: white;
  font-weight: var(--font-semibold);
  box-shadow: var(--shadow-lg);
  transform: translateY(-3px);
  border: 1px solid var(--primary);
}

.config-tabs :deep(.el-tabs__item.is-active::before) {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: var(--primary-200);
  border-radius: calc(var(--radius-xl) + 3px);
  z-index: -1;
  opacity: 0.2;
}

.config-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

.config-tabs :deep(.el-tabs__content) {
  padding: 0;
}

/* Tab Label 优化 */
.tab-label {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: inherit;
  transition: all var(--duration-200) var(--ease-out);
}

.tab-label .el-icon {
  font-size: var(--text-lg);
  opacity: 0.8;
  transition: all var(--duration-200) var(--ease-out);
}

.config-tabs :deep(.el-tabs__item:hover) .tab-label .el-icon,
.config-tabs :deep(.el-tabs__item.is-active) .tab-label .el-icon {
  opacity: 1;
  transform: scale(1.1);
}

.config-tabs :deep(.el-tabs__item.is-active) .tab-label .el-icon {
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.tab-label span {
  white-space: nowrap;
  font-size: var(--text-base);
  letter-spacing: 0.3px;
  transition: color var(--duration-200) var(--ease-out);
  font-weight: var(--font-medium);
}

/* Tab Badge 优化 */
.tab-badge :deep(.el-badge__content) {
  background: var(--secondary);
  border: 2px solid white;
  color: white;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  height: 24px;
  line-height: 20px;
  min-width: 24px;
  padding: 0 8px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
  transform: scale(0.85);
  transition: all var(--duration-300) var(--ease-out);
}

.config-tabs :deep(.el-tabs__item:hover) .tab-badge :deep(.el-badge__content) {
  transform: scale(0.9);
  background: var(--primary);
}

.config-tabs :deep(.el-tabs__item.is-active) .tab-badge :deep(.el-badge__content) {
  background: var(--warning);
  color: white;
  transform: scale(1);
  animation: pulse-badge 2s infinite;
  border-color: white;
  box-shadow: var(--shadow-lg);
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* === 响应式设计优化 === */
@media (max-width: 1024px) {
  .config-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-5);
  }
  
  .configs-stats {
    gap: var(--space-4);
  }
  
  .stat-item {
    min-width: 120px;
    padding: var(--space-3) var(--space-4);
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--space-6);
  }
  
  .header-main {
    min-width: auto;
  }
  
  .section-title {
    font-size: var(--text-2xl);
  }
  
  .configs-header {
    padding: var(--space-8) var(--space-6) var(--space-6);
  }
  
  .config-grid-wrapper {
    padding: var(--space-6);
  }
  
  .config-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .config-tabs :deep(.el-tabs__header) {
    padding: var(--space-3) var(--space-6);
  }
  
  .config-tabs :deep(.el-tabs__item) {
    min-width: 140px;
    padding: 0 var(--space-6);
    height: 48px;
    line-height: 48px;
  }
  
  .configs-stats {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .configs-header {
    padding: var(--space-6) var(--space-4) var(--space-4);
  }
  
  .config-grid-wrapper {
    padding: var(--space-4);
  }
  
  .config-tabs :deep(.el-tabs__nav) {
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--space-1);
  }
  
  .config-tabs :deep(.el-tabs__item) {
    min-width: 110px;
    padding: 0 var(--space-4);
    height: 44px;
    line-height: 44px;
  }
  
  .tab-label span {
    font-size: var(--text-sm);
  }
  
  .stat-item {
    min-width: 100px;
    padding: var(--space-2) var(--space-3);
  }
  
  .stat-icon {
    width: 32px;
    height: 32px;
  }
  
  .stat-number {
    font-size: var(--text-base);
  }
  
  .tab-badge :deep(.el-badge__content) {
    transform: translate(8px, -8px) scale(0.75);
  }
  
  .config-tabs :deep(.el-tabs__item.is-active) .tab-badge :deep(.el-badge__content) {
    transform: translate(8px, -8px) scale(0.85);
  }
}

@media (max-width: 360px) {
  .tab-label span {
    display: none; /* 超小屏只显示图标 */
  }
  
  .tab-label .el-icon {
    font-size: var(--text-xl);
  }
  
  .config-tabs :deep(.el-tabs__item) {
    min-width: 60px;
    padding: 0 var(--space-2);
  }
  
  .configs-stats {
    flex-direction: column;
    align-items: stretch;
  }
}

/* === 无障碍性和特殊模式支持 === */
.config-tabs :deep(.el-tabs__item:focus-visible) {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  z-index: 2;
}

@media (prefers-reduced-motion: reduce) {
  .config-tabs :deep(.el-tabs__item),
  .tab-label .el-icon,
  .tab-badge :deep(.el-badge__content),
  .stat-item,
  .config-grid-wrapper {
    transition: none;
    animation: none;
    transform: none !important;
  }
}

@media (prefers-contrast: high) {
  .configs-section {
    border: 2px solid var(--color-border);
  }
  
  .config-tabs :deep(.el-tabs__header) {
    background: var(--color-surface);
    border: 2px solid var(--color-border);
  }
  
  .config-tabs :deep(.el-tabs__item.is-active) {
    background: var(--primary);
    border: 2px solid var(--primary-800);
  }
  
  .stat-item {
    border: 2px solid var(--color-border);
  }
}

/* === 加载状态和空状态优化 === */
.config-grid-wrapper:empty::before {
  content: '暂无配置数据';
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--color-text-muted);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
}
</style>