import { JsonGenerator } from '../core/JsonGenerator'
import { GeneratorConfig, ValidationResult } from '../types'
import Ajv from 'ajv'

/**
 * 创建JSON生成器实例
 */
export function createJsonGenerator(config?: GeneratorConfig): JsonGenerator {
  return new JsonGenerator(config)
}

/**
 * 验证JSON Schema
 */
export function validateJsonSchema(data: any, schema?: object): ValidationResult {
  if (!schema) {
    // 基本验证：检查是否为有效JSON
    try {
      JSON.stringify(data)
      return { isValid: true, errors: [] }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          path: 'root',
          message: `无效的JSON数据: ${error instanceof Error ? error.message : String(error)}`
        }]
      }
    }
  }

  // 使用AJV进行Schema验证
  const ajv = new Ajv({ allErrors: true })
  const validate = ajv.compile(schema)
  const isValid = validate(data)

  if (isValid) {
    return { isValid: true, errors: [] }
  }

  const errors = (validate.errors || []).map(error => ({
    path: error.instancePath || 'root',
    message: error.message || '验证失败',
    value: error.data
  }))

  return { isValid: false, errors }
}

/**
 * 导出数据为JSON文件
 */
export function exportToJson(data: any[], filename = 'data.json', prettify = true): void {
  const content = prettify ? JSON.stringify(data, null, 2) : JSON.stringify(data)
  downloadFile(content, filename, 'application/json')
}

/**
 * 导出数据为JSONL文件
 */
export function exportToJsonl(data: any[], filename = 'data.jsonl'): void {
  const content = data.map(item => JSON.stringify(item)).join('\n')
  downloadFile(content, filename, 'application/x-jsonlines')
}

/**
 * 导出数据为CSV文件
 */
export function exportToCsv(data: any[], filename = 'data.csv'): void {
  if (data.length === 0) {
    downloadFile('', filename, 'text/csv')
    return
  }

  // 获取所有可能的列名
  const allKeys = new Set<string>()
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(flattenObject(item)).forEach(key => allKeys.add(key))
    }
  })

  const headers = Array.from(allKeys)
  const csvContent = [
    headers.join(','),
    ...data.map(item => {
      const flattened = flattenObject(item)
      return headers.map(header => {
        const value = flattened[header]
        if (value === undefined || value === null) return ''
        const stringValue = String(value)
        // 如果包含逗号、引号或换行符，需要用引号包围并转义
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    })
  ].join('\n')

  downloadFile(csvContent, filename, 'text/csv')
}

/**
 * 扁平化对象（用于CSV导出）
 */
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const flattened: Record<string, any> = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}.${key}` : key

      if (value === null || value === undefined) {
        flattened[newKey] = value
      } else if (Array.isArray(value)) {
        flattened[newKey] = JSON.stringify(value)
      } else if (typeof value === 'object') {
        Object.assign(flattened, flattenObject(value, newKey))
      } else {
        flattened[newKey] = value
      }
    }
  }

  return flattened
}

/**
 * 下载文件
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  const cloned = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  
  return cloned
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastTime >= wait) {
      lastTime = now
      func(...args)
    }
  }
}

/**
 * 生成示例规则
 */
export function createSampleRule() {
  return {
    id: 'sample-rule',
    name: '示例规则',
    description: '这是一个示例规则，展示了各种动态字段和循环功能的使用',
    template: {
      // 基础模式：固定字段值生成
      id: '{{uuid()}}',
      name: '{{randomChoice(["张三", "李四", "王五", "赵六"])}}',
      age: '{{randomInt(18, 65)}}',
      email: '{{randomString(8)}}@example.com',
      score: '{{randomFloat(0, 100, 2)}}',
      createdAt: '{{randomDate("2020-01-01", "2024-12-31", "YYYY-MM-DD HH:mm:ss")}}',
      
      // 对象内字段依赖示例
      profile: {
        bio: '这是用户的个人简介',
        avatar: '{{uuid()}}.jpg',
        tags: [
          '{{randomChoice(["技术", "设计", "产品", "运营"])}}',
          '{{randomChoice(["前端", "后端", "全栈", "移动端"])}}'
        ]
      },
      
      // 单层循环示例：生成多个地址
      '#for': {
        start: 0,
        end: 3,
        template: {
          'address_{{$i}}': {
            province: '{{randomChoice(["北京", "上海", "广东", "浙江"])}}',
            city: '{{randomChoice(["北京市", "上海市", "深圳市", "杭州市"])}}',
            detail: '{{randomString(10)}}路{{randomInt(1, 999)}}号',
            index: '{{$i}}'
          }
        }
      },
      
      // 数组中的循环生成示例
      orders: [
        {
          '#generate': {
            mode: 'fixed',
            count: 3,
            template: {
              orderId: '{{uuid()}}',
              amount: '{{randomFloat(10, 1000, 2)}}',
              status: '{{randomChoice(["pending", "completed", "cancelled"])}}',
              orderIndex: '{{$generateIndex}}'
            }
          }
        }
      ],
      
      // 嵌套循环示例：为每个部门生成员工
      '#nested': {
        loops: [
          {
            type: 'array',
            variable: 'dept',
            array: ['技术部', '产品部', '设计部']
          },
          {
            type: 'range',
            variable: 'empIndex',
            start: 1,
            end: 3
          }
        ],
        template: {
          '{{dept}}_employee_{{empIndex}}': {
            department: '{{dept}}',
            employeeId: 'EMP_{{dept_index}}_{{empIndex}}',
            name: '{{randomChoice(["张三", "李四", "王五"])}}',
            position: '{{randomChoice(["工程师", "经理", "专员"])}}'
          }
        }
      }
    },

    count: 5
  }
}