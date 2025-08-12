<template>
  <div class="config-home">
    <div class="config-home-header">
      <h2>欢迎使用JSON数据生成工具</h2>
      <p>您可以选择加载已有配置快速开始，或者创建新的配置</p>
    </div>
    
    <!-- 快速操作区域 -->
    <div class="quick-actions">
      <el-card class="action-card new-config" @click="$emit('startNew')">
        <div class="action-content">
          <el-icon size="48" color="#409EFF"><Setting /></el-icon>
          <h3>创建新配置</h3>
          <p>从头开始配置生成策略和字段信息</p>
        </div>
      </el-card>
      
      <el-upload
        ref="uploadRef"
        :show-file-list="false"
        :before-upload="handleImport"
        accept=".json"
        style="display: contents;"
      >
        <el-card class="action-card import-config">
          <div class="action-content">
            <el-icon size="48" color="#E6A23C"><Upload /></el-icon>
            <h3>导入配置文件</h3>
            <p>从本地文件导入已有的配置</p>
          </div>
        </el-card>
      </el-upload>
    </div>
    
    <!-- 已保存的配置列表 -->
    <div v-if="hasAnyConfig" class="saved-configs">
      <h3>已保存的配置</h3>
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane label="本地保存" name="local" v-if="localConfigs.length > 0">
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
        </el-tab-pane>
        
        <el-tab-pane label="导入配置" name="imported" v-if="importedConfigs.length > 0">
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
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 空状态提示 -->
    <div v-else class="empty-state">
      <el-empty description="暂无已保存的配置">
        <el-button type="primary" @click="$emit('startNew')">创建第一个配置</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Upload } from '@element-plus/icons-vue'
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
.config-home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

.config-home-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.config-home-header h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.025em;
}

.config-home-header p {
  color: var(--text-secondary);
  font-size: clamp(0.875rem, 2vw, 1rem);
  max-width: 500px;
  margin: 0 auto;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.action-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--bg-primary);
  position: relative;
  box-shadow: var(--shadow-md);
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(99, 102, 241, 0.08) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-color);
}

.action-card:hover::before {
  opacity: 1;
}

.new-config {
  border-color: var(--border-medium);
}

.new-config:hover {
  border-color: var(--primary-color);
  box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04);
}

.import-config {
  border-color: var(--border-medium);
}

.import-config:hover {
  border-color: var(--warning-color);
  box-shadow: 0 20px 25px -5px rgba(217, 119, 6, 0.1), 0 10px 10px -5px rgba(217, 119, 6, 0.04);
}

.action-content {
  text-align: center;
  padding: var(--spacing-xl);
  position: relative;
  z-index: 1;
}

.action-content h3 {
  margin: var(--spacing-md) 0 var(--spacing-sm);
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.action-content p {
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.saved-configs h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  font-size: 1.5rem;
  font-weight: 600;
}

.config-tabs {
  margin-bottom: var(--spacing-lg);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
}
</style>