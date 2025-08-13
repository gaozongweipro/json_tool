import { FieldConfig } from './fields';
import { DataSource } from './generation';

// 条件接口
export interface Condition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'contains';
  value: any;
}

// 生成规则接口
export interface GenerationRule {
  id?: string;
  name?: string;
  description?: string;
  template?: string | JsonTemplate;
  dataSource?: DataSource;
  count: number;
  outputFormat?: 'json' | 'jsonl' | 'csv';
  fields?: FieldConfig[];
  mode?: 'visual' | 'code' | 'business';
  conditions?: Condition[];
}

// JSON模板接口
export interface JsonTemplate {
  [key: string]: any;
}

// Rule类型别名，用于向后兼容
export type Rule = GenerationRule;