<template>
  <div class="business-rule-builder">
    <el-space direction="vertical" style="width: 100%" :size="16">
      <!-- 基本配置 -->
      <el-card header="基本配置" shadow="never">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="生成数量">
              <el-input-number
                v-model="localRule.count"
                :min="1"
                :max="10000"
                style="width: 100%"
                @change="handleChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="输出格式">
              <el-select
                v-model="localRule.outputFormat"
                style="width: 100%"
                @change="handleChange"
              >
                <el-option value="json" label="JSON" />
                <el-option value="jsonl" label="JSONL" />
                <el-option value="csv" label="CSV" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="业务场景">
              <el-select
                v-model="businessScenario"
                style="width: 100%"
                placeholder="选择业务场景"
                @change="handleScenarioChange"
              >
                <el-option value="user" label="用户数据" />
                <el-option value="product" label="商品数据" />
                <el-option value="order" label="订单数据" />
                <el-option value="log" label="日志数据" />
                <el-option value="financial" label="财务数据" />
                <el-option value="custom" label="自定义" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 业务规则配置 -->
      <a-card title="业务规则配置" size="small">
        <a-tabs v-model:activeKey="activeRuleTab">
          <a-tab-pane key="strategy" tab="生成策略">
            <div class="strategy-config">
              <a-form layout="vertical">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="数据分布策略">
                      <a-select
                        v-model:value="strategy.type"
                        @change="handleStrategyChange"
                      >
                        <a-select-option value="random">随机分布</a-select-option>
                        <a-select-option value="normal">正态分布</a-select-option>
                        <a-select-option value="weighted">权重分布</a-select-option>
                        <a-select-option value="sequential">顺序生成</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="数据质量">
                      <a-select v-model:value="strategy.quality">
                        <a-select-option value="high">高质量（完整数据）</a-select-option>
                        <a-select-option value="medium">中等质量（偶有缺失）</a-select-option>
                        <a-select-option value="low">低质量（较多缺失）</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                </a-row>

                <!-- 策略特定配置 -->
                <div v-if="strategy.type">
                  <a-card title="策略参数" size="small" style="margin-top: 16px">
                    <a-form layout="vertical">
                      <!-- 正态分布配置 -->
                      <div v-if="strategy.type === 'normal'">
                        <a-row :gutter="16">
                          <a-col :span="12">
                            <a-form-item label="均值">
                              <a-input-number
                                v-model:value="strategy.params.mean"
                                style="width: 100%"
                              />
                            </a-form-item>
                          </a-col>
                          <a-col :span="12">
                            <a-form-item label="标准差">
                              <a-input-number
                                v-model:value="strategy.params.stdDev"
                                :min="0"
                                style="width: 100%"
                              />
                            </a-form-item>
                          </a-col>
                        </a-row>
                      </div>

                      <!-- 权重分布配置 -->
                      <div v-else-if="strategy.type === 'weighted'">
                        <a-form-item label="权重配置">
                          <div class="weight-config">
                            <div
                              v-for="(weight, index) in strategy.params.weights"
                              :key="index"
                              class="weight-item"
                            >
                              <a-input
                                v-model:value="weight.value"
                                placeholder="值"
                                style="width: 40%"
                              />
                              <a-input-number
                                v-model:value="weight.weight"
                                :min="0"
                                :max="100"
                                placeholder="权重"
                                style="width: 40%"
                              />
                              <a-button
                                type="text"
                                danger
                                @click="removeWeight(index)"
                              >
                                <template #icon><DeleteOutlined /></template>
                              </a-button>
                            </div>
                            <a-button
                              type="dashed"
                              style="width: 100%"
                              @click="addWeight"
                            >
                              <template #icon><PlusOutlined /></template>
                              添加权重项
                            </a-button>
                          </div>
                        </a-form-item>
                      </div>

                      <!-- 顺序生成配置 -->
                      <div v-else-if="strategy.type === 'sequential'">
                        <a-row :gutter="16">
                          <a-col :span="8">
                            <a-form-item label="起始值">
                              <a-input-number
                                v-model:value="strategy.params.start"
                                style="width: 100%"
                              />
                            </a-form-item>
                          </a-col>
                          <a-col :span="8">
                            <a-form-item label="步长">
                              <a-input-number
                                v-model:value="strategy.params.step"
                                style="width: 100%"
                              />
                            </a-form-item>
                          </a-col>
                          <a-col :span="8">
                            <a-form-item label="循环">
                              <a-switch v-model:checked="strategy.params.cycle" />
                            </a-form-item>
                          </a-col>
                        </a-row>
                      </div>
                    </a-form>
                  </a-card>
                </div>
              </a-form>
            </div>
          </a-tab-pane>

          <a-tab-pane key="constraints" tab="约束条件">
            <div class="constraints-config">
              <a-form layout="vertical">
                <a-form-item label="数据约束">
                  <a-checkbox-group v-model:value="constraints.types">
                    <a-row>
                      <a-col :span="8">
                        <a-checkbox value="unique">唯一性约束</a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="range">范围约束</a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="format">格式约束</a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="dependency">依赖约束</a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="business">业务约束</a-checkbox>
                      </a-col>
                    </a-row>
                  </a-checkbox-group>
                </a-form-item>

                <!-- 约束配置详情 -->
                <div v-if="constraints.types.length > 0">
                  <a-card title="约束详情" size="small" style="margin-top: 16px">
                    <!-- 唯一性约束 -->
                    <div v-if="constraints.types.includes('unique')">
                      <a-form-item label="唯一字段">
                        <a-select
                          v-model:value="constraints.unique.fields"
                          mode="multiple"
                          placeholder="选择需要保证唯一性的字段"
                          style="width: 100%"
                        >
                          <a-select-option
                            v-for="field in availableFields"
                            :key="field"
                            :value="field"
                          >
                            {{ field }}
                          </a-select-option>
                        </a-select>
                      </a-form-item>
                    </div>

                    <!-- 范围约束 -->
                    <div v-if="constraints.types.includes('range')">
                      <a-form-item label="范围约束规则">
                        <div class="range-constraints">
                          <div
                            v-for="(rule, index) in constraints.range.rules"
                            :key="index"
                            class="range-rule"
                          >
                            <a-select
                              v-model:value="rule.field"
                              placeholder="字段"
                              style="width: 30%"
                            >
                              <a-select-option
                                v-for="field in availableFields"
                                :key="field"
                                :value="field"
                              >
                                {{ field }}
                              </a-select-option>
                            </a-select>
                            <a-input-number
                              v-model:value="rule.min"
                              placeholder="最小值"
                              style="width: 25%"
                            />
                            <a-input-number
                              v-model:value="rule.max"
                              placeholder="最大值"
                              style="width: 25%"
                            />
                            <a-button
                              type="text"
                              danger
                              @click="removeRangeRule(index)"
                            >
                              <template #icon><DeleteOutlined /></template>
                            </a-button>
                          </div>
                          <a-button
                            type="dashed"
                            style="width: 100%"
                            @click="addRangeRule"
                          >
                            <template #icon><PlusOutlined /></template>
                            添加范围规则
                          </a-button>
                        </div>
                      </a-form-item>
                    </div>

                    <!-- 业务约束 -->
                    <div v-if="constraints.types.includes('business')">
                      <a-form-item label="业务规则">
                        <a-textarea
                          v-model:value="constraints.business.rules"
                          :rows="4"
                          placeholder="请输入业务规则描述，例如：订单金额必须大于0，用户年龄在18-65之间等"
                        />
                      </a-form-item>
                    </div>
                  </a-card>
                </div>
              </a-form>
            </div>
          </a-tab-pane>

          <a-tab-pane key="relationships" tab="关联关系">
            <div class="relationships-config">
              <a-form layout="vertical">
                <a-form-item label="字段关联">
                  <div class="relationships">
                    <div
                      v-for="(rel, index) in relationships"
                      :key="index"
                      class="relationship-item"
                    >
                      <a-card size="small" :title="`关联 ${index + 1}`">
                        <template #extra>
                          <a-button
                            type="text"
                            danger
                            size="small"
                            @click="removeRelationship(index)"
                          >
                            <template #icon><DeleteOutlined /></template>
                          </a-button>
                        </template>
                        
                        <a-row :gutter="16">
                          <a-col :span="8">
                            <a-form-item label="源字段">
                              <a-select
                                v-model:value="rel.sourceField"
                                placeholder="选择源字段"
                              >
                                <a-select-option
                                  v-for="field in availableFields"
                                  :key="field"
                                  :value="field"
                                >
                                  {{ field }}
                                </a-select-option>
                              </a-select>
                            </a-form-item>
                          </a-col>
                          <a-col :span="8">
                            <a-form-item label="关联类型">
                              <a-select v-model:value="rel.type">
                                <a-select-option value="dependent">依赖关系</a-select-option>
                                <a-select-option value="calculated">计算关系</a-select-option>
                                <a-select-option value="conditional">条件关系</a-select-option>
                              </a-select>
                            </a-form-item>
                          </a-col>
                          <a-col :span="8">
                            <a-form-item label="目标字段">
                              <a-select
                                v-model:value="rel.targetField"
                                placeholder="选择目标字段"
                              >
                                <a-select-option
                                  v-for="field in availableFields"
                                  :key="field"
                                  :value="field"
                                >
                                  {{ field }}
                                </a-select-option>
                              </a-select>
                            </a-form-item>
                          </a-col>
                        </a-row>
                        
                        <a-form-item label="关联规则">
                          <a-textarea
                            v-model:value="rel.rule"
                            :rows="2"
                            placeholder="请描述关联规则，例如：当年龄>18时，状态为成年人"
                          />
                        </a-form-item>
                      </a-card>
                    </div>
                    
                    <a-button
                      type="dashed"
                      style="width: 100%"
                      @click="addRelationship"
                    >
                      <template #icon><PlusOutlined /></template>
                      添加关联关系
                    </a-button>
                  </div>
                </a-form-item>
              </a-form>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-card>

      <!-- 字段配置 -->
      <a-card title="字段配置" size="small">
        <template #extra>
          <a-space>
            <a-button size="small" type="primary" @click="addBusinessField">
              <template #icon><PlusOutlined /></template>
              添加字段
            </a-button>
            <a-button size="small" @click="generateBusinessTemplate">
              <template #icon><CodeOutlined /></template>
              生成模板
            </a-button>
          </a-space>
        </template>
        
        <div class="business-fields">
          <div
            v-for="(field, index) in localRule.fields"
            :key="index"
            class="business-field-item"
          >
            <a-card size="small" :title="`${field.name || '未命名字段'} (${getFieldTypeLabel(field.type)})`">
              <template #extra>
                <a-button
                  type="text"
                  danger
                  size="small"
                  @click="removeBusinessField(index)"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </template>
              
              <a-row :gutter="16">
                <a-col :span="6">
                  <a-form-item label="字段名">
                    <a-input
                      v-model:value="field.name"
                      placeholder="请输入字段名"
                      @change="handleChange"
                    />
                  </a-form-item>
                </a-col>
                
                <a-col :span="6">
                  <a-form-item label="显示名称">
                    <a-input
                      v-model:value="field.displayName"
                      placeholder="字段显示名称"
                      @change="handleChange"
                    />
                  </a-form-item>
                </a-col>
                
                <a-col :span="6">
                  <a-form-item label="数据类型">
                    <a-select
                      v-model:value="field.type"
                      @change="handleFieldTypeChange(index)"
                    >
                      <a-select-option value="string">字符串</a-select-option>
                      <a-select-option value="number">数字</a-select-option>
                      <a-select-option value="boolean">布尔值</a-select-option>
                      <a-select-option value="date">日期</a-select-option>
                      <a-select-option value="array">数组</a-select-option>
                      <a-select-option value="object">对象</a-select-option>
                      <a-select-option value="enum">枚举</a-select-option>
                      <a-select-option value="uuid">UUID</a-select-option>
                      <a-select-option value="email">邮箱</a-select-option>
                      <a-select-option value="phone">手机号</a-select-option>
                      <a-select-option value="url">URL</a-select-option>
                      <a-select-option value="id">ID</a-select-option>
                      <a-select-option value="name">姓名</a-select-option>
                      <a-select-option value="address">地址</a-select-option>
                      <a-select-option value="company">公司</a-select-option>
                      <a-select-option value="price">价格</a-select-option>
                      <a-select-option value="status">状态</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                
                <a-col :span="6">
                  <a-form-item label="业务含义">
                    <a-input
                      v-model:value="field.businessMeaning"
                      placeholder="字段业务含义"
                      @change="handleChange"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="是否必填">
                    <a-switch
                      v-model:checked="field.required"
                      @change="handleChange"
                    />
                  </a-form-item>
                </a-col>
                
                <a-col :span="8">
                  <a-form-item label="是否唯一">
                    <a-switch
                      v-model:checked="field.unique"
                      @change="handleChange"
                    />
                  </a-form-item>
                </a-col>
                
                <a-col :span="8">
                  <a-form-item label="是否索引">
                    <a-switch
                      v-model:checked="field.indexed"
                      @change="handleChange"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              
              <!-- 字段特定配置 -->
              <BusinessFieldConfig
                :field="field"
                @change="handleChange"
              />
            </a-card>
          </div>
          
          <a-empty v-if="!localRule.fields || localRule.fields.length === 0" description="暂无字段，请添加字段" />
        </div>
      </a-card>

      <!-- 模板预览 -->
      <a-card title="业务模板预览" size="small">
        <template #extra>
          <a-space>
            <a-button size="small" @click="copyBusinessTemplate">
              <template #icon><CopyOutlined /></template>
              复制模板
            </a-button>
            <a-button size="small" @click="validateBusinessTemplate">
              <template #icon><CheckCircleOutlined /></template>
              验证模板
            </a-button>
          </a-space>
        </template>
        
        <div ref="businessTemplateContainer" style="height: 400px; border: 1px solid #d9d9d9"></div>
      </a-card>
    </el-space>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import {
  ElSpace,
  ElCard,
  ElRow,
  ElCol,
  ElFormItem,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElTabs,
  ElTabPane,
  ElForm,
  ElCheckboxGroup,
  ElCheckbox,
  ElInput,
  ElButton,
  ElSwitch,
  ElEmpty,
  ElMessage,
  ElIcon
} from 'element-plus'
import {
  Plus,
  Delete,
  Document,
  CopyDocument,
  CircleCheck
} from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor'
import BusinessFieldConfig from './BusinessFieldConfig.vue'
import type { GenerationRule, FieldConfig } from '../types'

// Props
interface Props {
  rule: GenerationRule
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:rule': [rule: GenerationRule]
  change: [rule: GenerationRule]
}>()

// State
const localRule = ref<GenerationRule>({ ...props.rule })
const businessScenario = ref('')
const activeRuleTab = ref('strategy')
const businessTemplateContainer = ref<HTMLElement>()
let businessTemplateEditor: monaco.editor.IStandaloneCodeEditor | null = null

// 策略配置
const strategy = ref({
  type: '',
  quality: 'high',
  params: {
    mean: 50,
    stdDev: 10,
    weights: [{ value: '', weight: 50 }],
    start: 1,
    step: 1,
    cycle: false
  }
})

// 约束配置
const constraints = ref({
  types: [] as string[],
  unique: {
    fields: [] as string[]
  },
  range: {
    rules: [] as Array<{ field: string; min: number; max: number }>
  },
  business: {
    rules: ''
  }
})

// 关联关系
const relationships = ref([] as Array<{
  sourceField: string
  type: string
  targetField: string
  rule: string
}>)

// 计算属性
const availableFields = computed(() => {
  return localRule.value.fields?.map(f => f.name).filter(Boolean) || []
})

// 监听props变化
watch(() => props.rule, (newRule) => {
  localRule.value = { ...newRule }
  updateBusinessTemplatePreview()
}, { deep: true })

// 业务场景模板
const businessScenarios = {
  user: {
    fields: [
      { name: 'id', type: 'id', displayName: '用户ID', required: true, unique: true },
      { name: 'username', type: 'name', displayName: '用户名', required: true },
      { name: 'email', type: 'email', displayName: '邮箱', required: true },
      { name: 'phone', type: 'phone', displayName: '手机号', required: false },
      { name: 'age', type: 'number', displayName: '年龄', required: false },
      { name: 'status', type: 'status', displayName: '状态', required: true }
    ]
  },
  product: {
    fields: [
      { name: 'id', type: 'id', displayName: '商品ID', required: true, unique: true },
      { name: 'name', type: 'string', displayName: '商品名称', required: true },
      { name: 'price', type: 'price', displayName: '价格', required: true },
      { name: 'category', type: 'enum', displayName: '分类', required: true },
      { name: 'description', type: 'string', displayName: '描述', required: false },
      { name: 'status', type: 'status', displayName: '状态', required: true }
    ]
  },
  order: {
    fields: [
      { name: 'id', type: 'id', displayName: '订单ID', required: true, unique: true },
      { name: 'userId', type: 'id', displayName: '用户ID', required: true },
      { name: 'productId', type: 'id', displayName: '商品ID', required: true },
      { name: 'amount', type: 'price', displayName: '金额', required: true },
      { name: 'quantity', type: 'number', displayName: '数量', required: true },
      { name: 'orderDate', type: 'date', displayName: '订单日期', required: true },
      { name: 'status', type: 'status', displayName: '订单状态', required: true }
    ]
  }
}

// 初始化业务模板编辑器
const initBusinessTemplateEditor = async () => {
  if (!businessTemplateContainer.value) return

  businessTemplateEditor = monaco.editor.create(businessTemplateContainer.value, {
    value: localRule.value.template || '',
    language: 'json',
    theme: 'vs',
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14
  })
}

// 更新业务模板预览
const updateBusinessTemplatePreview = () => {
  if (businessTemplateEditor && localRule.value.template) {
    businessTemplateEditor.setValue(localRule.value.template)
  }
}

// 处理场景变化
const handleScenarioChange = (scenario: string) => {
  if (scenario && scenario !== 'custom' && businessScenarios[scenario as keyof typeof businessScenarios]) {
    const scenarioConfig = businessScenarios[scenario as keyof typeof businessScenarios]
    localRule.value.fields = scenarioConfig.fields.map(field => ({
      ...field,
      config: {}
    }))
    generateBusinessTemplate()
    handleChange()
  }
}

// 处理策略变化
const handleStrategyChange = () => {
  // 策略变化时的处理逻辑
  handleChange()
}

// 字段类型标签
const getFieldTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    string: '字符串',
    number: '数字',
    boolean: '布尔值',
    date: '日期',
    array: '数组',
    object: '对象',
    enum: '枚举',
    uuid: 'UUID',
    email: '邮箱',
    phone: '手机号',
    url: 'URL',
    id: 'ID',
    name: '姓名',
    address: '地址',
    company: '公司',
    price: '价格',
    status: '状态'
  }
  return labels[type] || type
}

// 添加业务字段
const addBusinessField = () => {
  const newField: FieldConfig = {
    name: '',
    type: 'string',
    displayName: '',
    businessMeaning: '',
    required: true,
    unique: false,
    indexed: false,
    config: {}
  }
  
  if (!localRule.value.fields) {
    localRule.value.fields = []
  }
  
  localRule.value.fields.push(newField)
  handleChange()
}

// 删除业务字段
const removeBusinessField = (index: number) => {
  if (localRule.value.fields) {
    localRule.value.fields.splice(index, 1)
    handleChange()
  }
}

// 字段类型变化处理
const handleFieldTypeChange = (index: number) => {
  if (localRule.value.fields && localRule.value.fields[index]) {
    localRule.value.fields[index].config = {}
    handleChange()
  }
}

// 生成业务模板
const generateBusinessTemplate = () => {
  if (!localRule.value.fields || localRule.value.fields.length === 0) {
    localRule.value.template = '{}'
    updateBusinessTemplatePreview()
    return
  }
  
  const template: any = {}
  
  localRule.value.fields.forEach(field => {
    if (!field.name) return
    
    let value: any
    
    switch (field.type) {
      case 'id':
        value = `{{faker.string.uuid}}`
        break
      case 'name':
        value = `{{faker.person.fullName}}`
        break
      case 'email':
        value = `{{faker.internet.email}}`
        break
      case 'phone':
        value = `{{faker.phone.number}}`
        break
      case 'address':
        value = `{{faker.location.streetAddress}}`
        break
      case 'company':
        value = `{{faker.company.name}}`
        break
      case 'price':
        value = `{{faker.commerce.price}}`
        break
      case 'status':
        value = `{{random.arrayElement(["active", "inactive", "pending"])}}`
        break
      case 'string':
        value = `{{faker.lorem.word}}`
        break
      case 'number':
        value = `{{faker.number.int}}`
        break
      case 'boolean':
        value = `{{faker.datatype.boolean}}`
        break
      case 'date':
        value = `{{faker.date.recent}}`
        break
      case 'array':
        value = [`{{faker.lorem.word}}`, `{{faker.lorem.word}}`]
        break
      case 'object':
        value = {
          key: `{{faker.lorem.word}}`,
          value: `{{faker.lorem.word}}`
        }
        break
      case 'enum':
        const options = field.config?.options || ['option1', 'option2']
        value = `{{random.arrayElement([${options.map((opt: string) => `"${opt}"`).join(', ')}])}}`
        break
      case 'uuid':
        value = `{{faker.string.uuid}}`
        break
      case 'url':
        value = `{{faker.internet.url}}`
        break
      default:
        value = `{{faker.lorem.word}}`
    }
    
    template[field.name] = value
  })
  
  localRule.value.template = JSON.stringify(template, null, 2)
  updateBusinessTemplatePreview()
  handleChange()
}

// 复制业务模板
const copyBusinessTemplate = async () => {
  if (!localRule.value.template) return
  
  try {
    await navigator.clipboard.writeText(localRule.value.template)
    message.success('模板已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}

// 验证业务模板
const validateBusinessTemplate = () => {
  if (!localRule.value.template) {
    message.error('模板为空')
    return
  }
  
  try {
    JSON.parse(localRule.value.template)
    message.success('模板格式正确')
  } catch (error) {
    message.error('模板格式错误')
  }
}

// 权重相关方法
const addWeight = () => {
  strategy.value.params.weights.push({ value: '', weight: 50 })
}

const removeWeight = (index: number) => {
  strategy.value.params.weights.splice(index, 1)
}

// 范围规则相关方法
const addRangeRule = () => {
  constraints.value.range.rules.push({ field: '', min: 0, max: 100 })
}

const removeRangeRule = (index: number) => {
  constraints.value.range.rules.splice(index, 1)
}

// 关联关系相关方法
const addRelationship = () => {
  relationships.value.push({
    sourceField: '',
    type: 'dependent',
    targetField: '',
    rule: ''
  })
}

const removeRelationship = (index: number) => {
  relationships.value.splice(index, 1)
}

// 处理变化
const handleChange = () => {
  emit('update:rule', localRule.value)
  emit('change', localRule.value)
}

// 生命周期
onMounted(async () => {
  await nextTick()
  await initBusinessTemplateEditor()
  if (!localRule.value.template && localRule.value.fields?.length) {
    generateBusinessTemplate()
  }
})

onUnmounted(() => {
  if (businessTemplateEditor) {
    businessTemplateEditor.dispose()
  }
})
</script>

<style scoped>
.business-rule-builder {
  height: 100%;
}

.strategy-config,
.constraints-config,
.relationships-config {
  padding: 16px;
}

.business-fields {
  max-height: 800px;
  overflow-y: auto;
}

.business-field-item {
  margin-bottom: 16px;
}

.business-field-item:last-child {
  margin-bottom: 0;
}

.weight-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weight-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.range-constraints {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.range-rule {
  display: flex;
  gap: 8px;
  align-items: center;
}

.relationships {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.relationship-item {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}
</style>