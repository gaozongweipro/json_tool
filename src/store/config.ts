import { defineStore } from 'pinia';
import { GenerationRule, FieldConfig } from '../types';

export const useConfigStore = defineStore('config', {
  state: () => ({
    currentConfig: null as GenerationRule | null,
    localConfigs: [] as GenerationRule[],
    importedConfigs: [] as GenerationRule[],
    hasConfigChanged: false,
  }),
  
  actions: {
    setCurrentConfig(config: GenerationRule | null) {
      this.currentConfig = config;
      this.hasConfigChanged = false;
    },
    
    updateCurrentConfig(config: Partial<GenerationRule>) {
      if (this.currentConfig) {
        this.currentConfig = { ...this.currentConfig, ...config };
        this.hasConfigChanged = true;
      }
    },
    
    updateFields(fields: FieldConfig[]) {
      if (this.currentConfig) {
        this.currentConfig.fields = fields;
        this.hasConfigChanged = true;
      }
    },
    
    saveConfig(name: string, description: string) {
      if (!this.currentConfig) return false;
      
      const configToSave: GenerationRule = {
        ...this.currentConfig,
        id: Date.now().toString(),
        name,
        description
      };
      
      this.localConfigs.push(configToSave);
      this.hasConfigChanged = false;
      
      // 保存到本地存储
      localStorage.setItem('localConfigs', JSON.stringify(this.localConfigs));
      
      return true;
    },
    
    loadConfig(configId: string) {
      const config = [...this.localConfigs, ...this.importedConfigs]
        .find(c => c.id === configId);
        
      if (config) {
        this.setCurrentConfig(JSON.parse(JSON.stringify(config)));
        return true;
      }
      
      return false;
    },
    
    importConfig(config: GenerationRule) {
      if (!config.id) {
        config.id = Date.now().toString();
      }
      
      this.importedConfigs.push(config);
      
      // 保存到本地存储
      localStorage.setItem('importedConfigs', JSON.stringify(this.importedConfigs));
      
      return config.id;
    },
    
    deleteLocalConfig(configId: string) {
      const index = this.localConfigs.findIndex(c => c.id === configId);
      if (index !== -1) {
        this.localConfigs.splice(index, 1);
        localStorage.setItem('localConfigs', JSON.stringify(this.localConfigs));
        return true;
      }
      return false;
    },
    
    deleteImportedConfig(configId: string) {
      const index = this.importedConfigs.findIndex(c => c.id === configId);
      if (index !== -1) {
        this.importedConfigs.splice(index, 1);
        localStorage.setItem('importedConfigs', JSON.stringify(this.importedConfigs));
        return true;
      }
      return false;
    },
    
    loadStoredConfigs() {
      try {
        const localConfigs = localStorage.getItem('localConfigs');
        if (localConfigs) {
          this.localConfigs = JSON.parse(localConfigs);
        }
        
        const importedConfigs = localStorage.getItem('importedConfigs');
        if (importedConfigs) {
          this.importedConfigs = JSON.parse(importedConfigs);
        }
      } catch (error) {
        console.error('Failed to load stored configs:', error);
      }
    }
  }
});