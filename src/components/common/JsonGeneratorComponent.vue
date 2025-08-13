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

    <!-- 配置验证提示 -->
    <div v-if="!isConfigValid" class="validation-tip" role="alert" aria-live="polite">
      <span class="tip-icon" aria-hidden="true">⚠️</span>
      <span>{{ validationMessage }}</span>
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

// 配置变化处理
const emitConfigChange = () => {
  const config = {
    strategy: generationStrategy.value,
    isValid: isConfigValid.value,
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
/* ===== 基础组件布局 ===== */
.json-generator {
  padding: var(--space-6);
  max-width: 900px;
  margin: 0 auto;
  color: var(--md-on-surface);
}

.json-generator h2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--md-on-surface);
  margin: 0 0 var(--space-8);
  line-height: var(--leading-tight);
}

.json-generator h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--md-on-surface);
  margin: 0 0 var(--space-4);
  line-height: var(--leading-normal);
}

/* ===== 区域容器 ===== */
.strategy-section,
.config-section {
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-1);
}

/* ===== 表单项目 ===== */
.form-item {
  margin-bottom: var(--space-5);
}

.form-item label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: var(--font-medium);
  color: var(--md-on-surface);
  font-size: var(--text-sm);
}

.form-item input,
.form-item textarea {
  width: 100%;
  padding: var(--space-3);
  border: 2px solid var(--md-outline-variant);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-base);
  color: var(--md-on-surface);
  background: var(--md-surface);
  transition: all var(--duration-200) var(--ease-out);
}

/* 高对比度焦点样式 */
.form-item input:focus,
.form-item textarea:focus {
  outline: 3px solid var(--md-primary);
  outline-offset: 2px;
  border-color: var(--md-primary);
}

.form-item input:invalid,
.form-item textarea:invalid {
  border-color: var(--md-error);
}

/* ===== 单选按钮组 ===== */
.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.radio-group label {
  display: flex;
  align-items: center;
  font-weight: var(--font-normal);
  cursor: pointer;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all var(--duration-200) var(--ease-out);
  min-height: 44px; /* 触摸友好 */
}

.radio-group label:hover {
  background: var(--md-primary-container);
}

.radio-group input[type="radio"] {
  width: 20px;
  height: 20px;
  margin-right: var(--space-2);
  margin-bottom: 0;
  accent-color: var(--md-primary);
  cursor: pointer;
}

/* 确保单选按钮在高对比度模式下可见 */
.radio-group input[type="radio"]:focus {
  outline: 3px solid var(--md-primary);
  outline-offset: 2px;
}

/* ===== 层级控制 ===== */
.level-controls {
  margin-bottom: var(--space-5);
}

.level-item {
  background: var(--md-surface-variant);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  font-weight: var(--font-medium);
  color: var(--md-on-surface-variant);
}

/* ===== 按钮样式 ===== */
button {
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--md-outline);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-out);
  min-height: 44px; /* 触摸友好 */
  background: var(--md-surface);
  color: var(--md-on-surface);
}

button:hover {
  background: var(--md-secondary-container);
  border-color: var(--md-secondary);
}

button:focus {
  outline: 3px solid var(--md-primary);
  outline-offset: 2px;
}

button[type="button"]:last-child {
  background: var(--md-error-container);
  color: var(--md-on-error-container);
  border-color: var(--md-error);
}

button[type="button"]:last-child:hover {
  background: var(--md-error);
  color: var(--md-on-error);
}

/* ===== 验证提示 ===== */
.validation-tip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--md-error-container);
  border: 2px solid var(--md-error);
  border-radius: var(--radius-md);
  color: var(--md-on-error-container);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  margin-top: var(--space-6);
}

.tip-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

/* ===== 响应式设计 ===== */
@media (max-width: 479px) {
  .json-generator {
    padding: var(--space-4);
  }
  
  .strategy-section,
  .config-section,
  .level-item {
    padding: var(--space-4);
    margin-bottom: var(--space-4);
  }
  
  .radio-group {
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .level-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
}

@media (min-width: 480px) and (max-width: 767px) {
  .json-generator {
    padding: var(--space-5);
  }
  
  .radio-group {
    gap: var(--space-3);
  }
}

/* ===== 高对比度模式 ===== */
@media (prefers-contrast: high) {
  .form-item input,
  .form-item textarea,
  button {
    border-width: 3px;
  }
  
  .validation-tip {
    border-width: 3px;
  }
  
  .strategy-section,
  .config-section,
  .level-item {
    border-width: 2px;
  }
}

/* ===== 减少动画模式 ===== */
@media (prefers-reduced-motion: reduce) {
  .form-item input,
  .form-item textarea,
  .radio-group label,
  button {
    transition: none;
  }
}

/* ===== 打印样式 ===== */
@media print {
  .json-generator {
    padding: 0;
  }
  
  .strategy-section,
  .config-section,
  .level-item {
    box-shadow: none;
    border: 1px solid black;
    break-inside: avoid;
  }
  
  .validation-tip {
    background: transparent;
    border: 2px solid black;
  }
}
</style>