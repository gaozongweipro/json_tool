// 从index.ts中提取配置相关类型
import { FieldConfig } from './fields';

// 生成器配置
export interface GeneratorConfig {
  batchSize?: number;
  enableValidation?: boolean;
  outputFormat?: 'json' | 'jsonl';
  prettify?: boolean;
}

// 导出选项
export interface ExportOptions {
  format: 'json' | 'jsonl' | 'csv';
  filename?: string;
  compress?: boolean;
  splitFiles?: boolean;
  maxRecordsPerFile?: number;
}