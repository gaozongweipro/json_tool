// 核心引擎导出
export { JsonGenerator } from './core/JsonGenerator'
export { RuleEngine } from './core/RuleEngine'
export { TemplateParser } from './core/TemplateParser'

// Vue组件导出
export { default as JsonGeneratorComponent } from './components/JsonGeneratorComponent.vue'
export { default as RuleEditor } from './components/RuleEditor.vue'
export { default as JsonPreview } from './components/JsonPreview.vue'
export { default as ExportPanel } from './components/ExportPanel.vue'
export { default as VisualRuleBuilder } from './components/VisualRuleBuilder.vue'
export { default as BusinessRuleBuilder } from './components/BusinessRuleBuilder.vue'
export { default as FieldConfig } from './components/FieldConfig.vue'
export { default as BusinessFieldConfig } from './components/BusinessFieldConfig.vue'

// 类型定义导出
export type {
  GenerationRule,
  JsonTemplate,
  GeneratorConfig,
  ExportOptions,
  ValidationResult
} from './types'

// 工具函数导出
export { createJsonGenerator, validateJsonSchema } from './utils'