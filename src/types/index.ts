// 生成规则接口
export interface GenerationRule {
  id: string
  name: string
  description?: string
  template: JsonTemplate
  dataSource?: DataSource
  count: number
  conditions?: Condition[]
}

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
export interface JsonGeneratorComponentProps {
  initialRule?: GenerationRule
  config?: GeneratorConfig
  onGenerate?: (result: GenerationResult) => void
  onExport?: (data: any[], options: ExportOptions) => void
  className?: string
  style?: React.CSSProperties
}

export interface RuleEditorProps {
  rule: GenerationRule
  onChange: (rule: GenerationRule) => void
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
  onExport: (options: ExportOptions) => void
  disabled?: boolean
}