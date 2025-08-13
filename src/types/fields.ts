// 字段配置接口
export interface FieldConfig {
  name: string;
  type: string;
  displayName?: string;
  businessMeaning?: string;
  required: boolean;
  unique?: boolean;
  indexed?: boolean;
  config: Record<string, any>;
}