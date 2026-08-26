<template>
  <div class="portfolio-container">
    <!-- 跳过链接，提升可访问性 -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div class="background-pattern"></div>
    <div class="container">
      <!-- 项目展示 -->
      <main id="main-content" class="projects-section" role="main">
        <div class="section-header">
          <div class="section-title-area">
            <h1 class="section-title">Projects</h1>
          </div>
          <div class="section-controls">
            <div class="filter-group">
              <button class="filter-btn" :class="{ active: currentFilter === 'all' }" @click="filterCategory('all')">All</button>
              <button class="filter-btn" :class="{ active: currentFilter === 'learning' }" @click="filterCategory('learning')">Learning</button>
              <button class="filter-btn" :class="{ active: currentFilter === 'tools' }" @click="filterCategory('tools')">Tools</button>
              <button class="filter-btn" :class="{ active: currentFilter === 'ai' }" @click="filterCategory('ai')">AI</button>
            </div>
          </div>
        </div>

        <div class="projects-grid" role="list" aria-label="Projects list">
          <!-- 动态项目卡片 -->
          <template v-for="project in displayedProjects" :key="project.id">
            <router-link
              v-if="project.route"
              :to="project.route"
              :class="['project-card', { featured: project.featured }]"
              :tabindex="0"
              :aria-label="`View project: ${project.title} - ${project.description}`"
              role="listitem"
              @keyup.enter="$router.push(project.route)"
            >
              <div class="card-content">
                <div class="project-info">
                  <h3 class="project-title">{{ project.title }}</h3>
                  <p class="project-description">{{ project.description }}</p>

                    </div>
              </div>
            </router-link>

            <a
              v-else-if="project.externalUrl"
              :href="project.externalUrl"
              target="_blank"
              rel="noopener noreferrer"
              :class="['project-card', { featured: project.featured }]"
              :aria-label="`Open project: ${project.title} - ${project.description}`"
              role="listitem"
            >
              <div class="card-content">
                <div class="project-info">
                  <h3 class="project-title">{{ project.title }}</h3>
                  <p class="project-description">{{ project.description }}</p>

                  </div>
              </div>
            </a>

            <!-- 非路由项目（展示用） -->
            <div
              v-else
              class="project-card coming-soon"
              :aria-label="`${project.title} - ${project.description} (Coming Soon)`"
              role="listitem"
            >
              <div class="card-content">
                <div class="project-info">
                  <h3 class="project-title">{{ project.title }}</h3>
                  <p class="project-description">{{ project.description }}</p>

                    </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 显示更多按钮 -->
        <div v-if="hasMoreProjects" class="load-more">
          <button @click="showMoreProjects" class="load-more-btn" :disabled="isLoading">
            <span v-if="!isLoading">Show More</span>
            <span v-else class="loading-text">
              <span class="loading-spinner">⟳</span>
              Loading...
            </span>
            <svg v-if="!isLoading" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 4v8M4 8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </main>

      <!-- 联系方式 -->
      <footer class="contact-footer">
        <div class="contact-links">
          <a href="https://x.com/ttmouse" target="_blank" rel="noopener noreferrer" class="contact-link">
            <span class="contact-icon">𝕏</span>
            <span class="contact-text">Twitter</span>
          </a>
          <a href="mailto:ttmouseg@gmail.com" class="contact-link">
            <span class="contact-icon"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><path d="m2.5 5 5.5 4 5.5-4"/></svg></span>
            <span class="contact-text">Email</span>
          </a>
          <div class="contact-link">
            <span class="contact-icon"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2.5c-3.3 0-6 2.2-6 5 0 1.6.8 3 2.1 3.9-.3 1.1-1 2-2.1 2.6.9 0 1.7-.2 2.4-.6.9.5 2 .8 3.6.8 3.3 0 6-2.2 6-5S11.3 2.5 8 2.5z"/></svg></span>
            <span class="contact-text">WeChat: ttmouse</span>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 项目数据
  const projects = ref([
  {
    id: 'yunmu-practice',
    title: '双拼练习工具',
    description: '专业的双拼输入法练习平台，支持多种方案和语音反馈',
    category: 'learning',
    status: 'active',
    icon: '⌨',
    tech: ['Vue 3', 'Web Audio API', 'Pinia'],
    route: '/yunmu-practice',
    highlights: ['8种双拼方案', '自动语音朗读', 'Figma风格界面']
  },
  {
    id: 'progress',
    title: '学习进度',
    description: '追踪双拼学习进度，查看成就和学习路径',
    category: 'learning',
    status: 'active',
    icon: '',
    tech: ['Vue 3', 'Pinia', 'LocalStorage'],
    route: '/progress',
    highlights: ['进度追踪', '成就系统', '学习路径']
  },
  {
    id: 'chat-list',
    title: 'Chat List（话术助手）',
    description: '浏览器话术助手与短句管理，支持多关键词高亮与AND匹配',
    category: 'tools',
    status: 'active',
    icon: '',
    tech: ['Browser Extension', 'JavaScript', 'CSS'],
    externalUrl: 'https://github.com/ttmouse/chat-list',
    highlights: ['多关键词高亮', 'AND匹配', '预览浮层交互', '悬浮动作按钮']
  },
  {
    id: 'wispr-flow-cn',
    title: 'Wispr Flow CN（Dou-flow）',
    description: '基于 FunASR 的 macOS 语音转文字应用，支持全局快捷键与离线识别',
    category: 'ai',
    status: 'active',
    icon: '',
    tech: ['FunASR', 'PyQt6', 'Python', 'PyAudio'],
    externalUrl: 'https://github.com/ttmouse/Wispr-Flow-CN',
    highlights: ['全局快捷键录音', '自动文本粘贴', '离线识别', '系统托盘与历史记录']
  },
  {
    id: 'designprompt',
    title: 'Design Prompt',
    description: '将设计原则转化为可用提示词，辅助AI创作并理解设计原则',
    category: 'ai',
    status: 'active',
    icon: '',
    tech: ['Prompt Engineering', 'Design Principles', 'Vercel'],
    externalUrl: 'https://designprompt.vercel.app',
    highlights: ['设计原则到提示词', 'AI创作辅助', '学习设计原则']
  },
  {
    id: 'twitter-reply-assistant',
    title: 'Twitter Reply Assistant',
    description: 'Chrome 扩展，AI生成上下文回复，支持多供应商与自定义风格',
    category: 'ai',
    status: 'active',
    icon: '',
    tech: ['React 18', 'TypeScript', 'Vite', 'CRXJS'],
    externalUrl: 'https://github.com/ttmouse/twitter-reply-assistant',
    highlights: ['AI智能回复', '内容扩写', '多模型供应商', '预设/自定义风格', '一键操作']
  },
  {
    id: 'twitter-followers-status',
    title: 'Twitter 关注数追踪器',
    description: 'Chrome 插件，自动记录关注/粉丝变化，支持每日自动运行与趋势分析',
    category: 'tools',
    status: 'active',
    icon: '',
    tech: ['Chrome Extension', 'JavaScript', 'Storage/Alarms/Notifications API'],
    externalUrl: 'https://github.com/ttmouse/twitter_followers_status',
    highlights: ['一键记录', '每日自动抓取', '增长率分析', 'CSV导出']
  },
    {
      id: 'subformai',
      title: 'SubformAI',
      description: '智能表单构建工具，通过AI快速生成和优化表单设计',
      category: 'tools',
      status: 'active',
      icon: '',
      tech: ['AI', 'Form Builder', 'React'],
      externalUrl: 'https://subformai.vercel.app',
      highlights: ['AI表单生成', '拖拽式设计', '智能验证']
    }
    ,
  {
    id: 'loadingorb',
    title: 'Loading Orb',
    description: '不同字符序列的循环 Loading 效果合集',
    category: 'tools',
    status: 'active',
    icon: '',
    tech: ['Web', 'Unicode'],
    externalUrl: 'https://loadingorb.vercel.app/',
    highlights: ['字符序列动画', '多样风格', '轻量浏览']
  }
  ,
  {
    id: 'figma-4096',
    title: 'figma-4096',
    description: '静态网页示例项目（HTML）',
    category: 'tools',
    status: 'active',
    icon: '',
    tech: ['HTML'],
    externalUrl: 'https://github.com/ttmouse/figma-4096',
    highlights: []
  }
  ])
  const excludedNames = new Set(['---'])
  const excludedUrls = new Set(['https://github.com/ttmouse/---'])

// 从 GitHub 自动补充公开仓库到卡片
async function loadGithubRepos() {
  try {
    const resp = await fetch('https://api.github.com/users/ttmouse/repos?per_page=100&type=public&sort=updated')
    if (!resp.ok) return
    const repos = await resp.json()
    projects.value = projects.value.filter(p => !excludedNames.has((p.title || '').trim()) && !excludedUrls.has(p.externalUrl))
    const existingUrls = new Set(projects.value.map(p => p.externalUrl).filter(Boolean))
    for (const r of repos) {
      const url = r.html_url
      if (!url || existingUrls.has(url) || excludedNames.has((r.name || '').trim()) || excludedUrls.has(url)) continue
      projects.value.push({
        id: 'gh-' + (r.name || Math.random().toString(36).slice(2)),
        title: r.name || '未命名仓库',
        description: r.description || 'GitHub 开源仓库',
        category: 'tools',
        status: 'active',
        icon: '',
        tech: [],
        externalUrl: url,
        highlights: []
      })
      existingUrls.add(url)
    }
    for (const r of repos) {
      const url = r.html_url
      if (!url || excludedNames.has((r.name || '').trim()) || excludedUrls.has(url)) continue
      const desc = await buildDescription(r)
      const meta = await buildRepoMeta(r)
      const p = projects.value.find(x => x.externalUrl === url)
      if (p) {
        p.description = desc || p.description
        p.tech = (meta.tech && meta.tech.length) ? meta.tech : p.tech
        p.category = meta.category || p.category
        p.highlights = (meta.highlights && meta.highlights.length) ? meta.highlights : p.highlights
      }
    }
    // 展示全部补充后的项目
    displayLimit.value = filteredProjects.value.length
  } catch {}
}

function cleanText(s) { return (s || '').replace(/\r/g, '').trim() }

async function fetchReadme(owner, repo) {
  try {
    const u = `https://api.github.com/repos/${owner}/${repo}/readme`
    const resp = await fetch(u, { headers: { Accept: 'application/vnd.github.raw+json' } })
    if (!resp.ok) return ''
    const txt = await resp.text()
    return txt
  } catch { return '' }
}

function extractSummary(md) {
  const lines = cleanText(md).split('\n')
  for (const line of lines) {
    const l = line.trim()
    if (!l) continue
    if (/^#/.test(l)) continue
    if (/^!</.test(l)) continue
    const t = l.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[[^\]]*\]\([^)]*\)/g, '')
    return t.slice(0, 120)
  }
  return ''
}

async function buildDescription(r) {
  if (cleanText(r.description)) return cleanText(r.description)
  const md = await fetchReadme(r.owner?.login || 'ttmouse', r.name || '')
  const s = extractSummary(md)
  if (s) return s
  return `${r.name || '项目'} 开源仓库`
}

async function fetchTopics(owner, repo) {
  try {
    const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/topics`, { headers: { Accept: 'application/vnd.github+json' } })
    if (!resp.ok) return []
    const data = await resp.json()
    return Array.isArray(data.names) ? data.names : []
  } catch { return [] }
}

function categorize(topics) {
  const t = new Set((topics || []).map(x => (x || '').toLowerCase()))
  if (t.has('ai') || t.has('gpt') || t.has('ml')) return 'ai'
  return 'tools'
}

async function buildRepoMeta(r) {
  const topics = await fetchTopics(r.owner?.login || 'ttmouse', r.name || '')
  const tech = []
  if (cleanText(r.language)) tech.push(r.language)
  for (const n of topics) tech.push(n)
  const category = categorize(topics)
  const highlights = []
  return { tech: Array.from(new Set(tech)).slice(0, 6), category, highlights }
}

// 筛选状态
const currentFilter = ref('all')
const displayLimit = ref(6) // 初始显示6个项目
const isLoading = ref(false) // 加载状态

const filteredProjects = computed(() => {
  if (currentFilter.value === 'all') {
    return projects.value
  }
  return projects.value.filter(project => project.category === currentFilter.value)
})

const displayedProjects = computed(() => {
  return filteredProjects.value.slice(0, displayLimit.value)
})

const hasMoreProjects = computed(() => {
  return filteredProjects.value.length > displayLimit.value
})

// 筛选方法
function filterCategory(category) {
  currentFilter.value = category
  displayLimit.value = 6 // 重置显示数量
}

// 显示更多项目
async function showMoreProjects() {
  isLoading.value = true

  // 模拟加载延迟，提供即时反馈
  await new Promise(resolve => setTimeout(resolve, 300))

  displayLimit.value += 3
  isLoading.value = false
}

onMounted(() => {
  loadGithubRepos()
})

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    'active': 'Online',
    'coming-soon': 'Coming Soon',
    'in-progress': 'In Progress',
    'maintenance': 'Maintenance'
  }
  return statusMap[status] || 'Coming Soon'
}

// 添加项目的工具方法
function addProject(project) {
  projects.value.push({
    id: project.id,
    title: project.title,
    description: project.description,
    category: project.category || 'tools',
    status: project.status || 'coming-soon',
    icon: project.icon || '',
    tech: project.tech || [],
    route: project.route,
    badge: project.badge,
    highlights: project.highlights || []
  })
}

// 移除项目的工具方法
function removeProject(projectId) {
  const index = projects.value.findIndex(p => p.id === projectId)
  if (index > -1) {
    projects.value.splice(index, 1)
  }
}

// 更新项目状态的工具方法
function updateProjectStatus(projectId, status) {
  const project = projects.value.find(p => p.id === projectId)
  if (project) {
    project.status = status
  }
}
</script>

<style scoped>
/* Portfolio page - Figma-style dark theme design */
.portfolio-container {
  min-height: 100vh;
  min-height: 100dvh;
  background: #0a0a0a;
  position: relative;
  padding: 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  padding-left: calc(24px + env(safe-area-inset-left));
  padding-right: calc(24px + env(safe-area-inset-right));
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow-x: hidden;
  color: #f5f5f7;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #667eea;
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  z-index: 1000;
  transition: top 0.3s ease;
}

.skip-link:focus {
  top: 6px;
}

.background-pattern {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: -1;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}


/* Contact Footer */
.contact-footer {
  margin-top: 80px;
  padding: 32px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.contact-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8e8e93;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s ease;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.contact-link:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.contact-icon {
  font-size: 16px;
}

.contact-text {
  font-weight: 500;
}

/* Section styles */
.section-title-area {
  margin-bottom: 24px;
  text-align: center;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 32px;
  letter-spacing: -0.5px;
  text-align: center;
}

.section-subtitle {
  font-size: 14px;
  color: #8e8e93;
  font-weight: 400;
  line-height: 1.4;
}

/* Projects section */
.projects-section {
  margin-top: 40px;
  margin-bottom: 60px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 32px;
  flex-wrap: wrap;
}

.section-controls {
  display: flex;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 4px;
  background: #242424;
  border-radius: 8px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-btn {
  padding: 6px 12px;
  background: transparent;
  color: #8e8e93;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.filter-btn.active {
  background: #242424;
  color: #ffffff;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* Projects grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

/* Project cards */
.project-card {
  position: relative;
  background: #1a1a1a;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 200px;
  will-change: transform, box-shadow;
}

.project-card:hover,
.project-card:focus-within {
  background: #222222;
  border-color: rgba(102, 126, 234, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.project-card:focus-within {
  outline: 2px solid rgba(102, 126, 234, 0.4);
  outline-offset: 2px;
}

.project-card.featured {
  background: linear-gradient(135deg, #1e3a8a 0%, #2a4858 100%);
  border-color: rgba(102, 126, 234, 0.3);
}

.coming-soon {
  opacity: 0.7;
  cursor: not-allowed;
}

.coming-soon:hover {
  transform: none;
  background: #242424;
}


.card-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.project-info {
  flex: 1;
}

.project-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 6px;
  letter-spacing: -0.2px;
  line-height: 1.3;
}

.project-description {
  font-size: 14px;
  color: #a0a0a0;
  line-height: 1.5;
  margin-bottom: 16px;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}

.highlight-tag {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.project-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.tech-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tech-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: rgba(102, 126, 234, 0.15);
  color: #a5b4fc;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}


.load-more {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #242424;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #8e8e93;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover {
  background: #2a2a2a;
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}

.load-more-btn svg {
  transition: transform 0.2s ease;
}

.load-more-btn:hover svg {
  transform: scale(1.1);
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-spinner {
  animation: spin 1s linear infinite;
  font-size: 14px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 支持用户的动画偏好设置 */
@media (prefers-reduced-motion: reduce) {
  .project-card,
  .icon-wrapper,
  .project-card:hover .icon-wrapper,
  .loading-spinner {
    transition: none;
    animation: none;
  }

  .loading-spinner {
    display: inline-block;
  }
}

/* Responsive design - Figma style breakpoints */
@media (max-width: 1200px) {
  .projects-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }

  .skills-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .portfolio-container {
    padding: 12px;
  }

  .projects-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .project-card {
    height: 180px;
  }

  .profile-name {
    font-size: 28px;
  }

  .filter-group {
    flex-wrap: wrap;
    justify-content: center;
  }

  .hero-stats {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .contact-links {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 400px) {
  .project-card {
    height: 160px;
  }

  .card-header {
    padding: 12px 12px 8px;
  }

  .icon-wrapper {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .card-content {
    padding: 0 12px 12px;
  }

  .project-title {
    font-size: 14px;
  }

  .project-description {
    font-size: 12px;
  }

  .card-actions {
    padding: 8px 12px 12px;
  }
}
</style>
