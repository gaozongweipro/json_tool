import { JsonTemplate } from '../types'
import { RuleEngine } from './RuleEngine'

export class TemplateParser {
  private ruleEngine: RuleEngine
  private functionRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*\}\}/g
  private variableRegex = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_.$]*)\s*\}\}/g

  constructor() {
    this.ruleEngine = new RuleEngine()
  }

  /**
   * 解析模板
   */
  parse(template: JsonTemplate, context: Record<string, any>): any {
    return this.parseValue(template, context)
  }

  /**
   * 解析值（递归处理对象和数组）
   */
  private parseValue(value: any, context: Record<string, any>): any {
    if (typeof value === 'string') {
      return this.parseString(value, context)
    }
    
    if (Array.isArray(value)) {
      return this.parseArray(value, context)
    }
    
    if (value && typeof value === 'object') {
      return this.parseObject(value, context)
    }
    
    return value
  }

  /**
   * 解析字符串模板
   */
  private parseString(str: string, context: Record<string, any>): any {
    let result = str
    
    // 重置正则表达式的lastIndex
    this.functionRegex.lastIndex = 0
    this.variableRegex.lastIndex = 0
    
    // 解析函数调用
    result = result.replace(this.functionRegex, (match, funcName, argsStr) => {
      try {
        const args = this.parseArguments(argsStr, context)
        const funcResult = this.ruleEngine.executeFunction(funcName, args, context)
        return String(funcResult)
      } catch (error) {
        console.warn(`函数解析失败: ${match}`, error)
        return match
      }
    })
    
    // 重置正则表达式的lastIndex
    this.variableRegex.lastIndex = 0
    
    // 解析变量引用
    result = result.replace(this.variableRegex, (match, varPath) => {
      try {
        const value = this.getNestedValue(context, varPath)
        return value !== undefined ? String(value) : match
      } catch (error) {
        console.warn(`变量解析失败: ${match}`, error)
        return match
      }
    })
    
    // 尝试转换为合适的类型
    return this.convertType(result, str)
  }

  /**
   * 解析数组模板
   */
  private parseArray(arr: any[], context: Record<string, any>): any[] {
    const result: any[] = []
    
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i]
      
      // 处理数组循环语法 {{#repeat count}}
      if (typeof item === 'object' && item['#repeat']) {
        const repeatCount = this.parseValue(item['#repeat'], context)
        const template = item.template || item
        
        for (let j = 0; j < repeatCount; j++) {
          const itemContext = {
            ...context,
            $arrayIndex: j,
            $arrayLength: repeatCount
          }
          result.push(this.parseValue(template, itemContext))
        }
      }
      // 处理数组中的循环生成 {{#generate config}}
      else if (typeof item === 'object' && item['#generate']) {
        const config = item['#generate']
        const { mode, count, template } = config
        
        if (mode === 'fixed' && count) {
          // 固定数量生成模式
          const generateCount = this.parseValue(count, context)
          for (let j = 0; j < generateCount; j++) {
            const itemContext = {
              ...context,
              $generateIndex: j,
              $generateCount: generateCount
            }
            result.push(this.parseValue(template, itemContext))
          }
        } else if (mode === 'loop' && config.loops) {
          // 循环生成模式
          this.generateArrayWithLoops(config.loops, template, context, result)
        }
      } else {
        const itemContext = {
          ...context,
          $arrayIndex: i,
          $arrayLength: arr.length
        }
        result.push(this.parseValue(item, itemContext))
      }
    }
    
    return result
  }

  /**
   * 解析对象模板
   */
  private parseObject(obj: Record<string, any>, context: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}
    
    // 首先进行两次遍历：第一次处理非模板字段，第二次处理模板字段
    // 这样可以确保在解析模板字段时，同一对象中的其他字段已经可用
    
    // 第一次遍历：处理特殊指令和非模板字段
    for (const [key, value] of Object.entries(obj)) {
      // 处理条件渲染 {{#if condition}}
      if (key === '#if') {
        const condition = this.parseValue(value.condition, context)
        if (condition) {
          Object.assign(result, this.parseValue(value.then || {}, context))
        } else if (value.else) {
          Object.assign(result, this.parseValue(value.else, context))
        }
        continue
      }
      
      // 处理循环渲染 {{#each array}}
      if (key === '#each') {
        const arrayData = this.parseValue(value.array, context)
        const template = value.template
        
        if (Array.isArray(arrayData)) {
          arrayData.forEach((item, index) => {
            const itemContext = {
              ...context,
              $item: item,
              $index: index,
              $length: arrayData.length
            }
            const parsedItem = this.parseValue(template, itemContext)
            if (typeof parsedItem === 'object') {
              Object.assign(result, parsedItem)
            }
          })
        }
        continue
      }
      
      // 处理数值循环 {{#for start end step}}
      if (key === '#for') {
        const { start = 0, end, step = 1, template } = value
        const startVal = this.parseValue(start, context)
        const endVal = this.parseValue(end, context)
        const stepVal = this.parseValue(step, context)
        
        for (let i = startVal; i < endVal; i += stepVal) {
          const itemContext = {
            ...context,
            $i: i,
            $start: startVal,
            $end: endVal,
            $step: stepVal
          }
          const parsedItem = this.parseValue(template, itemContext)
          if (typeof parsedItem === 'object') {
            Object.assign(result, parsedItem)
          }
        }
        continue
      }
      
      // 处理嵌套循环 {{#nested loops}}
      if (key === '#nested') {
        const nestedResult: any[] = []
        this.processNestedLoopsForArray(value, context, nestedResult)
        // 将数组结果合并到主结果中
        nestedResult.forEach((item, index) => {
          Object.assign(result, item)
        })
        continue
      }
      
      // 处理非模板字段（不包含模板语法的字段）
      if (typeof value !== 'string' || !this.hasTemplateExpression(value)) {
        const parsedKey = this.parseString(key, context)
        result[parsedKey] = this.parseValue(value, context)
      }
    }
    
    // 创建扩展的上下文，包含当前对象的已解析字段
    const extendedContext = { ...context, ...result }
    
    // 第二次遍历：处理包含模板表达式的字段
    for (const [key, value] of Object.entries(obj)) {
      // 跳过特殊指令
      if (key.startsWith('#')) {
        continue
      }
      
      // 处理包含模板表达式的字段
      if (typeof value === 'string' && this.hasTemplateExpression(value)) {
        const parsedKey = this.parseString(key, extendedContext)
        result[parsedKey] = this.parseValue(value, extendedContext)
      }
    }
    
    return result
  }
  
  /**
    * 在数组中生成循环项
    */
   private generateArrayWithLoops(
     loops: any[], 
     template: any, 
     context: Record<string, any>, 
     result: any[]
   ): void {
     this.executeArrayLoop(loops, 0, context, template, result)
   }
   
   /**
    * 递归执行数组循环生成
    */
   private executeArrayLoop(
     loops: any[], 
     currentLevel: number, 
     context: Record<string, any>, 
     template: any, 
     result: any[]
   ): void {
     if (currentLevel >= loops.length) {
       // 所有循环层级都已处理，生成数组项
       const parsedItem = this.parseValue(template, context)
       result.push(parsedItem)
       return
     }
     
     const loop = loops[currentLevel]
     const { type, variable, ...loopConfig } = loop
     
     switch (type) {
       case 'range':
         const { start = 0, end, step = 1 } = loopConfig
         const startVal = this.parseValue(start, context)
         const endVal = this.parseValue(end, context)
         const stepVal = this.parseValue(step, context)
         
         for (let i = startVal; i < endVal; i += stepVal) {
           const newContext = {
             ...context,
             [variable]: i,
             [`${variable}_index`]: Math.floor((i - startVal) / stepVal)
           }
           this.executeArrayLoop(loops, currentLevel + 1, newContext, template, result)
         }
         break
         
       case 'array':
         const arrayData = this.parseValue(loopConfig.array, context)
         if (Array.isArray(arrayData)) {
           arrayData.forEach((item, index) => {
             const newContext = {
               ...context,
               [variable]: item,
               [`${variable}_index`]: index,
               [`${variable}_length`]: arrayData.length
             }
             this.executeArrayLoop(loops, currentLevel + 1, newContext, template, result)
           })
         }
         break
     }
   }
   
   /**
    * 处理嵌套循环
    */
   private processNestedLoops(config: any, context: Record<string, any>, result: Record<string, any>): void {
    const { loops, template } = config
    
    if (!Array.isArray(loops) || loops.length === 0) {
      return
    }
    
    // 添加全局索引计数器
    const contextWithIndex = { ...context, $index: 0 }
    this.executeNestedLoop(loops, 0, contextWithIndex, template, result)
  }

  private processNestedLoopsForArray(config: any, context: Record<string, any>, result: any[]): void {
    const { loops, template } = config
    
    if (!Array.isArray(loops) || loops.length === 0) {
      return
    }
    
    // 添加全局索引计数器
    const contextWithIndex = { ...context, $index: 0 }
    this.executeNestedLoopForArray(loops, 0, contextWithIndex, template, result)
  }
  
  /**
   * 递归执行嵌套循环
   */
  private executeNestedLoop(
    loops: any[], 
    currentLevel: number, 
    context: Record<string, any>, 
    template: any, 
    result: Record<string, any>
  ): void {
    if (currentLevel >= loops.length) {
      // 所有循环层级都已处理，执行模板
      const parsedItem = this.parseValue(template, context)
      if (typeof parsedItem === 'object') {
        Object.assign(result, parsedItem)
      }
      // 递增全局索引
      context.$index = (context.$index || 0) + 1
      return
    }
    
    const loop = loops[currentLevel]
    const { type, variable, ...loopConfig } = loop
    
    switch (type) {
      case 'range':
        const { start = 0, end, step = 1 } = loopConfig
        const startVal = this.parseValue(start, context)
        const endVal = this.parseValue(end, context)
        const stepVal = this.parseValue(step, context)
        
        for (let i = startVal; i < endVal; i += stepVal) {
          const newContext = {
            ...context,
            [variable]: i,
            [`${variable}_index`]: Math.floor((i - startVal) / stepVal)
          }
          this.executeNestedLoop(loops, currentLevel + 1, newContext, template, result)
        }
        break
        
      case 'array':
        const arrayData = this.parseValue(loopConfig.array, context)
        if (Array.isArray(arrayData)) {
          arrayData.forEach((item, index) => {
            const newContext = {
              ...context,
              [variable]: item,
              [`${variable}_index`]: index,
              [`${variable}_length`]: arrayData.length
            }
            this.executeNestedLoop(loops, currentLevel + 1, newContext, template, result)
          })
        }
        break
        
      case 'object':
        const objectData = this.parseValue(loopConfig.object, context)
        if (typeof objectData === 'object' && objectData !== null) {
          Object.entries(objectData).forEach(([key, value], index) => {
            const newContext = {
              ...context,
              [variable]: { key, value },
              [`${variable}_key`]: key,
              [`${variable}_value`]: value,
              [`${variable}_index`]: index
            }
            this.executeNestedLoop(loops, currentLevel + 1, newContext, template, result)
          })
        }
        break
    }
  }

  private executeNestedLoopForArray(
     loops: any[], 
     currentLevel: number, 
     context: Record<string, any>, 
     template: any, 
     result: any[]
   ): void {
     if (currentLevel >= loops.length) {
       // 所有循环层级都已处理，执行模板
       const parsedItem = this.parseValue(template, context)
       if (typeof parsedItem === 'object') {
         result.push(parsedItem)
       }
       // 递增全局索引
       context.$index = (context.$index || 0) + 1
       return
     }
     
     const loop = loops[currentLevel]
     const { type, variable, ...loopConfig } = loop
     
     switch (type) {
       case 'range':
         const { start = 0, end, step = 1 } = loopConfig
         const startVal = this.parseValue(start, context)
         const endVal = this.parseValue(end, context)
         const stepVal = this.parseValue(step, context)
         
         for (let i = startVal; i < endVal; i += stepVal) {
           const newContext = {
             ...context,
             [variable]: i,
             [`${variable}_index`]: Math.floor((i - startVal) / stepVal)
           }
           this.executeNestedLoopForArray(loops, currentLevel + 1, newContext, template, result)
         }
         break
         
       case 'array':
         const arrayData = this.parseValue(loopConfig.array, context)
         if (Array.isArray(arrayData)) {
           arrayData.forEach((item, index) => {
             const newContext = {
               ...context,
               [variable]: item,
               [`${variable}_index`]: index,
               [`${variable}_length`]: arrayData.length
             }
             this.executeNestedLoopForArray(loops, currentLevel + 1, newContext, template, result)
           })
         }
         break
         
       case 'object':
         const objectData = this.parseValue(loopConfig.object, context)
         if (typeof objectData === 'object' && objectData !== null) {
           Object.entries(objectData).forEach(([key, value], index) => {
             const newContext = {
               ...context,
               [variable]: { key, value },
               [`${variable}_key`]: key,
               [`${variable}_value`]: value,
               [`${variable}_index`]: index
             }
             this.executeNestedLoopForArray(loops, currentLevel + 1, newContext, template, result)
           })
         }
         break
     }
   }
  
  /**
    * 检查字符串是否包含模板表达式
    */
   private hasTemplateExpression(str: string): boolean {
     // 重置正则表达式的lastIndex，避免全局正则表达式状态影响
     this.functionRegex.lastIndex = 0
     this.variableRegex.lastIndex = 0
     return this.functionRegex.test(str) || this.variableRegex.test(str)
   }

  /**
   * 解析函数参数
   */
  private parseArguments(argsStr: string, context: Record<string, any>): any[] {
    if (!argsStr.trim()) {
      return []
    }
    
    const args: any[] = []
    const parts = this.splitArguments(argsStr)
    
    for (const part of parts) {
      const trimmed = part.trim()
      
      // 字符串字面量
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        args.push(trimmed.slice(1, -1))
      }
      // 数字字面量
      else if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        args.push(Number(trimmed))
      }
      // 布尔字面量
      else if (trimmed === 'true' || trimmed === 'false') {
        args.push(trimmed === 'true')
      }
      // 数组字面量
      else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          args.push(JSON.parse(trimmed))
        } catch {
          args.push([])
        }
      }
      // 变量引用
      else {
        const value = this.getNestedValue(context, trimmed)
        args.push(value)
      }
    }
    
    return args
  }

  /**
   * 分割函数参数（考虑嵌套括号和引号）
   */
  private splitArguments(argsStr: string): string[] {
    const args: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''
    let depth = 0
    
    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i]
      
      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true
        quoteChar = char
        current += char
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false
        current += char
      } else if (!inQuotes && (char === '[' || char === '(')) {
        depth++
        current += char
      } else if (!inQuotes && (char === ']' || char === ')')) {
        depth--
        current += char
      } else if (!inQuotes && char === ',' && depth === 0) {
        args.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    if (current.trim()) {
      args.push(current.trim())
    }
    
    return args
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    const parts = path.split('.')
    let current = obj
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return undefined
      }
    }
    
    return current
  }

  /**
   * 类型转换
   */
  private convertType(result: string, original: string): any {
    // 如果原始字符串完全是模板，尝试转换类型
    if (original.match(/^\{\{.*\}\}$/)) {
      // 尝试解析为数字
      if (/^-?\d+$/.test(result)) {
        return parseInt(result, 10)
      }
      if (/^-?\d+\.\d+$/.test(result)) {
        return parseFloat(result)
      }
      // 尝试解析为布尔值
      if (result === 'true') return true
      if (result === 'false') return false
      // 尝试解析为JSON
      if ((result.startsWith('{') && result.endsWith('}')) ||
          (result.startsWith('[') && result.endsWith(']'))) {
        try {
          return JSON.parse(result)
        } catch {
          // 解析失败，返回字符串
        }
      }
    }
    
    return result
  }

  /**
   * 注册自定义函数
   */
  registerFunction(name: string, func: (...args: any[]) => any): void {
    this.ruleEngine.registerFunction({
      name,
      description: `自定义函数: ${name}`,
      params: [],
      execute: func
    })
  }
}