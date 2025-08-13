import { Condition, BuiltinFunction } from '../types'

export class RuleEngine {
  private functions: Map<string, BuiltinFunction>

  constructor() {
    this.functions = new Map()
    this.registerBuiltinFunctions()
  }

  /**
   * 注册内置函数
   */
  private registerBuiltinFunctions(): void {
    // 随机字符串生成
    this.registerFunction({
      name: 'randomString',
      description: '生成随机字符串',
      params: [
        { name: 'length', type: 'number', required: false, defaultValue: 10 },
        { name: 'charset', type: 'string', required: false, defaultValue: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' }
      ],
      execute: (length = 10, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') => {
        let result = ''
        for (let i = 0; i < length; i++) {
          result += charset.charAt(Math.floor(Math.random() * charset.length))
        }
        return result
      }
    })

    // 随机数生成
    this.registerFunction({
      name: 'randomInt',
      description: '生成随机整数',
      params: [
        { name: 'min', type: 'number', required: true },
        { name: 'max', type: 'number', required: true }
      ],
      execute: (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min
      }
    })

    // 随机浮点数生成
    this.registerFunction({
      name: 'randomFloat',
      description: '生成随机浮点数',
      params: [
        { name: 'min', type: 'number', required: true },
        { name: 'max', type: 'number', required: true },
        { name: 'decimals', type: 'number', required: false, defaultValue: 2 }
      ],
      execute: (min: number, max: number, decimals = 2) => {
        const value = Math.random() * (max - min) + min
        return Number(value.toFixed(decimals))
      }
    })

    // 随机选择
    this.registerFunction({
      name: 'randomChoice',
      description: '从数组中随机选择一个元素',
      params: [
        { name: 'choices', type: 'array', required: true }
      ],
      execute: (choices: any[]) => {
        if (!Array.isArray(choices) || choices.length === 0) {
          return null
        }
        return choices[Math.floor(Math.random() * choices.length)]
      }
    })

    // 日期生成
    this.registerFunction({
      name: 'randomDate',
      description: '生成随机日期',
      params: [
        { name: 'start', type: 'string', required: false, defaultValue: '2020-01-01' },
        { name: 'end', type: 'string', required: false, defaultValue: '2024-12-31' },
        { name: 'format', type: 'string', required: false, defaultValue: 'iso' }
      ],
      execute: (start = '2020-01-01', end = '2024-12-31', format = 'iso') => {
        const startDate = new Date(start)
        const endDate = new Date(end)
        const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
        const randomDate = new Date(randomTime)
        
        switch (format) {
          case 'iso':
            return randomDate.toISOString()
          case 'date':
            return randomDate.toISOString().split('T')[0]
          case 'timestamp':
            return randomDate.getTime()
          default:
            return randomDate.toISOString()
        }
      }
    })

    // UUID生成
    this.registerFunction({
      name: 'uuid',
      description: '生成UUID',
      params: [],
      execute: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
      }
    })

    // 序列号生成
    this.registerFunction({
      name: 'sequence',
      description: '生成序列号',
      params: [
        { name: 'start', type: 'number', required: false, defaultValue: 1 },
        { name: 'step', type: 'number', required: false, defaultValue: 1 },
        { name: 'prefix', type: 'string', required: false, defaultValue: '' },
        { name: 'suffix', type: 'string', required: false, defaultValue: '' }
      ],
      execute: (start = 1, step = 1, prefix = '', suffix = '') => {
        // 注意：这里需要在模板解析时传入当前索引
        return (context: any) => {
          const value = start + (context.$index || 0) * step
          return `${prefix}${value}${suffix}`
        }
      }
    })

    // 格式化函数
    this.registerFunction({
      name: 'format',
      description: '格式化字符串',
      params: [
        { name: 'template', type: 'string', required: true },
        { name: 'values', type: 'array', required: true }
      ],
      execute: (template: string, values: any[]) => {
        return template.replace(/\{(\d+)\}/g, (match, index) => {
          return values[parseInt(index)] || match
        })
      }
    })
  }

  /**
   * 注册自定义函数
   */
  registerFunction(func: BuiltinFunction): void {
    this.functions.set(func.name, func)
  }

  /**
   * 获取函数
   */
  getFunction(name: string): BuiltinFunction | undefined {
    return this.functions.get(name)
  }

  /**
   * 获取所有函数
   */
  getAllFunctions(): BuiltinFunction[] {
    return Array.from(this.functions.values())
  }

  /**
   * 执行函数
   */
  executeFunction(name: string, args: any[], context?: any): any {
    const func = this.functions.get(name)
    if (!func) {
      throw new Error(`未找到函数: ${name}`)
    }

    try {
      const result = func.execute(...args)
      // 如果返回的是函数，则传入上下文执行
      if (typeof result === 'function' && context) {
        return result(context)
      }
      return result
    } catch (error) {
      throw new Error(`函数执行失败 ${name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 评估条件
   */
  evaluateConditions(conditions: Condition[], context: Record<string, any>): boolean {
    return conditions.every(condition => this.evaluateCondition(condition, context))
  }

  /**
   * 评估单个条件
   */
  private evaluateCondition(condition: Condition, context: Record<string, any>): boolean {
    const fieldValue = this.getFieldValue(condition.field, context)
    const conditionValue = condition.value

    switch (condition.operator) {
      case 'eq':
        return fieldValue === conditionValue
      case 'ne':
        return fieldValue !== conditionValue
      case 'gt':
        return fieldValue > conditionValue
      case 'lt':
        return fieldValue < conditionValue
      case 'gte':
        return fieldValue >= conditionValue
      case 'lte':
        return fieldValue <= conditionValue
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
      case 'nin':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue)
      case 'contains':
        return String(fieldValue).includes(String(conditionValue))
      default:
        return false
    }
  }

  /**
   * 获取字段值（支持嵌套路径）
   */
  private getFieldValue(field: string, context: Record<string, any>): any {
    const parts = field.split('.')
    let value = context
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return undefined
      }
    }
    
    return value
  }
}