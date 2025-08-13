// 字段配置接口
export interface FieldConfig {
  name: string
  type: string
  displayName?: string
  businessMeaning?: string
  required: boolean
  unique?: boolean
  indexed?: boolean
  config: Record<string, any>
}

// 生成规则接口
export interface GenerationRule {
  id?: string
  name?: string
  description?: string
  template?: string | JsonTemplate
  dataSource?: DataSource
  count: number
  outputFormat?: 'json' | 'jsonl' | 'csv'
  fields?: FieldConfig[]
  mode?: 'visual' | 'code' | 'business'
  conditions?: Condition[]
}

// Rule类型别名，用于向后兼容
export type Rule = GenerationRule

// JSON模板接口
export interface JsonTemplate {
  [key: string]: any
}

// 数据源接口
export interface DataSource {
  type: 'csv' | 'json' | 'api' | 'manual'
  config: DataSourceConfig
}

export interface DataSourceConfig {
  url?: string
  data?: any[]
  headers?: Record<string, string>
  mapping?: Record<string, string>
}

// 条件接口
export interface Condition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'contains'
  value: any
}

// 生成器配置
export interface GeneratorConfig {
  batchSize?: number
  enableValidation?: boolean
  outputFormat?: 'json' | 'jsonl'
  prettify?: boolean
}

// 导出选项
export interface ExportOptions {
  format: 'json' | 'jsonl' | 'csv'
  filename?: string
  compress?: boolean
  splitFiles?: boolean
  maxRecordsPerFile?: number
}

// 验证结果
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  path: string
  message: string
  value?: any
}

// 生成结果
export interface GenerationResult {
  data: any[]
  metadata: {
    totalCount: number
    generatedAt: string
    rule: GenerationRule
  }
}

// 内置函数类型
export type BuiltinFunction = {
  name: string
  description: string
  params: FunctionParam[]
  execute: (...args: any[]) => any
}

export interface FunctionParam {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array'
  required: boolean
  description?: string
  defaultValue?: any
}

// 组件Props类型
// Vue组件Props接口
export interface JsonGeneratorComponentProps {
  initialRule?: GenerationRule
  config?: GeneratorConfig
}

export interface RuleEditorProps {
  rule: GenerationRule
  functions?: BuiltinFunction[]
}

export interface JsonPreviewProps {
  data: any[]
  loading?: boolean
  pageSize?: number
  showMetadata?: boolean
}

export interface ExportPanelProps {
  data: any[]
  disabled?: boolean
}

export interface VisualRuleBuilderProps {
  rule: GenerationRule
}

export interface BusinessRuleBuilderProps {
  rule: GenerationRule
}

export interface FieldConfigProps {
  field: FieldConfig
}

// 预览模式类型
export type PreviewMode = 'table' | 'json' | 'raw'

// 字段类型枚举
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object',
  ENUM = 'enum',
  UUID = 'uuid',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  ID = 'id',
  NAME = 'name',
  ADDRESS = 'address',
  COMPANY = 'company',
  PRICE = 'price',
  STATUS = 'status'
}

// 数据生成策略接口
export interface GenerationStrategy {
  type: 'random' | 'normal' | 'weighted' | 'sequential'
  quality: 'high' | 'medium' | 'low'
  params: Record<string, any>
}

// 约束条件接口
export interface DataConstraints {
  types: string[]
  unique: {
    fields: string[]
  }
  range: {
    rules: Array<{
      field: string
      min: number
      max: number
    }>
  }
  business: {
    rules: string
  }
}

// 关联关系接口
export interface FieldRelationship {
  sourceField: string
  type: 'dependent' | 'calculated' | 'conditional'
  targetField: string
  rule: string
}

// 业务场景配置接口
export interface BusinessScenarioConfig {
  name: string
  description: string
  fields: FieldConfig[]
  constraints?: DataConstraints
  relationships?: FieldRelationship[]
}


// 统一导出所有类型
export * from './config';
export * from './fields';
export * from './rules';
export * from './generation';