import { createWebHashHistory, createRouter } from 'vue-router';
import type { App } from 'vue';

import { routes } from './routes/index';

const router = createRouter({
   history: createWebHashHistory(),
   routes,
});

export function setupRouter(app: App) {
   app.use(router);
}
