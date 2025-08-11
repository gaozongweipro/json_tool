# JSON生成循环模式说明

本工具支持两种主要的JSON生成模式，可以满足不同的数据生成需求。

## 模式一：固定字段值生成

这种模式适用于生成指定数量的JSON对象，每个对象的字段值相对独立。

### 基本语法

```json
{
  "id": "{{uuid()}}",
  "name": "{{randomChoice([\"张三\", \"李四\", \"王五\"])}}",
  "age": "{{randomInt(18, 65)}}",
  "email": "{{randomString(8)}}@example.com"
}
```

### 特点
- 每个字段独立生成
- 支持所有内置函数
- 适合生成用户、产品等基础数据

## 模式二：循环生成模式

这种模式支持单层或多层循环，循环对象中的字段值可以依赖循环变量和其他设置的字段。

### 2.1 单层循环

#### 数值范围循环 (#for)

```json
{
  "#for": {
    "start": 0,
    "end": 5,
    "step": 1,
    "template": {
      "item_{{$i}}": {
        "index": "{{$i}}",
        "name": "项目{{$i}}",
        "value": "{{randomInt(1, 100)}}"
      }
    }
  }
}
```

**循环变量：**
- `$i`: 当前循环值
- `$start`: 循环起始值
- `$end`: 循环结束值
- `$step`: 循环步长

#### 数组遍历循环 (#each)

```json
{
  "#each": {
    "array": ["技术部", "产品部", "设计部"],
    "template": {
      "{{$item}}_info": {
        "department": "{{$item}}",
        "index": "{{$index}}",
        "total": "{{$length}}"
      }
    }
  }
}
```

**循环变量：**
- `$item`: 当前数组项
- `$index`: 当前索引
- `$length`: 数组长度

### 2.2 数组中的循环生成

#### 固定数量生成

```json
{
  "orders": [
    {
      "#generate": {
        "mode": "fixed",
        "count": 3,
        "template": {
          "orderId": "{{uuid()}}",
          "amount": "{{randomFloat(10, 1000, 2)}}",
          "index": "{{$generateIndex}}"
        }
      }
    }
  ]
}
```

**生成变量：**
- `$generateIndex`: 生成索引
- `$generateCount`: 总生成数量

#### 循环生成

```json
{
  "items": [
    {
      "#generate": {
        "mode": "loop",
        "loops": [
          {
            "type": "range",
            "variable": "i",
            "start": 1,
            "end": 4
          }
        ],
        "template": {
          "id": "item_{{i}}",
          "value": "{{randomInt(1, 100)}}"
        }
      }
    }
  ]
}
```

### 2.3 多层嵌套循环

```json
{
  "#nested": {
    "loops": [
      {
        "type": "array",
        "variable": "dept",
        "array": ["技术部", "产品部"]
      },
      {
        "type": "range",
        "variable": "empIndex",
        "start": 1,
        "end": 3
      }
    ],
    "template": {
      "{{dept}}_employee_{{empIndex}}": {
        "department": "{{dept}}",
        "employeeId": "EMP_{{dept_index}}_{{empIndex}}",
        "name": "{{randomChoice([\"张三\", \"李四\"])}}"
      }
    }
  }
}
```

**嵌套循环变量：**
- 每个循环的变量名由配置指定
- 自动生成 `{变量名}_index` 作为索引
- 对于数组循环，还有 `{变量名}_length`

### 2.4 循环类型说明

#### range 类型
- 数值范围循环
- 参数：`start`, `end`, `step`
- 变量：循环值和索引

#### array 类型
- 数组遍历循环
- 参数：`array`
- 变量：数组项、索引、长度

#### object 类型
- 对象遍历循环
- 参数：`object`
- 变量：键值对、键、值、索引

## 字段依赖关系

在循环模式中，字段值可以依赖：

1. **循环变量**：如 `$i`, `$item`, 自定义变量等
2. **其他字段**：同一对象中已解析的字段
3. **上下文变量**：如 `$index`, `$random`, `$timestamp` 等
4. **内置函数**：所有随机生成函数

## 使用建议

1. **简单数据生成**：使用模式一，直接定义字段和函数
2. **关联数据生成**：使用单层循环，如用户-订单关系
3. **复杂层级数据**：使用嵌套循环，如组织架构、分类体系
4. **数组数据**：使用数组循环生成，控制数组长度和内容

## 性能注意事项

- 嵌套循环会指数级增加生成数量，请合理控制循环范围
- 大量数据生成时建议分批处理
- 复杂模板解析会影响性能，可适当简化模板结构