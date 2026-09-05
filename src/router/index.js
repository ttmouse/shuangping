import { createRouter, createWebHistory } from 'vue-router'

const Projects = () => import('../pages/Projects.vue')
const YunmuPractice = () => import('../pages/YunmuPractice.vue')
const Writer = () => import('../pages/Writer.vue')
const PracticeModes = () => import('../pages/PracticeModes.vue')
const Statistics = () => import('../pages/Statistics.vue')
const Progress = () => import('../pages/Progress.vue')

const routes = [
  { path: '/', redirect: '/practice-modes' },
  { path: '/projects', name: 'projects', component: Projects },
  { path: '/practice-modes', name: 'practice-modes', component: PracticeModes },
  { path: '/yunmu-practice', name: 'yunmu-practice', component: YunmuPractice },
  { path: '/writer', name: 'writer', component: Writer },
  { path: '/statistics', name: 'statistics', component: Statistics },
  { path: '/progress', name: 'progress', component: Progress },
  // 旧阅读路径 → 统一课程 URL（pack/course + mode=reading 后缀）
  {
    path: '/course-reading',
    redirect: to => ({ path: '/practice-modes', query: { ...(to.query.pack ? { pack: to.query.pack } : {}), ...(to.query.course ? { course: to.query.course } : {}), mode: 'reading' } }),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router
