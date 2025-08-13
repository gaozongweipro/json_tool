import { GenerationRule } from './rules';

// 数据源接口
export interface DataSource {
  type: 'csv' | 'json' | 'api' | 'manual';
  config: DataSourceConfig;
}

export interface DataSourceConfig {
  url?: string;
  data?: any[];
  headers?: Record<string, string>;
  mapping?: Record<string, string>;
}

// 验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

// 生成结果
export interface GenerationResult {
  data: any[];
  metadata: {
    totalCount: number;
    generatedAt: string;
    rule: GenerationRule;
  };
}

// 内置函数类型
export type BuiltinFunction = {
  name: string;
  description: string;
  params: FunctionParam[];
  execute: (...args: any[]) => any;
};

// 函数参数类型（需要补充）
export interface FunctionParam {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
}