<template>
  <div class="fields-config-component">
    <div class="config-header">
      <h2>字段配置</h2>
      <p>配置JSON数据的字段信息和数据来源</p>
    </div>
    
    <!-- 添加字段按钮 -->
    <div class="add-field-section">
      <el-button type="primary" @click="addField" :icon="Plus">
        添加字段
      </el-button>
    </div>
    
    <!-- 字段列表 -->
    <div v-if="fields.length > 0" class="fields-list">
      <div
        v-for="(field, index) in fields"
        :key="field.id"
        class="field-item"
      >
        <div class="field-header">
          <h4>字段 {{ index + 1 }}</h4>
          <el-button
            type="danger"
            size="small"
            @click="removeField(index)"
          >
            删除字段
          </el-button>
        </div>
        
        <!-- 基本信息配置 -->
        <div class="field-basic-config">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="字段名称" required>
                <el-input
                  v-model="field.name"
                  placeholder="请输入字段名称"
                  @change="handleFieldChange"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="字段Key" required>
                <el-input
                  v-model="field.key"
                  placeholder="请输入字段Key"
                  @change="handleFieldChange"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="数据类型" required>
                <el-select
                  v-model="field.type"
                  style="width: 100%"
                  @change="handleFieldChange"
                >
                  <el-option value="string" label="字符串" />
                  <el-option value="number" label="数字" />
                  <el-option value="boolean" label="布尔值" />
                  <el-option value="date" label="日期" />
                  <el-option value="email" label="邮箱" />
                  <el-option value="phone" label="手机号" />
                  <el-option value="url" label="网址" />
                  <el-option value="uuid" label="UUID" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        
        <!-- 数据来源配置 -->
        <div class="field-source-config">
          <h4>数据来源配置</h4>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="数据来源" required>
                <el-select
                  v-model="field.dataSource"
                  style="width: 100%"
                  @change="handleDataSourceChange(index)"
                >
                  <el-option value="fixed" label="固定值" />
                  <el-option value="increment" label="递增序列" />
                  <el-option value="template" label="自定义模板" />
                </el-select>
              </el-form-item>
            </el-col>
            
            <!-- 固定值配置 -->
            <el-col v-if="field.dataSource === 'fixed'" :span="16">
              <el-form-item label="固定值">
                <el-input
                  v-model="field.sourceConfig.fixedValue"
                  :placeholder="getFixedValuePlaceholder(field.type)"
                  @change="handleFieldChange"
                />
              </el-form-item>
            </el-col>
            
            <!-- 递增序列配置 -->
            <template v-else-if="field.dataSource === 'increment'">
              <el-col :span="5">
                <el-form-item label="起始值">
                  <el-input-number
                    v-model="field.sourceConfig.startValue"
                    style="width: 100%"
                    @change="handleFieldChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="步长">
                  <el-input-number
                    v-model="field.sourceConfig.step"
                    :min="1"
                    style="width: 100%"
                    @change="handleFieldChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="前缀">
                  <el-input
                    v-model="field.sourceConfig.prefix"
                    placeholder="可选前缀"
                    @change="handleFieldChange"
                  />
                </el-form-item>
              </el-col>
            </template>
            
            <!-- 自定义模板配置 -->
            <el-col v-else-if="field.dataSource === 'template'" :span="16">
              <el-form-item label="模板表达式">
                <el-input
                  v-model="field.sourceConfig.template"
                  :placeholder="getTemplatePlaceholder(field.type)"
                  @change="handleFieldChange"
                  type="textarea"
                  :rows="3"
                />
                <div class="template-help">
                  <small>{{ getTemplateHelp(field.type) }}</small>
                </div>
              </el-form-item>
              
              <!-- 可用变量展示 -->
              <div class="template-variables-section">
                <div class="variables-header">
                  <el-icon><InfoFilled /></el-icon>
                  <span>可用模板变量</span>
                </div>
                
                <!-- 策略变量 -->
                <div v-if="strategyVariables.length > 0" class="variable-group">
                  <div class="variable-group-title">策略变量</div>
                  <div class="variable-tags">
                    <el-tag 
                      v-for="variable in strategyVariables" 
                      :key="variable.name"
                      class="variable-tag clickable"
                      @click="insertVariable(index, variable.name)"
                      :title="variable.description"
                    >
                      {{ variable.name }}
                    </el-tag>
                  </div>
                </div>
                
                <!-- 遍历项字段变量 -->
                <div v-if="getTraverseItemFields().length > 0" class="variable-group">
                  <div class="variable-group-title">遍历项字段</div>
                  <div class="variable-tags">
                    <el-tag 
                      v-for="variable in getTraverseItemFields()" 
                      :key="variable.name"
                      class="variable-tag clickable"
                      type="info"
                      @click="insertVariable(index, variable.name)"
                      :title="variable.description"
                    >
                      {{ variable.name }}
                    </el-tag>
                  </div>
                </div>
                
                <!-- 复杂遍历字段变量 -->
                <div v-if="getComplexLevelFields().length > 0" class="variable-group">
                  <div class="variable-group-title">多层遍历字段</div>
                  <div class="variable-tags">
                    <el-tag 
                      v-for="variable in getComplexLevelFields()" 
                      :key="variable.name"
                      class="variable-tag clickable"
                      type="warning"
                      @click="insertVariable(index, variable.name)"
                      :title="variable.description"
                    >
                      {{ variable.name }}
                    </el-tag>
                  </div>
                </div>
                
                <!-- 其他字段变量 -->
                <div v-if="getOtherFieldVariables(index).length > 0" class="variable-group">
                  <div class="variable-group-title">其他字段</div>
                  <div class="variable-tags">
                    <el-tag 
                      v-for="variable in getOtherFieldVariables(index)" 
                      :key="variable.name"
                      class="variable-tag clickable"
                      type="success"
                      @click="insertVariable(index, variable.name)"
                      :title="variable.description"
                    >
                      {{ variable.name }}
                    </el-tag>
                  </div>
                </div>
                
                <!-- 内置函数 -->
                <div class="variable-group">
                  <div class="variable-group-title">内置函数</div>
                  <div class="variable-tags">
                    <el-tag 
                      v-for="func in builtInFunctions" 
                      :key="func.name"
                      class="variable-tag clickable"
                      type="danger"
                      @click="insertVariable(index, func.name)"
                      :title="func.description"
                    >
                      {{ func.name }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>暂无字段配置，请点击"添加字段"开始配置</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Plus, InfoFilled } from '@element-plus/icons-vue'

// Props
interface Props {
  modelValue: any[]
  strategyConfig?: any
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  strategyConfig: null
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: any[]]
  'change': [fields: any[]]
}>()

// 响应式数据
const fields = ref<any[]>([...props.modelValue])

// 字段ID计数器
let fieldIdCounter = 1

// 解析JSON数据中的字段
const parseJsonFields = (jsonString: string, prefix: string = '') => {
  try {
    const data = JSON.parse(jsonString)
    const fields: any[] = []
    
    if (Array.isArray(data) && data.length > 0) {
      const sampleItem = data[0]
      if (typeof sampleItem === 'object' && sampleItem !== null) {
        Object.keys(sampleItem).forEach(key => {
          const value = sampleItem[key]
          const fieldName = prefix ? `${prefix}.${key}` : key
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // 嵌套对象，递归解析
            fields.push({
              name: `{{${fieldName}}}`,
              description: `${fieldName} (对象)`
            })
            // 解析嵌套字段
            Object.keys(value).forEach(nestedKey => {
              fields.push({
                name: `{{${fieldName}.${nestedKey}}}`,
                description: `${fieldName}.${nestedKey} (${typeof value[nestedKey]})`
              })
            })
          } else {
            fields.push({
              name: `{{${fieldName}}}`,
              description: `${fieldName} (${typeof value})`
            })
          }
        })
      }
    }
    
    return fields
  } catch (error) {
    return []
  }
}

// 计算生成策略变量
const strategyVariables = computed(() => {
  if (!props.strategyConfig) return []
  
  const variables = []
  
  // 基础变量
  variables.push({ name: '{{index}}', description: '当前遍历索引（从0开始）' })
  variables.push({ name: '{{index1}}', description: '当前遍历索引（从1开始）' })
  
  if (props.strategyConfig.strategy === 'traverse') {
    if (props.strategyConfig.traverseType === 'json') {
      variables.push({ name: '{{item}}', description: '当前遍历项' })
    } else if (props.strategyConfig.traverseType === 'range') {
      variables.push({ name: '{{value}}', description: '当前范围值' })
    }
  } else if (props.strategyConfig.strategy === 'complex') {
    props.strategyConfig.complexLevels?.forEach((level: any, index: number) => {
      const levelName = level.name || `level${index + 1}`
      variables.push({ name: `{{${levelName}.index}}`, description: `第${index + 1}层索引` })
      
      if (level.sourceType === 'json') {
        variables.push({ name: `{{${levelName}.item}}`, description: `第${index + 1}层遍历项` })
      } else {
        variables.push({ name: `{{${levelName}.value}}`, description: `第${index + 1}层范围值` })
      }
    })
  }
  
  return variables
})

// 获取遍历项字段变量（单层遍历）
const getTraverseItemFields = () => {
  if (!props.strategyConfig || props.strategyConfig.strategy !== 'traverse') return []
  
  if (props.strategyConfig.traverseType === 'json' && props.strategyConfig.jsonData) {
    return parseJsonFields(props.strategyConfig.jsonData, 'item')
  }
  
  return []
}

// 获取复杂遍历字段变量（多层遍历）
const getComplexLevelFields = () => {
  if (!props.strategyConfig || props.strategyConfig.strategy !== 'complex') return []
  
  const fields: any[] = []
  
  props.strategyConfig.complexLevels?.forEach((level: any, index: number) => {
    const levelName = level.name || `level${index + 1}`
    
    if (level.sourceType === 'json' && level.jsonData) {
      const levelFields = parseJsonFields(level.jsonData, `${levelName}.item`)
      fields.push(...levelFields)
    }
  })
  
  return fields
}

// 获取其他字段变量（排除当前字段）
const getOtherFieldVariables = (currentFieldIndex: number) => {
  return fields.value
    .filter((field, index) => field.key && field.key.trim() !== '' && index !== currentFieldIndex)
    .map(field => ({
      name: `{{${field.key}}}`,
      description: `${field.name || field.key} (${field.type})`
    }))
}

// 内置函数
const builtInFunctions = ref([
  { name: '{{random(min,max)}}', description: '生成指定范围的随机数' },
  { name: '{{uuid()}}', description: '生成UUID' },
  { name: '{{date("format")}}', description: '生成格式化日期' },
  { name: '{{timestamp()}}', description: '生成时间戳' },
  { name: '{{name()}}', description: '生成随机姓名' },
  { name: '{{city()}}', description: '生成随机城市' },
  { name: '{{phone()}}', description: '生成随机手机号' },
  { name: '{{email()}}', description: '生成随机邮箱' }
])

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  fields.value = [...newValue]
}, { deep: true })

// 监听fields变化并向外发送
watch(fields, (newFields) => {
  emit('update:modelValue', newFields)
  emit('change', newFields)
}, { deep: true })

// 方法
const addField = () => {
  const newField = {
    id: fieldIdCounter++,
    name: '',
    key: '',
    type: 'string',
    dataSource: 'fixed',
    sourceConfig: {
      fixedValue: '',
      startValue: 1,
      step: 1,
      prefix: '',
      template: ''
    }
  }
  fields.value.push(newField)
}

const removeField = (index: number) => {
  fields.value.splice(index, 1)
}

const handleFieldChange = () => {
  // 触发响应式更新
  emit('change', fields.value)
}

const handleDataSourceChange = (index: number) => {
  const field = fields.value[index]
  // 重置数据来源配置
  field.sourceConfig = {
    fixedValue: '',
    startValue: 1,
    step: 1,
    prefix: '',
    template: ''
  }
  handleFieldChange()
}

// 插入变量到模板
const insertVariable = (fieldIndex: number, variableName: string) => {
  const field = fields.value[fieldIndex]
  if (field.dataSource === 'template') {
    const currentTemplate = field.sourceConfig.template || ''
    const cursorPosition = currentTemplate.length
    field.sourceConfig.template = currentTemplate + variableName
    handleFieldChange()
  }
}

// 获取固定值占位符
const getFixedValuePlaceholder = (type: string) => {
  const placeholders: Record<string, string> = {
    string: '请输入固定字符串',
    number: '请输入固定数字',
    boolean: 'true 或 false',
    date: '2024-01-01 或 now',
    email: 'example@domain.com',
    phone: '13800138000',
    url: 'https://example.com',
    uuid: '自动生成UUID'
  }
  return placeholders[type] || '请输入固定值'
}

// 获取模板占位符
const getTemplatePlaceholder = (type: string) => {
  const placeholders: Record<string, string> = {
    string: '用户{{index1}}_{{item.name}}',
    number: '{{random(1,100)}} + {{index}}',
    boolean: '{{index}} % 2 === 0',
    date: '{{date("YYYY-MM-DD")}}',
    email: '{{item.name}}{{index1}}@example.com',
    phone: '138{{random(10000000,99999999)}}',
    url: 'https://{{item.domain}}/user/{{index1}}',
    uuid: '{{uuid()}}'
  }
  return placeholders[type] || '请输入模板表达式'
}

// 获取模板帮助信息
const getTemplateHelp = (type: string) => {
  const helps: Record<string, string> = {
    string: '支持策略变量、字段变量和内置函数组合',
    number: '支持数学表达式和函数计算',
    boolean: '支持逻辑表达式',
    date: '支持日期格式化函数',
    email: '支持变量组合生成邮箱',
    phone: '支持随机数生成手机号',
    url: '支持变量组合生成URL',
    uuid: '使用 {{uuid()}} 生成唯一标识符'
  }
  return helps[type] || '请参考可用变量进行模板配置'
}
</script>

<style scoped>
.fields-config-component {
  padding: 20px;
}

.config-header {
  margin-bottom: 24px;
}

.config-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.config-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.add-field-section {
  margin-bottom: 24px;
}

.fields-list {
  space-y: 20px;
}

.field-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: #fafafa;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.field-header h4 {
  margin: 0;
  color: #303133;
}

.field-basic-config {
  margin-bottom: 20px;
}

.field-source-config h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.template-help {
  margin-top: 4px;
}

.template-help small {
  color: #909399;
  font-size: 12px;
}

.template-variables-section {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.variables-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.variable-group {
  margin-bottom: 12px;
}

.variable-group:last-child {
  margin-bottom: 0;
}

.variable-group-title {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  font-weight: 500;
}

.variable-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.variable-tag {
  margin: 0;
  font-size: 12px;
}

.variable-tag.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.variable-tag.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}
</style>