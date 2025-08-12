<template>
  <el-config-provider :locale="zhCN">
    <div class="app">
      <header class="app-header">
        <h1>JSON生成工具</h1>
        <p>灵活的JSON数据批量生成工具</p>
      </header>
      
      <main class="app-main">
        <JsonGeneratorComponent
          :config="config"
          @generate="handleGenerate"
          @export="handleExport"
        />
      </main>
      
      <footer class="app-footer">
        <p>© 2024 JSON生成工具 - 支持本地使用和组件嵌入</p>
      </footer>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCN from 'element-plus/dist/locale/zh-cn.mjs'
import JsonGeneratorComponent from './components/JsonGeneratorComponent.vue'

// 配置对象
const config = ref({
  batchSize: 1000,
  enableValidation: true,
  outputFormat: 'json',
  prettify: true
})

// 处理生成完成事件
const handleGenerate = (result: any) => {
  console.log('生成完成:', result)
}

// 处理导出事件
const handleExport = (data: any[], options: any) => {
  console.log('导出数据:', { data: data.length, options })
  
  // 这里已经在ExportPanel组件中处理了实际的导出逻辑
  // 可以在这里添加额外的处理，比如统计、日志等
}
</script>

<style>
@import './App.css';
</style>