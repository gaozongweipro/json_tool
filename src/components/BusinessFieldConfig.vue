<template>
  <div class="business-field-config">
    <!-- 字符串类型配置 -->
    <div v-if="field.type === 'string'">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="最小长度">
            <a-input-number
              v-model:value="localConfig.minLength"
              :min="0"
              placeholder="最小长度"
              style="width: 100%"
              @change="handleChange"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="最大长度">
            <a-input-number
              v-model:value="localConfig.maxLength"
              :min="0"
              placeholder="最大长度"
              style="width: 100%"
              @change="handleChange"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="格式">
            <a-select
              v-model:value="localConfig.format"
              placeholder="选择格式"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="text">普通文本</a-select-option>
              <a-select-option value="name">姓名</a-select-option>
              <a-select-option value="title">标题</a-select-option>
              <a-select-option value="description">描述</a-select-option>
              <a-select-option value="code">代码</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-form-item label="正则表达式">
        <a-input
          v-model:value="localConfig.pattern"
          placeholder="输入正则表达式"
          @change="handleChange"
        />
      </a-form-item>
    </div>

    <!-- 数字类型配置 -->
    <div v-else-if="field.type === 'number' || field.type === 'price'">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="最小值">
            <a-input-number
              v-model:value="localConfig.min"
              placeholder="最小值"
              style="width: 100%"
              @change="handleChange"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="最大值">
            <a-input-number
              v-model:value="localConfig.max"
              placeholder="最大值"
              style="width: 100%"
              @change="handleChange"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="小数位数">
            <a-input-number
              v-model:value="localConfig.decimals"
              :min="0"
              :max="10"
              placeholder="小数位数"
              style="width: 100%"
              @change="handleChange"
            />
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="数字类型">
            <a-select
              v-model:value="localConfig.numberType"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="integer">整数</a-select-option>
              <a-select-option value="float">浮点数</a-select-option>
              <a-select-option value="percentage">百分比</a-select-option>
              <a-select-option value="currency">货币</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="分布类型">
            <a-select
              v-model:value="localConfig.distribution"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="uniform">均匀分布</a-select-option>
              <a-select-option value="normal">正态分布</a-select-option>
              <a-select-option value="exponential">指数分布</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </div>

    <!-- 日期类型配置 -->
    <div v-else-if="field.type === 'date'">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="开始日期">
            <a-date-picker
              v-model:value="localConfig.startDate"
              style="width: 100%"
              @change="handleChange"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="结束日期">
            <a-date-picker
              v-model:value="localConfig.endDate"
              style="width: 100%"
              @change="handleChange"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="日期格式">
            <a-select
              v-model:value="localConfig.format"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="YYYY-MM-DD">YYYY-MM-DD</a-select-option>
              <a-select-option value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss</a-select-option>
              <a-select-option value="MM/DD/YYYY">MM/DD/YYYY</a-select-option>
              <a-select-option value="DD/MM/YYYY">DD/MM/YYYY</a-select-option>
              <a-select-option value="timestamp">时间戳</a-select-option>
              <a-select-option value="iso">ISO格式</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-form-item label="相对时间">
        <a-select
          v-model:value="localConfig.relative"
          style="width: 100%"
          @change="handleChange"
        >
          <a-select-option value="past">过去时间</a-select-option>
          <a-select-option value="future">未来时间</a-select-option>
          <a-select-option value="recent">最近时间</a-select-option>
          <a-select-option value="soon">即将到来</a-select-option>
        </a-select>
      </a-form-item>
    </div>

    <!-- 数组类型配置 -->
    <div v-else-if="field.type === 'array'">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="最小长度">
            <a-input-number
              v-model:value="localConfig.minItems"
              :min="0"
              placeholder="最小长度"
              style="width: 100%"
              @change="handleChange"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="最大长度">
            <a-input-number
              v-model:value="localConfig.maxItems"
              :min="0"
              placeholder="最大长度"
              style="width: 100%"
              @change="handleChange"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="元素类型">
            <a-select
              v-model:value="localConfig.itemType"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="string">字符串</a-select-option>
              <a-select-option value="number">数字</a-select-option>
              <a-select-option value="boolean">布尔值</a-select-option>
              <a-select-option value="object">对象</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-form-item label="是否唯一元素">
        <a-switch
          v-model:checked="localConfig.uniqueItems"
          @change="handleChange"
        />
      </a-form-item>
    </div>

    <!-- 枚举类型配置 -->
    <div v-else-if="field.type === 'enum' || field.type === 'status'">
      <a-form-item label="枚举选项">
        <div class="enum-options">
          <div
            v-for="(option, index) in localConfig.options"
            :key="index"
            class="enum-option"
          >
            <a-input
              v-model:value="option.value"
              placeholder="选项值"
              style="width: 40%"
              @change="handleChange"
            />
            <a-input
              v-model:value="option.label"
              placeholder="显示名称"
              style="width: 40%"
              @change="handleChange"
            />
            <a-input-number
              v-model:value="option.weight"
              :min="0"
              :max="100"
              placeholder="权重"
              style="width: 15%"
              @change="handleChange"
            />
            <a-button
              type="text"
              danger
              @click="removeEnumOption(index)"
            >
              <template #icon><DeleteOutlined /></template>
            </a-button>
          </div>
          
          <a-button
            type="dashed"
            style="width: 100%"
            @click="addEnumOption"
          >
            <template #icon><PlusOutlined /></template>
            添加选项
          </a-button>
        </div>
      </a-form-item>
      
      <a-form-item label="选择模式">
        <a-radio-group
          v-model:value="localConfig.selectionMode"
          @change="handleChange"
        >
          <a-radio value="random">随机选择</a-radio>
          <a-radio value="weighted">权重选择</a-radio>
          <a-radio value="sequential">顺序选择</a-radio>
        </a-radio-group>
      </a-form-item>
    </div>

    <!-- 对象类型配置 -->
    <div v-else-if="field.type === 'object'">
      <a-form-item label="对象属性">
        <div class="object-properties">
          <div
            v-for="(prop, index) in localConfig.properties"
            :key="index"
            class="object-property"
          >
            <a-input
              v-model:value="prop.key"
              placeholder="属性名"
              style="width: 30%"
              @change="handleChange"
            />
            <a-select
              v-model:value="prop.type"
              placeholder="类型"
              style="width: 25%"
              @change="handleChange"
            >
              <a-select-option value="string">字符串</a-select-option>
              <a-select-option value="number">数字</a-select-option>
              <a-select-option value="boolean">布尔值</a-select-option>
              <a-select-option value="array">数组</a-select-option>
            </a-select>
            <a-input
              v-model:value="prop.description"
              placeholder="描述"
              style="width: 35%"
              @change="handleChange"
            />
            <a-button
              type="text"
              danger
              @click="removeObjectProperty(index)"
            >
              <template #icon><DeleteOutlined /></template>
            </a-button>
          </div>
          
          <a-button
            type="dashed"
            style="width: 100%"
            @click="addObjectProperty"
          >
            <template #icon><PlusOutlined /></template>
            添加属性
          </a-button>
        </div>
      </a-form-item>
      
      <a-form-item label="嵌套深度">
        <a-input-number
          v-model:value="localConfig.maxDepth"
          :min="1"
          :max="5"
          style="width: 100%"
          @change="handleChange"
        />
      </a-form-item>
    </div>

    <!-- 邮箱类型配置 -->
    <div v-else-if="field.type === 'email'">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="域名">
            <a-select
              v-model:value="localConfig.domain"
              mode="tags"
              style="width: 100%"
              placeholder="选择或输入域名"
              @change="handleChange"
            >
              <a-select-option value="gmail.com">gmail.com</a-select-option>
              <a-select-option value="yahoo.com">yahoo.com</a-select-option>
              <a-select-option value="hotmail.com">hotmail.com</a-select-option>
              <a-select-option value="163.com">163.com</a-select-option>
              <a-select-option value="qq.com">qq.com</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="用户名格式">
            <a-select
              v-model:value="localConfig.usernameFormat"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="firstName.lastName">名.姓</a-select-option>
              <a-select-option value="firstNameLastName">名姓</a-select-option>
              <a-select-option value="random">随机</a-select-option>
              <a-select-option value="custom">自定义</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </div>

    <!-- 手机号类型配置 -->
    <div v-else-if="field.type === 'phone'">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="国家/地区">
            <a-select
              v-model:value="localConfig.country"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="CN">中国 (+86)</a-select-option>
              <a-select-option value="US">美国 (+1)</a-select-option>
              <a-select-option value="UK">英国 (+44)</a-select-option>
              <a-select-option value="JP">日本 (+81)</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="格式">
            <a-select
              v-model:value="localConfig.format"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="international">国际格式</a-select-option>
              <a-select-option value="national">国内格式</a-select-option>
              <a-select-option value="e164">E164格式</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </div>

    <!-- URL类型配置 -->
    <div v-else-if="field.type === 'url'">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="协议">
            <a-select
              v-model:value="localConfig.protocol"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="http">HTTP</a-select-option>
              <a-select-option value="https">HTTPS</a-select-option>
              <a-select-option value="ftp">FTP</a-select-option>
              <a-select-option value="random">随机</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="域名类型">
            <a-select
              v-model:value="localConfig.domainType"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="common">常见域名</a-select-option>
              <a-select-option value="tech">技术域名</a-select-option>
              <a-select-option value="business">商业域名</a-select-option>
              <a-select-option value="random">随机域名</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="包含路径">
            <a-switch
              v-model:checked="localConfig.includePath"
              @change="handleChange"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </div>

    <!-- ID类型配置 -->
    <div v-else-if="field.type === 'id' || field.type === 'uuid'">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="ID类型">
            <a-select
              v-model:value="localConfig.idType"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="uuid">UUID</a-select-option>
              <a-select-option value="nanoid">NanoID</a-select-option>
              <a-select-option value="sequential">顺序ID</a-select-option>
              <a-select-option value="timestamp">时间戳ID</a-select-option>
              <a-select-option value="custom">自定义格式</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="前缀">
            <a-input
              v-model:value="localConfig.prefix"
              placeholder="ID前缀"
              @change="handleChange"
            />
          </a-form-item>
        </a-col>
      </a-row>
      
      <div v-if="localConfig.idType === 'sequential'">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="起始值">
              <a-input-number
                v-model:value="localConfig.startValue"
                style="width: 100%"
                @change="handleChange"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="步长">
              <a-input-number
                v-model:value="localConfig.step"
                :min="1"
                style="width: 100%"
                @change="handleChange"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </div>
      
      <div v-if="localConfig.idType === 'custom'">
        <a-form-item label="自定义格式">
          <a-input
            v-model:value="localConfig.customFormat"
            placeholder="例如: USER_{timestamp}_{random}"
            @change="handleChange"
          />
        </a-form-item>
      </div>
    </div>

    <!-- 姓名类型配置 -->
    <div v-else-if="field.type === 'name'">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="姓名类型">
            <a-select
              v-model:value="localConfig.nameType"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="full">全名</a-select-option>
              <a-select-option value="first">名</a-select-option>
              <a-select-option value="last">姓</a-select-option>
              <a-select-option value="middle">中间名</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="性别">
            <a-select
              v-model:value="localConfig.gender"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="random">随机</a-select-option>
              <a-select-option value="male">男性</a-select-option>
              <a-select-option value="female">女性</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="地区">
            <a-select
              v-model:value="localConfig.locale"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="zh_CN">中文</a-select-option>
              <a-select-option value="en_US">英文</a-select-option>
              <a-select-option value="ja_JP">日文</a-select-option>
              <a-select-option value="ko_KR">韩文</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </div>

    <!-- 地址类型配置 -->
    <div v-else-if="field.type === 'address'">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="地址类型">
            <a-select
              v-model:value="localConfig.addressType"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="full">完整地址</a-select-option>
              <a-select-option value="street">街道地址</a-select-option>
              <a-select-option value="city">城市</a-select-option>
              <a-select-option value="state">省/州</a-select-option>
              <a-select-option value="country">国家</a-select-option>
              <a-select-option value="zipcode">邮编</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="国家">
            <a-select
              v-model:value="localConfig.country"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="CN">中国</a-select-option>
              <a-select-option value="US">美国</a-select-option>
              <a-select-option value="UK">英国</a-select-option>
              <a-select-option value="JP">日本</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="格式">
            <a-select
              v-model:value="localConfig.format"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="standard">标准格式</a-select-option>
              <a-select-option value="short">简短格式</a-select-option>
              <a-select-option value="detailed">详细格式</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </div>

    <!-- 公司类型配置 -->
    <div v-else-if="field.type === 'company'">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="公司类型">
            <a-select
              v-model:value="localConfig.companyType"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="name">公司名称</a-select-option>
              <a-select-option value="suffix">公司后缀</a-select-option>
              <a-select-option value="industry">行业</a-select-option>
              <a-select-option value="department">部门</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="行业">
            <a-select
              v-model:value="localConfig.industry"
              style="width: 100%"
              @change="handleChange"
            >
              <a-select-option value="tech">科技</a-select-option>
              <a-select-option value="finance">金融</a-select-option>
              <a-select-option value="healthcare">医疗</a-select-option>
              <a-select-option value="education">教育</a-select-option>
              <a-select-option value="retail">零售</a-select-option>
              <a-select-option value="manufacturing">制造业</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
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
  ElInput,
  ElSelect,
  ElOption,
  ElSwitch,
  ElButton,
  ElDatePicker,
  ElRadioGroup,
  ElRadio,
  ElIcon
} from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { FieldConfig } from '../types'

// Props
interface Props {
  field: FieldConfig
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  change: () => void
}>()

// State
const localConfig = ref(props.field.config || {})

// 监听字段变化
watch(() => props.field, (newField) => {
  localConfig.value = newField.config || {}
}, { deep: true })

// 监听配置变化
watch(localConfig, (newConfig) => {
  props.field.config = { ...newConfig }
  emit('change')
}, { deep: true })

// 初始化默认配置
const initDefaultConfig = () => {
  if (!localConfig.value || Object.keys(localConfig.value).length === 0) {
    switch (props.field.type) {
      case 'string':
        localConfig.value = {
          minLength: 1,
          maxLength: 50,
          format: 'text'
        }
        break
      case 'number':
      case 'price':
        localConfig.value = {
          min: 0,
          max: 1000,
          decimals: 0,
          numberType: 'integer',
          distribution: 'uniform'
        }
        break
      case 'date':
        localConfig.value = {
          format: 'YYYY-MM-DD',
          relative: 'recent'
        }
        break
      case 'array':
        localConfig.value = {
          minItems: 1,
          maxItems: 5,
          itemType: 'string',
          uniqueItems: false
        }
        break
      case 'enum':
      case 'status':
        localConfig.value = {
          options: [{ value: 'option1', label: '选项1', weight: 50 }],
          selectionMode: 'random'
        }
        break
      case 'object':
        localConfig.value = {
          properties: [{ key: 'key1', type: 'string', description: '属性1' }],
          maxDepth: 2
        }
        break
      case 'email':
        localConfig.value = {
          domain: ['gmail.com'],
          usernameFormat: 'firstName.lastName'
        }
        break
      case 'phone':
        localConfig.value = {
          country: 'CN',
          format: 'national'
        }
        break
      case 'url':
        localConfig.value = {
          protocol: 'https',
          domainType: 'common',
          includePath: true
        }
        break
      case 'id':
      case 'uuid':
        localConfig.value = {
          idType: 'uuid',
          prefix: ''
        }
        break
      case 'name':
        localConfig.value = {
          nameType: 'full',
          gender: 'random',
          locale: 'zh_CN'
        }
        break
      case 'address':
        localConfig.value = {
          addressType: 'full',
          country: 'CN',
          format: 'standard'
        }
        break
      case 'company':
        localConfig.value = {
          companyType: 'name',
          industry: 'tech'
        }
        break
    }
  }
}

// 枚举选项相关方法
const addEnumOption = () => {
  if (!localConfig.value.options) {
    localConfig.value.options = []
  }
  localConfig.value.options.push({ value: '', label: '', weight: 50 })
  handleChange()
}

const removeEnumOption = (index: number) => {
  if (localConfig.value.options) {
    localConfig.value.options.splice(index, 1)
    handleChange()
  }
}

// 对象属性相关方法
const addObjectProperty = () => {
  if (!localConfig.value.properties) {
    localConfig.value.properties = []
  }
  localConfig.value.properties.push({ key: '', type: 'string', description: '' })
  handleChange()
}

const removeObjectProperty = (index: number) => {
  if (localConfig.value.properties) {
    localConfig.value.properties.splice(index, 1)
    handleChange()
  }
}

// 处理变化
const handleChange = () => {
  emit('change')
}

// 初始化
initDefaultConfig()
</script>

<style scoped>
.business-field-config {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  margin-top: 16px;
}

.enum-options,
.object-properties {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.enum-option,
.object-property {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>