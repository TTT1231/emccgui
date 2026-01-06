import { createApp } from 'vue';
import '@resources/public/assets/tailwind.css';
import '@renderer/theme.scss';

import App from './App.vue';
import { setupRouter } from './router';

const app = createApp(App);

// 配置路由
setupRouter(app);

app.mount('#app');
