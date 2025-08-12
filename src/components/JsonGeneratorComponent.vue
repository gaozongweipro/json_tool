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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// Props
defineProps<{
  className?: string
  style?: any
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