import React from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { JsonGeneratorComponent } from './components/JsonGeneratorComponent'
import { exportToJson, exportToJsonl, exportToCsv } from './utils'
import './App.css'

function App() {
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

  return (
    <ConfigProvider locale={zhCN}>
      <div className="app">
        <header className="app-header">
          <h1>JSON生成工具</h1>
          <p>灵活的JSON数据批量生成工具</p>
        </header>
        
        <main className="app-main">
          <JsonGeneratorComponent
            onGenerate={handleGenerate}
            onExport={handleExport}
            config={{
              batchSize: 1000,
              enableValidation: true,
              outputFormat: 'json',
              prettify: true
            }}
          />
        </main>
        
        <footer className="app-footer">
          <p>© 2024 JSON生成工具 - 支持本地使用和组件嵌入</p>
        </footer>
      </div>
    </ConfigProvider>
  )
}

export default App