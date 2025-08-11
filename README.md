# JSON生成工具

一个灵活的JSON数据批量生成工具，既可以本地独立使用，也可以作为React组件嵌入到其他项目中。

## 功能特性

### 🚀 核心功能
- **业务数据生成器**: 专为生产环境设计的批量数据录入工具，支持设备、用户、产品等业务场景
- **灵活的模板系统**: 支持复杂的JSON模板定义，包含占位符和函数调用
- **丰富的内置函数**: 随机字符串、数字、日期、UUID等数据生成函数
- **可视化编辑器**: 无需编写代码的可视化规则构建器
- **多种生成策略**: 支持单一生成、批量生成、交叉生成等多种数据生成策略
- **批量生成**: 高性能批量数据生成，支持大数据量处理

### 📊 预览与导出
- **实时预览**: 表格视图和JSON视图切换
- **多格式导出**: JSON、JSONL、CSV格式导出
- **文件分割**: 大文件自动分割导出
- **统计信息**: 数据统计和字段分析

### 🔧 使用方式
- **独立应用**: 可直接在浏览器中使用
- **React组件**: 可嵌入到其他React项目中
- **NPM包**: 支持作为依赖库使用

## 业务数据生成器

### 🎯 专为生产环境设计

业务数据生成器是专门为生产环境批量数据录入而设计的工具，特别适用于以下场景：

- **设备批量录入**: 批量录入传感器、设备等硬件信息
- **用户批量录入**: 批量录入员工、客户等人员信息  
- **产品批量录入**: 批量录入商品、物料等产品信息
- **业务数据迁移**: 系统迁移时的数据批量生成

### 🚀 主要特点

- **预设业务模板**: 提供设备、用户、产品等常用业务模板
- **多种生成策略**: 支持单一生成、批量生成、交叉生成
- **可视化配置**: 无需编写代码，通过界面配置即可
- **实时预览**: 配置完成后可立即预览生成效果
- **灵活字段类型**: 支持固定值、序列递增、分类选择、范围值、模板字符串等

### 📋 使用流程

1. **选择业务模板**: 从预设模板中选择或自定义
2. **配置字段规则**: 为每个字段设置生成规则
3. **选择生成策略**: 根据需求选择合适的生成策略
4. **预览并生成**: 预览数据样例，确认后生成完整数据

详细使用指南请参考：[业务数据生成器使用指南](./docs/business-generator-guide.md)

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 构建组件库
npm run build:lib
```

### 作为组件使用

```bash
npm install json-generator-tool
```

```tsx
import React from 'react'
import { JsonGeneratorComponent } from 'json-generator-tool'
import 'json-generator-tool/dist/style.css'

function App() {
  const handleGenerate = (result) => {
    console.log('生成完成:', result)
  }

  const handleExport = (data, options) => {
    console.log('导出数据:', data.length, options)
  }

  return (
    <JsonGeneratorComponent
      onGenerate={handleGenerate}
      onExport={handleExport}
      config={{
        batchSize: 1000,
        enableValidation: true
      }}
    />
  )
}
```

### 使用核心API

```tsx
import { createJsonGenerator, createSampleRule } from 'json-generator-tool'

// 创建生成器
const generator = createJsonGenerator({
  batchSize: 1000,
  enableValidation: true
})

// 定义生成规则
const rule = {
  id: 'user-data',
  name: '用户数据生成',
  template: {
    id: '{{uuid()}}',
    name: '{{randomChoice(["张三", "李四", "王五"])}}',
    age: '{{randomInt(18, 65)}}',
    email: '{{randomString(8)}}@example.com',
    createdAt: '{{randomDate()}}'
  },
  count: 100
}

// 生成数据
generator.generate(rule).then(result => {
  console.log('生成的数据:', result.data)
})
```

## 模板语法

### 基本语法

```json
{
  "id": "{{uuid()}}",
  "name": "{{randomChoice([\"张三\", \"李四\", \"王五\"])}}",
  "age": "{{randomInt(18, 65)}}",
  "email": "{{randomString(8)}}@example.com"
}
```

### 内置函数

| 函数名 | 描述 | 参数 | 示例 |
|--------|------|------|------|
| `uuid()` | 生成UUID | 无 | `{{uuid()}}` |
| `randomString(length, charset?)` | 随机字符串 | 长度, 字符集 | `{{randomString(10)}}` |
| `randomInt(min, max)` | 随机整数 | 最小值, 最大值 | `{{randomInt(1, 100)}}` |
| `randomFloat(min, max, decimals?)` | 随机浮点数 | 最小值, 最大值, 小数位 | `{{randomFloat(0, 1, 2)}}` |
| `randomChoice(array)` | 随机选择 | 选项数组 | `{{randomChoice(["A", "B", "C"])}}` |
| `randomDate(start?, end?, format?)` | 随机日期 | 开始日期, 结束日期, 格式 | `{{randomDate()}}` |
| `sequence(start?, step?, prefix?, suffix?)` | 序列号 | 起始值, 步长, 前缀, 后缀 | `{{sequence(1, 1, "ID", "")}}` |

### 条件渲染

```json
{
  "#if": {
    "condition": "{{randomChoice([true, false])}}",
    "then": {
      "status": "active",
      "lastLogin": "{{randomDate()}}"
    },
    "else": {
      "status": "inactive"
    }
  }
}
```

### 循环生成

```json
{
  "tags": {
    "#repeat": 3,
    "template": "{{randomChoice([\"tag1\", \"tag2\", \"tag3\"])}}"
  }
}
```

### 变量引用

```json
{
  "name": "{{randomChoice([\"张三\", \"李四\"])}}",
  "greeting": "你好，{{name}}！",
  "profile": {
    "displayName": "{{name}}",
    "avatar": "https://example.com/avatar/{{$index}}.jpg"
  }
}
```

## 数据源配置

### JSON数据源

```json
{
  "dataSource": {
    "type": "json",
    "config": {
      "data": [
        {"city": "北京", "code": "010"},
        {"city": "上海", "code": "021"}
      ]
    }
  }
}
```

### API数据源

```json
{
  "dataSource": {
    "type": "api",
    "config": {
      "url": "https://api.example.com/cities",
      "headers": {
        "Authorization": "Bearer token"
      }
    }
  }
}
```

## API文档

### JsonGenerator

```typescript
class JsonGenerator {
  constructor(config?: GeneratorConfig)
  generate(rule: GenerationRule): Promise<GenerationResult>
  updateConfig(config: Partial<GeneratorConfig>): void
  getConfig(): GeneratorConfig
}
```

### 类型定义

```typescript
interface GenerationRule {
  id: string
  name: string
  description?: string
  template: JsonTemplate
  dataSource?: DataSource
  count: number
  conditions?: Condition[]
}

interface GeneratorConfig {
  batchSize?: number
  enableValidation?: boolean
  outputFormat?: 'json' | 'jsonl'
  prettify?: boolean
}
```

## 项目结构

```
src/
├── core/                 # 核心引擎
│   ├── JsonGenerator.ts  # 主生成器
│   ├── RuleEngine.ts     # 规则引擎
│   └── TemplateParser.ts # 模板解析器
├── components/           # React组件
│   ├── JsonGeneratorComponent.tsx
│   ├── RuleEditor.tsx
│   ├── JsonPreview.tsx
│   └── ExportPanel.tsx
├── types/               # 类型定义
├── utils/               # 工具函数
└── App.tsx              # 独立应用入口
```

## 开发指南

### 添加自定义函数

```typescript
import { RuleEngine } from 'json-generator-tool'

const ruleEngine = new RuleEngine()

// 注册自定义函数
ruleEngine.registerFunction({
  name: 'customFunction',
  description: '自定义函数',
  params: [
    { name: 'param1', type: 'string', required: true }
  ],
  execute: (param1: string) => {
    return `custom-${param1}`
  }
})
```

### 自定义验证

```typescript
import { validateJsonSchema } from 'json-generator-tool'

const schema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' }
  },
  required: ['id', 'name']
}

const result = validateJsonSchema(data, schema)
if (!result.isValid) {
  console.error('验证失败:', result.errors)
}
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的JSON生成功能
- 提供React组件和核心API
- 支持多种导出格式