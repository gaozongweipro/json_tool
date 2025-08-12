# JSON生成工具

一个功能强大的JSON数据批量生成工具，基于Vue 3构建，提供直观的可视化界面和灵活的配置选项。

## ✨ 功能特性

### 🎯 配置管理
- **配置首页**: 启动时展示配置管理界面，支持快速选择已有配置或创建新配置
- **配置保存**: 支持本地保存配置，方便重复使用
- **配置导入/导出**: 支持配置文件的导入导出，便于分享和备份
- **配置预览**: 加载配置后直接跳转到预览界面，提升使用效率

### 🚀 数据生成策略
- **单一生成**: 生成单条数据记录
- **批量生成**: 高效批量生成大量数据
- **交叉生成**: 多维度数据交叉组合生成
- **自定义数量**: 灵活设置生成数据的数量

### 🔧 字段配置
- **固定值**: 设置字段的固定值
- **序列递增**: 自动递增的序列号
- **分类选择**: 从预定义选项中随机选择
- **范围值**: 在指定范围内生成随机数值
- **模板字符串**: 支持复杂的模板表达式
- **可视化配置**: 无需编写代码的图形化配置界面

### 📊 预览与导出
- **实时预览**: 配置完成后立即预览生成效果
- **表格视图**: 清晰的表格形式展示数据
- **JSON视图**: 原始JSON格式查看
- **多格式导出**: 支持JSON、JSONL、CSV格式导出
- **批量下载**: 大数据量自动分割下载

### 🎨 用户体验
- **响应式设计**: 完美适配桌面端和移动端
- **简洁精致**: 现代化的UI设计，操作直观
- **步骤导航**: 清晰的操作流程指引
- **毛玻璃效果**: 精美的视觉效果和动画
- **深色模式**: 支持深色主题切换

## 🚀 快速开始

### 本地运行

```bash
# 克隆项目
git clone <repository-url>
cd json_tool

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 使用流程

1. **配置管理**: 启动应用后，选择"创建新配置"或加载已有配置
2. **生成策略**: 选择数据生成策略（单一/批量/交叉生成）
3. **字段配置**: 为每个字段设置生成规则和类型
4. **预览生成**: 预览数据样例，确认无误后生成完整数据
5. **导出数据**: 选择合适的格式导出生成的数据

## 📋 生成策略详解

### 单一生成
生成单条数据记录，适用于测试和样例数据创建。

### 批量生成
高效生成大量相似结构的数据，支持自定义生成数量。

### 交叉生成
多个字段值进行交叉组合，生成所有可能的组合数据。

## 🔧 字段类型说明

### 固定值
为字段设置一个固定的值，所有生成的记录该字段都使用相同值。

### 序列递增
生成自动递增的序列号，支持设置起始值、步长、前缀和后缀。

### 分类选择
从预定义的选项列表中随机选择值，支持自定义选项。

### 范围值
在指定的数值范围内生成随机数，支持整数和浮点数。

### 模板字符串
使用模板表达式生成复杂的字符串值，支持变量引用和函数调用。

## 🎨 界面特性

### 响应式布局
- **大屏幕**: 充分利用屏幕空间，多列布局展示
- **中等屏幕**: 适中的布局密度，保持良好的可读性
- **小屏幕**: 单列布局，优化触摸操作体验

### 视觉设计
- **毛玻璃效果**: 现代化的半透明背景效果
- **渐变色彩**: 精心设计的色彩搭配
- **动画效果**: 流畅的过渡和悬停动画
- **卡片设计**: 清晰的信息层次和视觉分组

### 可访问性
- **高对比度**: 支持高对比度模式
- **键盘导航**: 完整的键盘操作支持
- **屏幕阅读器**: 良好的无障碍访问支持
- **减少动画**: 支持减少动画偏好设置

## 📁 项目结构

```
src/
├── core/                 # 核心引擎
│   ├── JsonGenerator.ts  # 主生成器
│   ├── RuleEngine.ts     # 规则引擎
│   └── TemplateParser.ts # 模板解析器
├── components/           # Vue组件
│   ├── JsonGeneratorComponent.vue
│   ├── RuleEditor.vue
│   ├── JsonPreview.vue
│   ├── ExportPanel.vue
│   ├── VisualRuleBuilder.vue
│   ├── BusinessRuleBuilder.vue
│   ├── FieldConfig.vue
│   └── BusinessFieldConfig.vue
├── types/               # 类型定义
├── utils/               # 工具函数
└── App.vue              # 独立应用入口
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