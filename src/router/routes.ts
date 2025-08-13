import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../App.vue'),
    meta: { title: 'JSON数据生成器' }
  },
  {
    path: '/config/:id?',
    name: 'Config',
    component: () => import('../App.vue'),
    props: true,
    meta: { title: '配置生成器' }
  }
];

export default routes;