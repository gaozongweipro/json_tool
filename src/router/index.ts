import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  // 更新页面标题
  document.title = to.meta.title as string || 'JSON数据生成器';
  next();
});

export default router;