<template>
  <div class="rule-editor">
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

      <!-- 模板编辑器 -->
      <el-card header="JSON模板" shadow="never">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>JSON模板</span>
            <el-space>
              <el-button size="small" @click="formatTemplate">
                <el-icon><Brush /></el-icon>
                格式化
              </el-button>
              <el-button size="small" @click="validateTemplate">
                <el-icon><CircleCheck /></el-icon>
                验证
              </el-button>
            </el-space>
          </div>
        </template>
        
        <div ref="editorContainer" style="height: 400px; border: 1px solid #d9d9d9"></div>
      </el-card>

      <!-- 字段配置 -->
      <el-card header="字段配置" shadow="hover">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>字段配置</span>
            <el-button size="small" type="primary" @click="addField">
              <el-icon><Plus /></el-icon>
              添加字段
            </el-button>
          </div>
        </template>
        
        <el-table
          :data="localRule.fields"
          size="small"
        >
          <el-table-column prop="name" label="字段名">
            <template #default="{ row }">
              <el-input
                v-model="row.name"
                @change="handleChange"
              />
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型">
            <template #default="{ row }">
              <el-select
                v-model="row.type"
                style="width: 100%"
                @change="handleChange"
              >
                <el-option value="string" label="字符串" />
                <el-option value="number" label="数字" />
                <el-option value="boolean" label="布尔值" />
                <el-option value="date" label="日期" />
                <el-option value="array" label="数组" />
                <el-option value="object" label="对象" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="config" label="配置">
            <template #default="{ row }">
              <el-input
                v-model="row.config"
                placeholder="配置参数(JSON格式)"
                @change="handleChange"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="{ row, $index }">
              <el-button
                type="danger"
                size="small"
                @click="removeField($index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
  ElTable,
  ElInput,
  ElMessage,
  ElIcon
} from 'element-plus'
import {
  Brush,
  CircleCheck,
  Plus,
  Delete
} from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor'
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
const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

// Element Plus表格不需要列配置

// 监听props变化
watch(() => props.rule, (newRule) => {
  localRule.value = { ...newRule }
  if (editor && newRule.template) {
    editor.setValue(newRule.template)
  }
}, { deep: true })

// 初始化Monaco编辑器
const initEditor = async () => {
  if (!editorContainer.value) return

  editor = monaco.editor.create(editorContainer.value, {
    value: localRule.value.template || '',
    language: 'json',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto'
    }
  })

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    if (editor) {
      localRule.value.template = editor.getValue()
      handleChange()
    }
  })
}

// 格式化模板
const formatTemplate = () => {
  if (!editor) return
  
  try {
    const value = editor.getValue()
    const formatted = JSON.stringify(JSON.parse(value), null, 2)
    editor.setValue(formatted)
    ElMessage.success('格式化成功')
  } catch (error) {
    ElMessage.error('JSON格式错误，无法格式化')
  }
}

// 验证模板
const validateTemplate = () => {
  if (!editor) return
  
  try {
    const value = editor.getValue()
    JSON.parse(value)
    ElMessage.success('JSON格式正确')
  } catch (error) {
    ElMessage.error('JSON格式错误')
  }
}

// 添加字段
const addField = () => {
  const newField: FieldConfig = {
    name: '',
    type: 'string',
    config: ''
  }
  localRule.value.fields = localRule.value.fields || []
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

// 处理变化
const handleChange = () => {
  emit('update:rule', localRule.value)
  emit('change', localRule.value)
}

// 生命周期
onMounted(async () => {
  await nextTick()
  initEditor()
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
  }
})
</script>

<style scoped>
.rule-editor {
  height: 100%;
}
</style>