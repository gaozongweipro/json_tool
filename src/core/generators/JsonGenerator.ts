import { GenerationRule, GeneratorConfig, GenerationResult, ValidationResult } from '../types'
import { RuleEngine } from './RuleEngine'
import { TemplateParser } from './TemplateParser'
import { validateJsonSchema } from '../utils'

export class JsonGenerator {
  private ruleEngine: RuleEngine
  private templateParser: TemplateParser
  private config: GeneratorConfig

  constructor(config: GeneratorConfig = {}) {
    this.config = {
      batchSize: 1000,
      enableValidation: true,
      outputFormat: 'json',
      prettify: true,
      ...config
    }
    this.ruleEngine = new RuleEngine()
    this.templateParser = new TemplateParser()
  }

  /**
   * 根据规则生成JSON数据
   */
  async generate(rule: GenerationRule): Promise<GenerationResult> {
    try {
      const startTime = Date.now()
      const data: any[] = []
      
      // 验证规则
      if (this.config.enableValidation) {
        const validation = this.validateRule(rule)
        if (!validation.isValid) {
          throw new Error(`规则验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
        }
      }

      // 准备数据源
      const sourceData = await this.prepareDataSource(rule)
      
      // 批量生成数据
      const totalBatches = Math.ceil(rule.count / this.config.batchSize!)
      
      for (let batch = 0; batch < totalBatches; batch++) {
        const batchStart = batch * this.config.batchSize!
        const batchEnd = Math.min(batchStart + this.config.batchSize!, rule.count)
        const batchSize = batchEnd - batchStart
        
        const batchData = await this.generateBatch(rule, sourceData, batchSize, batchStart)
        data.push(...batchData)
      }

      const endTime = Date.now()
      
      return {
        data,
        metadata: {
          totalCount: data.length,
          generatedAt: new Date().toISOString(),
          rule: { ...rule }
        }
      }
    } catch (error) {
      throw new Error(`生成失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 生成单个批次的数据
   */
  private async generateBatch(
    rule: GenerationRule, 
    sourceData: any[], 
    batchSize: number, 
    offset: number
  ): Promise<any[]> {
    const batch: any[] = []
    
    for (let i = 0; i < batchSize; i++) {
      const index = offset + i
      const context = this.createContext(index, sourceData)
      

      
      // 解析模板
      const item = this.templateParser.parse(rule.template, context)
      
      // 验证生成的数据
      if (this.config.enableValidation) {
        const validation = validateJsonSchema(item)
        if (!validation.isValid) {
          console.warn(`第${index + 1}条数据验证失败:`, validation.errors)
          continue
        }
      }
      
      batch.push(item)
    }
    
    return batch
  }

  /**
   * 准备数据源
   */
  private async prepareDataSource(rule: GenerationRule): Promise<any[]> {
    return []
  }

  /**
   * 创建模板解析上下文
   */
  private createContext(index: number, sourceData: any[]): Record<string, any> {
    const sourceItem = sourceData[index % sourceData.length] || {}
    
    return {
      $index: index,
      $random: Math.random(),
      $timestamp: Date.now(),
      $date: new Date().toISOString(),
      $source: sourceItem,
      ...sourceItem
    }
  }

  /**
   * 验证规则
   */
  private validateRule(rule: GenerationRule): ValidationResult {
    const errors: any[] = []
    
    if (!rule.name || rule.name.trim() === '') {
      errors.push({ path: 'name', message: '规则名称不能为空' })
    }
    
    if (!rule.template || typeof rule.template !== 'object') {
      errors.push({ path: 'template', message: '模板必须是有效的对象' })
    }
    
    if (rule.count <= 0) {
      errors.push({ path: 'count', message: '生成数量必须大于0' })
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取当前配置
   */
  getConfig(): GeneratorConfig {
    return { ...this.config }
  }
}