import { createRouter, createWebHistory } from 'vue-router'

const YunmuPractice = () => import('../pages/YunmuPractice.vue')
const Writer = () => import('../pages/Writer.vue')

const routes = [
  { path: '/', name: 'home', component: YunmuPractice },
  { path: '/writer', name: 'writer', component: Writer },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router
