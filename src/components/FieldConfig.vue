<template>
  <div class="field-config">
    <!-- 字符串类型配置 -->
    <div v-if="field.type === 'string'">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="最小长度">
            <el-input-number
              v-model="config.minLength"
              :min="0"
              style="width: 100%"
              @change="handleConfigChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最大长度">
            <el-input-number
              v-model="config.maxLength"
              :min="config.minLength || 0"
              style="width: 100%"
              @change="handleConfigChange"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="字符串模式">
        <el-select
          v-model="config.pattern"
          style="width: 100%"
          @change="handleConfigChange"
        >
          <el-option value="word" label="单词" />
          <el-option value="sentence" label="句子" />
          <el-option value="paragraph" label="段落" />
          <el-option value="name" label="姓名" />
          <el-option value="company" label="公司名" />
        </el-select>
      </el-form-item>
    </div>

    <!-- 数字类型配置 -->
    <div v-else-if="field.type === 'number'">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="最小值">
            <el-input-number
              v-model="config.min"
              style="width: 100%"
              @change="handleConfigChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="最大值">
            <el-input-number
              v-model="config.max"
              :min="config.min"
              style="width: 100%"
              @change="handleConfigChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="小数位数">
            <el-input-number
              v-model="config.precision"
              :min="0"
              :max="10"
              style="width: 100%"
              @change="handleConfigChange"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 日期类型配置 -->
    <div v-else-if="field.type === 'date'">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="日期格式">
            <el-select
              v-model="config.format"
              style="width: 100%"
              @change="handleConfigChange"
            >
              <el-option value="YYYY-MM-DD" label="YYYY-MM-DD" />
              <el-option value="YYYY-MM-DD HH:mm:ss" label="YYYY-MM-DD HH:mm:ss" />
              <el-option value="MM/DD/YYYY" label="MM/DD/YYYY" />
              <el-option value="DD/MM/YYYY" label="DD/MM/YYYY" />
              <el-option value="timestamp" label="时间戳" />
            </el-select>
           </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="日期范围">
            <el-select
              v-model="config.range"
              style="width: 100%"
              @change="handleConfigChange"
            >
              <el-option value="recent" label="最近" />
              <el-option value="past" label="过去" />
              <el-option value="future" label="未来" />
              <el-option value="between" label="指定范围" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <div v-if="config.range === 'between'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始日期">
              <el-date-picker
                v-model="config.startDate"
                style="width: 100%"
                @change="handleConfigChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期">
              <el-date-picker
                v-model="config.endDate"
                style="width: 100%"
                @change="handleConfigChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 数组类型配置 -->
    <div v-else-if="field.type === 'array'">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="最小长度">
            <el-input-number
              v-model="config.minItems"
              :min="0"
              style="width: 100%"
              @change="handleConfigChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="最大长度">
            <el-input-number
              v-model="config.maxItems"
              :min="config.minItems || 0"
              style="width: 100%"
              @change="handleConfigChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="元素类型">
            <el-select
              v-model="config.itemType"
              style="width: 100%"
              @change="handleConfigChange"
            >
              <el-option value="string" label="字符串" />
              <el-option value="number" label="数字" />
              <el-option value="boolean" label="布尔值" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 枚举类型配置 -->
    <div v-else-if="field.type === 'enum'">
      <el-form-item label="枚举选项">
        <div class="enum-options">
          <div
            v-for="(option, index) in config.options"
            :key="index"
            class="enum-option"
          >
            <el-input
              v-model="config.options[index]"
              placeholder="请输入选项值"
              @change="handleConfigChange"
            />
            <el-button
              type="danger"
              text
              @click="removeOption(index)"
            >
              <template #icon><Delete /></template>
            </el-button>
          </div>
          
          <el-button
            type="primary"
            plain
            style="width: 100%"
            @click="addOption"
          >
            <template #icon><Plus /></template>
            添加选项
          </el-button>
        </div>
      </el-form-item>
    </div>

    <!-- 对象类型配置 -->
    <div v-else-if="field.type === 'object'">
      <el-form-item label="对象结构">
        <el-input
          v-model="config.structure"
          type="textarea"
          :rows="4"
          placeholder="请输入JSON格式的对象结构"
          @change="handleConfigChange"
        />
      </el-form-item>
    </div>

    <!-- 邮箱类型配置 -->
    <div v-else-if="field.type === 'email'">
      <el-form-item label="邮箱域名">
        <el-input
          v-model="config.domain"
          placeholder="例如: example.com（留空使用随机域名）"
          @change="handleConfigChange"
        />
      </el-form-item>
    </div>

    <!-- 手机号类型配置 -->
    <div v-else-if="field.type === 'phone'">
      <el-form-item label="手机号格式">
        <el-select
          v-model="config.format"
          style="width: 100%"
          @change="handleConfigChange"
        >
          <el-option value="cn" label="中国大陆 (+86)" />
          <el-option value="us" label="美国 (+1)" />
          <el-option value="uk" label="英国 (+44)" />
          <el-option value="custom" label="自定义格式" />
        </el-select>
      </el-form-item>
      
      <el-form-item v-if="config.format === 'custom'" label="自定义格式">
        <el-input
          v-model="config.pattern"
          placeholder="例如: ###-####-####"
          @change="handleConfigChange"
        />
      </el-form-item>
    </div>

    <!-- URL类型配置 -->
    <div v-else-if="field.type === 'url'">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="协议">
            <el-select
              v-model="config.protocol"
              style="width: 100%"
              @change="handleConfigChange"
            >
              <el-option value="http" label="HTTP" />
              <el-option value="https" label="HTTPS" />
              <el-option value="ftp" label="FTP" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="域名">
            <el-input
              v-model="config.domain"
              placeholder="留空使用随机域名"
              @change="handleConfigChange"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  ElRow,
  ElCol,
  ElFormItem,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElInput,
  ElButton
} from 'element-plus'
import {
  Delete,
  Plus
} from '@element-plus/icons-vue'
import type { FieldConfig as FieldConfigType } from '../types'

// Props
interface Props {
  field: FieldConfigType
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  change: []
}>()

// 配置对象
const config = computed({
  get: () => props.field.config || {},
  set: (value) => {
    props.field.config = value
    emit('change')
  }
})

// 初始化配置
watch(() => props.field.type, (newType) => {
  if (!props.field.config) {
    props.field.config = {}
  }
  
  // 根据类型设置默认配置
  switch (newType) {
    case 'string':
      if (!config.value.minLength) config.value.minLength = 1
      if (!config.value.maxLength) config.value.maxLength = 50
      if (!config.value.pattern) config.value.pattern = 'word'
      break
      
    case 'number':
      if (config.value.min === undefined) config.value.min = 0
      if (config.value.max === undefined) config.value.max = 100
      if (config.value.precision === undefined) config.value.precision = 0
      break
      
    case 'date':
      if (!config.value.format) config.value.format = 'YYYY-MM-DD'
      if (!config.value.range) config.value.range = 'recent'
      break
      
    case 'array':
      if (config.value.minItems === undefined) config.value.minItems = 1
      if (config.value.maxItems === undefined) config.value.maxItems = 5
      if (!config.value.itemType) config.value.itemType = 'string'
      break
      
    case 'enum':
      if (!config.value.options) config.value.options = ['选项1', '选项2']
      break
      
    case 'object':
      if (!config.value.structure) {
        config.value.structure = JSON.stringify({ key: 'value' }, null, 2)
      }
      break
      
    case 'email':
      if (!config.value.domain) config.value.domain = ''
      break
      
    case 'phone':
      if (!config.value.format) config.value.format = 'cn'
      break
      
    case 'url':
      if (!config.value.protocol) config.value.protocol = 'https'
      if (!config.value.domain) config.value.domain = ''
      break
  }
  
  emit('change')
}, { immediate: true })

// 处理配置变化
const handleConfigChange = () => {
  emit('change')
}

// 添加枚举选项
const addOption = () => {
  if (!config.value.options) {
    config.value.options = []
  }
  config.value.options.push('')
  emit('change')
}

// 删除枚举选项
const removeOption = (index: number) => {
  if (config.value.options) {
    config.value.options.splice(index, 1)
    emit('change')
  }
}
</script>

<style scoped>
.field-config {
  margin-top: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.enum-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.enum-option {
  display: flex;
  gap: 8px;
  align-items: center;
}

.enum-option .el-input {
  flex: 1;
}
</style>