<template>
  <div class="json-generator">
    <h2>JSON数据生成器</h2>
    
    <div class="strategy-section">
      <h3>生成策略选择</h3>
      <div class="radio-group">
        <label>
          <input type="radio" v-model="generationStrategy" value="fixed" />
          固定数量生成
        </label>
        <label>
          <input type="radio" v-model="generationStrategy" value="traverse" />
          数据遍历生成
        </label>
        <label>
          <input type="radio" v-model="generationStrategy" value="complex" />
          复杂遍历生成
        </label>
      </div>
    </div>

    <div v-if="generationStrategy === 'fixed'" class="config-section">
      <h3>固定数量配置</h3>
      <div class="form-item">
        <label>生成数量:</label>
        <input type="number" v-model="fixedCount" min="1" max="10000" />
      </div>
    </div>

    <div v-if="generationStrategy === 'traverse'" class="config-section">
      <h3>数据遍历配置</h3>
      <div class="form-item">
        <label>数据源类型:</label>
        <div class="radio-group">
          <label>
            <input type="radio" v-model="traverseType" value="json" />
            JSON列表
          </label>
          <label>
            <input type="radio" v-model="traverseType" value="range" />
            数据范围
          </label>
        </div>
      </div>
      
      <div v-if="traverseType === 'json'" class="form-item">
        <label>JSON数据:</label>
        <textarea v-model="jsonData" rows="4" placeholder="请输入JSON数组"></textarea>
      </div>
      
      <div v-if="traverseType === 'range'">
        <div class="form-item">
          <label>起始值:</label>
          <input type="number" v-model="rangeStart" />
        </div>
        <div class="form-item">
          <label>结束值:</label>
          <input type="number" v-model="rangeEnd" />
        </div>
        <div class="form-item">
          <label>步长:</label>
          <input type="number" v-model="rangeStep" min="1" />
        </div>
      </div>
    </div>

    <div v-if="generationStrategy === 'complex'" class="config-section">
      <h3>复杂遍历配置</h3>
      <div class="level-controls">
        <button type="button" @click="addLevel">添加层级</button>
      </div>
      
      <div v-for="(level, index) in complexLevels" :key="index" class="level-item">
        <div class="level-header">
          <span>第{{ index + 1 }}层遍历</span>
          <button v-if="complexLevels.length > 1" type="button" @click="removeLevel(index)">
            删除
          </button>
        </div>
        
        <div class="form-item">
          <label>层级名称:</label>
          <input type="text" v-model="level.name" />
        </div>
        
        <div class="form-item">
          <label>数据源类型:</label>
          <div class="radio-group">
            <label>
              <input type="radio" v-model="level.sourceType" value="json" />
              JSON列表
            </label>
            <label>
              <input type="radio" v-model="level.sourceType" value="range" />
              数据范围
            </label>
          </div>
        </div>
        
        <div v-if="level.sourceType === 'json'" class="form-item">
          <label>JSON数据:</label>
          <textarea v-model="level.jsonData" rows="3" placeholder="请输入JSON数组"></textarea>
        </div>
        
        <div v-if="level.sourceType === 'range'">
          <div class="form-item">
            <label>起始值:</label>
            <input type="number" v-model="level.rangeStart" />
          </div>
          <div class="form-item">
            <label>结束值:</label>
            <input type="number" v-model="level.rangeEnd" />
          </div>
          <div class="form-item">
            <label>步长:</label>
            <input type="number" v-model="level.step" min="1" />
          </div>
        </div>
      </div>
    </div>

    <!-- 添加操作按钮区域 -->
    <div class="action-section">
      <div class="button-group">
        <button type="button" @click="resetConfig" class="btn-secondary">
          重置配置
        </button>
        <button 
          type="button" 
          @click="nextStep" 
          :disabled="!isConfigValid"
          class="btn-primary"
        >
          下一步：字段配置
        </button>
      </div>
      
      <!-- 配置验证提示 -->
      <div v-if="!isConfigValid" class="validation-tip">
        <span class="tip-icon">⚠️</span>
        <span>{{ validationMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// Props
defineProps<{
  className?: string
  style?: any
}>()

// Emits
const emit = defineEmits<{
  nextStep: [config: any]
  configChange: [config: any]
}>()

// 生成策略
const generationStrategy = ref('fixed')

// 固定数量配置
const fixedCount = ref(10)

// 数据遍历配置
const traverseType = ref('json')
const jsonData = ref('')
const rangeStart = ref(1)
const rangeEnd = ref(100)
const rangeStep = ref(1)

// 复杂遍历配置
const complexLevels = reactive([
  {
    name: '',
    sourceType: 'json',
    jsonData: '',
    rangeStart: 1,
    rangeEnd: 10,
    step: 1
  }
])

// 配置验证
const isConfigValid = computed(() => {
  switch (generationStrategy.value) {
    case 'fixed':
      return fixedCount.value > 0 && fixedCount.value <= 10000
    
    case 'traverse':
      if (traverseType.value === 'json') {
        return jsonData.value.trim() !== ''
      } else {
        return rangeStart.value < rangeEnd.value && rangeStep.value > 0
      }
    
    case 'complex':
      return complexLevels.every(level => {
        if (level.sourceType === 'json') {
          return level.name.trim() !== '' && level.jsonData.trim() !== ''
        } else {
          return level.name.trim() !== '' && 
                 level.rangeStart < level.rangeEnd && 
                 level.step > 0
        }
      })
    
    default:
      return false
  }
})

// 验证消息
const validationMessage = computed(() => {
  switch (generationStrategy.value) {
    case 'fixed':
      if (fixedCount.value <= 0) return '生成数量必须大于0'
      if (fixedCount.value > 10000) return '生成数量不能超过10000'
      break
    
    case 'traverse':
      if (traverseType.value === 'json' && jsonData.value.trim() === '') {
        return '请输入有效的JSON数据'
      }
      if (traverseType.value === 'range') {
        if (rangeStart.value >= rangeEnd.value) return '起始值必须小于结束值'
        if (rangeStep.value <= 0) return '步长必须大于0'
      }
      break
    
    case 'complex':
      const invalidLevel = complexLevels.findIndex(level => {
        if (level.sourceType === 'json') {
          return level.name.trim() === '' || level.jsonData.trim() === ''
        } else {
          return level.name.trim() === '' || 
                 level.rangeStart >= level.rangeEnd || 
                 level.step <= 0
        }
      })
      if (invalidLevel !== -1) {
        return `第${invalidLevel + 1}层配置不完整或有误`
      }
      break
  }
  return '请完善配置信息'
})

// 方法
const addLevel = () => {
  complexLevels.push({
    name: '',
    sourceType: 'json',
    jsonData: '',
    rangeStart: 1,
    rangeEnd: 10,
    step: 1
  })
}

const removeLevel = (index: number) => {
  if (complexLevels.length > 1) {
    complexLevels.splice(index, 1)
  }
}

const resetConfig = () => {
  generationStrategy.value = 'fixed'
  fixedCount.value = 10
  traverseType.value = 'json'
  jsonData.value = ''
  rangeStart.value = 1
  rangeEnd.value = 100
  rangeStep.value = 1
  
  // 重置复杂遍历配置
  complexLevels.splice(0, complexLevels.length)
  complexLevels.push({
    name: '',
    sourceType: 'json',
    jsonData: '',
    rangeStart: 1,
    rangeEnd: 10,
    step: 1
  })
}

const nextStep = () => {
  if (!isConfigValid.value) return
  
  // 构建配置对象
  const config = {
    strategy: generationStrategy.value,
    ...(generationStrategy.value === 'fixed' && {
      fixedCount: fixedCount.value
    }),
    ...(generationStrategy.value === 'traverse' && {
      traverseType: traverseType.value,
      ...(traverseType.value === 'json' && { jsonData: jsonData.value }),
      ...(traverseType.value === 'range' && {
        rangeStart: rangeStart.value,
        rangeEnd: rangeEnd.value,
        rangeStep: rangeStep.value
      })
    }),
    ...(generationStrategy.value === 'complex' && {
      complexLevels: [...complexLevels]
    })
  }
  
  // 触发下一步事件
  emit('nextStep', config)
}

// 监听配置变化
const emitConfigChange = () => {
  const config = {
    strategy: generationStrategy.value,
    isValid: isConfigValid.value,
    // ... 其他配置数据
  }
  emit('configChange', config)
}

// 监听配置变化
import { watch } from 'vue'
watch([generationStrategy, fixedCount, traverseType, jsonData, rangeStart, rangeEnd, rangeStep, complexLevels], 
  emitConfigChange, 
  { deep: true }
)
</script>

<style scoped>
.json-generator {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.strategy-section,
.config-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form-item {
  margin-bottom: 15px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-item input,
.form-item textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.radio-group {
  display: flex;
  gap: 15px;
}

.radio-group label {
  display: flex;
  align-items: center;
  font-weight: normal;
}

.radio-group input {
  width: auto;
  margin-right: 5px;
}

.level-controls {
  margin-bottom: 20px;
}

.level-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
  background-color: #f9f9f9;
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
}

/* 新增样式 */
.action-section {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.button-group {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.btn-primary {
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  padding: 12px 24px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.validation-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  color: #856404;
  font-size: 14px;
}

.tip-icon {
  font-size: 16px;
}

button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

button[type="button"]:last-child {
  background-color: #dc3545;
}

button[type="button"]:last-child:hover {
  background-color: #c82333;
}
</style>