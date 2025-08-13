<template>
  <div class="visual-rule-builder">
    <el-space direction="vertical" style="width: 100%" :size="16">
      <!-- 基本配置 -->
      <el-card header="基本配置" shadow="never">
        <el-row :gutter="16">
          <el-col :span="12">
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
          <el-col :span="12">
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
        </el-row>
      </el-card>

      <!-- 字段配置 -->
      <el-card header="字段配置" shadow="never">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>字段配置</span>
            <el-space>
              <el-button size="small" type="primary" @click="addField">
                <el-icon><Plus /></el-icon>
                添加字段
              </el-button>
              <el-button size="small" @click="generateTemplate">
                <el-icon><Document /></el-icon>
                生成模板
              </el-button>
            </el-space>
          </div>
        </template>
        
        <div class="fields-container">
          <div
            v-for="(field, index) in localRule.fields"
            :key="index"
            class="field-item"
          >
            <el-card shadow="never">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>字段 {{ index + 1 }}</span>
                  <el-button
                    type="danger"
                    text
                    size="small"
                    @click="removeField(index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </template>
              
              <el-row :gutter="16">
                <el-col :span="8">
                  <el-form-item label="字段名">
                    <el-input
                      v-model="field.name"
                      placeholder="请输入字段名"
                      @change="handleChange"
                    />
                  </el-form-item>
                </el-col>
                
                <el-col :span="8">
                  <el-form-item label="数据类型">
                    <el-select
                      v-model="field.type"
                      style="width: 100%"
                      @change="handleFieldTypeChange(index)"
                    >
                      <el-option value="string" label="字符串" />
                      <el-option value="number" label="数字" />
                      <el-option value="boolean" label="布尔值" />
                      <el-option value="date" label="日期" />
                      <el-option value="array" label="数组" />
                      <el-option value="object" label="对象" />
                      <el-option value="enum" label="枚举" />
                      <el-option value="uuid" label="UUID" />
                      <el-option value="email" label="邮箱" />
                      <el-option value="phone" label="手机号" />
                      <el-option value="url" label="URL" />
                    </el-select>
                  </el-form-item>
                </el-col>
                
                <el-col :span="8">
                   <el-form-item label="是否必填">
                     <el-switch
                       v-model="field.required"
                       @change="handleChange"
                     />
                   </el-form-item>
                 </el-col>
               </el-row>
               
               <!-- 字段特定配置 -->
               <FieldConfig
                 :field="field"
                 @change="handleChange"
               />
             </el-card>
           </div>
           
           <el-empty v-if="!localRule.fields || localRule.fields.length === 0" description="暂无字段，请添加字段" />
         </div>
       </el-card>

       <!-- 模板预览 -->
       <el-card header="模板预览" shadow="never">
         <template #header>
           <div style="display: flex; justify-content: space-between; align-items: center;">
             <span>模板预览</span>
             <el-button size="small" @click="copyTemplate">
               <el-icon><CopyDocument /></el-icon>
               复制模板
             </el-button>
           </div>
         </template>
         
         <div ref="templatePreviewContainer" style="height: 300px; border: 1px solid #d9d9d9"></div>
       </el-card>
     </el-space>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  ElSpace,
  ElCard,
  ElRow,
  ElCol,
  ElFormItem,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElButton,
  ElInput,
  ElSwitch,
  ElEmpty,
  ElMessage,
  ElIcon
} from 'element-plus'
import {
  Plus,
  Delete,
  Document,
  CopyDocument
} from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor'
import FieldConfig from './FieldConfig.vue'
import type { GenerationRule, FieldConfig as FieldConfigType } from '../types'

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
const templatePreviewContainer = ref<HTMLElement>()
let templateEditor: monaco.editor.IStandaloneCodeEditor | null = null

// 监听props变化
watch(() => props.rule, (newRule) => {
  localRule.value = { ...newRule }
  updateTemplatePreview()
}, { deep: true })

// 监听字段变化
watch(() => localRule.value.fields, () => {
  generateTemplate()
}, { deep: true })

// 初始化模板预览编辑器
const initTemplatePreview = async () => {
  if (!templatePreviewContainer.value) return

  templateEditor = monaco.editor.create(templatePreviewContainer.value, {
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

// 更新模板预览
const updateTemplatePreview = () => {
  if (templateEditor && localRule.value.template) {
    templateEditor.setValue(localRule.value.template)
  }
}

// 添加字段
const addField = () => {
  const newField: FieldConfigType = {
    name: '',
    type: 'string',
    required: true,
    config: {}
  }
  
  if (!localRule.value.fields) {
    localRule.value.fields = []
  }
  
  localRule.value.fields.push(newField)
  handleChange()
}

// 删除字段
const removeField = (index: number) => {
  if (localRule.value.fields) {
    localRule.value.fields.splice(index, 1)
    handleChange()
  }
}

// 字段类型变化处理
const handleFieldTypeChange = (index: number) => {
  if (localRule.value.fields && localRule.value.fields[index]) {
    // 重置字段配置
    localRule.value.fields[index].config = {}
    handleChange()
  }
}

// 生成模板
const generateTemplate = () => {
  if (!localRule.value.fields || localRule.value.fields.length === 0) {
    localRule.value.template = '{}'
    updateTemplatePreview()
    return
  }
  
  const template: any = {}
  
  localRule.value.fields.forEach(field => {
    if (!field.name) return
    
    let value: any
    
    switch (field.type) {
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
      case 'email':
        value = `{{faker.internet.email}}`
        break
      case 'phone':
        value = `{{faker.phone.number}}`
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
  updateTemplatePreview()
  handleChange()
}

// 复制模板
const copyTemplate = async () => {
  if (!localRule.value.template) return
  
  try {
    await navigator.clipboard.writeText(localRule.value.template)
    ElMessage.success('模板已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 处理变化
const handleChange = () => {
  emit('update:rule', localRule.value)
  emit('change', localRule.value)
}

// 生命周期
onMounted(async () => {
  await nextTick()
  await initTemplatePreview()
  if (!localRule.value.template && localRule.value.fields?.length) {
    generateTemplate()
  }
})

onUnmounted(() => {
  if (templateEditor) {
    templateEditor.dispose()
  }
})
</script>

<style scoped >
.visual-rule-builder {
  height: 100%;
}

.fields-container {
  max-height: 600px;
  overflow-y: auto;
}

.field-item {
  margin-bottom: 16px;
}

.field-item:last-child {
  margin-bottom: 0;
}
</style>