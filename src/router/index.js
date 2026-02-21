import { createRouter, createWebHistory } from 'vue-router'

const Projects = () => import('../pages/Projects.vue')
const YunmuPractice = () => import('../pages/YunmuPractice.vue')
const Writer = () => import('../pages/Writer.vue')
const Statistics = () => import('../pages/Statistics.vue')

const routes = [
  { path: '/', name: 'home', component: Projects },
  { path: '/yunmu-practice', name: 'yunmu-practice', component: YunmuPractice },
  { path: '/writer', name: 'writer', component: Writer },
  { path: '/statistics', name: 'statistics', component: Statistics },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router
