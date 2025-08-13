import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'

// 样式导入
import 'element-plus/dist/index.css'
import './assets/styles/variables.css'
import './assets/styles/layout.css'
import './assets/styles/components.css'
import './assets/styles/animations.css'
import './index.css'

const app = createApp(App)

// 使用插件
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')