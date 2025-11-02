import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'

import AdminPanel from '../views/adminPanel.vue'
import CallmakerPanel from '../views/CallmakerPanel.vue'

const routes = [
  { path: '/', name: 'login', component: LoginView },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/admin', name: 'admin', component: AdminPanel, meta: { requiresAuth: true } },
  { path: '/callmaker', name: 'callmaker', component: CallmakerPanel, meta: { requiresAuth: true } },
]

const router = createRouter({ history: createWebHistory(), routes });

// global guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) return next({ name: 'login' });
  next();
});

export default router;
