export const routes = [
   // 配置默认路由
   {
      path: '/',
      name: 'home',
      component: () => import('@renderer/views/index.vue'),
   },
];
