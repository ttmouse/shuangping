<template>
  <div class="projects-container">
    <div class="background-grid"></div>
    <div class="container">
      <header class="header">
        <div class="header-content">
          <div class="logo">
            <div class="logo-icon">📚</div>
            <div class="logo-text">
              <h1 class="title">项目中心</h1>
              <p class="subtitle">精选工具集合，助力高效学习与工作</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat">
              <span class="stat-number">{{ projects.length }}</span>
              <span class="stat-label">项目总数</span>
            </div>
            <div class="stat">
              <span class="stat-number">12</span>
              <span class="stat-label">分类</span>
            </div>
            <div class="stat">
              <span class="stat-number">99%</span>
              <span class="stat-label">好评率</span>
            </div>
          </div>
        </div>
      </header>

      <main class="projects-section">
        <div class="section-header">
          <div class="section-title-area">
            <h2 class="section-title">全部项目</h2>
            <p class="section-subtitle">探索我们精心打造的工具集合，每个项目都经过严格筛选和优化</p>
          </div>
          <div class="section-controls">
            <div class="filter-group">
              <button class="filter-btn active" @click="filterCategory('all')">全部</button>
              <button class="filter-btn" @click="filterCategory('tools')">工具</button>
              <button class="filter-btn" @click="filterCategory('learning')">学习</button>
              <button class="filter-btn" @click="filterCategory('productivity')">效率</button>
            </div>
          </div>
        </div>

        <div class="projects-grid">
          <!-- 双拼练习项目 -->
          <router-link to="/yunmu-practice" class="project-card featured">
            <div class="card-header">
              <div class="project-icon">
                <div class="icon-wrapper">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7V12C2 16.42 4.58 20 9 20.93C9.53 21 10.09 21 10.68 20.97C15.32 20.72 18 17.05 18 12V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
              <div class="card-badge">热门</div>
            </div>
            <div class="card-content">
              <div class="project-info">
                <h3 class="project-title">双拼练习</h3>
                <p class="project-description">专业的双拼输入法练习工具</p>
                <div class="project-meta">
                  <div class="tech-tags">
                    <span class="tech-tag">Vue 3</span>
                    <span class="tech-tag">Web</span>
                  </div>
                  <div class="project-status active">
                    <span class="status-dot"></span>
                    <span>在线</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <div class="action-group">
                <span class="action-icon">🎯</span>
                <span class="action-text">立即使用</span>
              </div>
            </div>
          </router-link>

          <!-- 写作练习项目 -->
          <router-link to="/writer" class="project-card">
            <div class="card-header">
              <div class="project-icon">
                <div class="icon-wrapper">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="card-content">
              <div class="project-info">
                <h3 class="project-title">写作练习</h3>
                <p class="project-description">双拼打字练习与写作训练</p>
                <div class="project-meta">
                  <div class="tech-tags">
                    <span class="tech-tag">Vue 3</span>
                    <span class="tech-tag">Text</span>
                  </div>
                  <div class="project-status active">
                    <span class="status-dot"></span>
                    <span>在线</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <div class="action-group">
                <span class="action-icon">✍️</span>
                <span class="action-text">开始练习</span>
              </div>
            </div>
          </router-link>

          <!-- 更多工具卡片模板 -->
          <div class="project-card coming-soon">
            <div class="card-header">
              <div class="project-icon">
                <div class="icon-wrapper">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 16V8C21 6.9 20.1 6 19 6H9C7.9 6 7 6.9 7 8V16C7 17.1 7.9 18 9 18H19C20.1 18 21 17.1 21 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M3 12H7M3 16H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M15 2V6M19 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
              <div class="card-badge">开发中</div>
            </div>
            <div class="card-content">
              <div class="project-info">
                <h3 class="project-title">项目管理</h3>
                <p class="project-description">任务管理与协作工具</p>
                <div class="project-meta">
                  <div class="tech-tags">
                    <span class="tech-tag">Planning</span>
                  </div>
                  <div class="project-status coming-soon">
                    <span class="status-dot"></span>
                    <span>即将上线</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <div class="action-group">
                <span class="action-icon">📅</span>
                <span class="action-text">敬请期待</span>
              </div>
            </div>
          </div>

          <!-- 额外的项目卡片示例 -->
          <div class="project-card coming-soon">
            <div class="card-header">
              <div class="project-icon">
                <div class="icon-wrapper">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22L2 12L12 2L22 12L12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 6V18M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
              <div class="card-badge">规划中</div>
            </div>
            <div class="card-content">
              <div class="project-info">
                <h3 class="project-title">数据分析</h3>
                <p class="project-description">智能数据可视化平台</p>
                <div class="project-meta">
                  <div class="tech-tags">
                    <span class="tech-tag">Analytics</span>
                  </div>
                  <div class="project-status coming-soon">
                    <span class="status-dot"></span>
                    <span>敬请期待</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <div class="action-group">
                <span class="action-icon">📊</span>
                <span class="action-text">敬请期待</span>
              </div>
            </div>
          </div>

          <!-- 更多空卡片，便于扩展 -->
          <div class="project-card coming-soon">
            <div class="card-header">
              <div class="project-icon">
                <div class="icon-wrapper">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="card-content">
              <div class="project-info">
                <h3 class="project-title">时间管理</h3>
                <p class="project-description">效率提升与时间追踪</p>
                <div class="project-meta">
                  <div class="tech-tags">
                    <span class="tech-tag">Productivity</span>
                  </div>
                  <div class="project-status coming-soon">
                    <span class="status-dot"></span>
                    <span>敬请期待</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <div class="action-group">
                <span class="action-icon">⏰</span>
                <span class="action-text">敬请期待</span>
              </div>
            </div>
          </div>

          <div class="project-card coming-soon">
            <div class="card-header">
              <div class="project-icon">
                <div class="icon-wrapper">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 12V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="card-content">
              <div class="project-info">
                <h3 class="project-title">自动化测试</h3>
                <p class="project-description">智能测试与质量保证</p>
                <div class="project-meta">
                  <div class="tech-tags">
                    <span class="tech-tag">Testing</span>
                  </div>
                  <div class="project-status coming-soon">
                    <span class="status-dot"></span>
                    <span>敬请期待</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <div class="action-group">
                <span class="action-icon">🔧</span>
                <span class="action-text">敬请期待</span>
              </div>
            </div>
          </div>

          <div class="project-card coming-soon">
            <div class="card-header">
              <div class="project-icon">
                <div class="icon-wrapper">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H9L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M13 2L3 14H9L13 2Z" transform="translate(4, 12)" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="card-content">
              <div class="project-info">
                <h3 class="project-title">快捷工具集</h3>
                <p class="project-description">常用小工具集合</p>
                <div class="project-meta">
                  <div class="tech-tags">
                    <span class="tech-tag">Utilities</span>
                  </div>
                  <div class="project-status coming-soon">
                    <span class="status-dot"></span>
                    <span>敬请期待</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <div class="action-group">
                <span class="action-icon">🛠️</span>
                <span class="action-text">敬请期待</span>
              </div>
            </div>
          </div>

          <div class="project-card coming-soon">
            <div class="card-header">
              <div class="project-icon">
                <div class="icon-wrapper">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 21V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V21M16 21H10M16 21H20M8 21H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="card-content">
              <div class="project-info">
                <h3 class="project-title">API 管理器</h3>
                <p class="project-description">接口测试与文档工具</p>
                <div class="project-meta">
                  <div class="tech-tags">
                    <span class="tech-tag">API</span>
                  </div>
                  <div class="project-status coming-soon">
                    <span class="status-dot"></span>
                    <span>敬请期待</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <div class="action-group">
                <span class="action-icon">🔌</span>
                <span class="action-text">敬请期待</span>
              </div>
            </div>
          </div>

          <div class="project-card coming-soon">
            <div class="card-header">
              <div class="project-icon">
                <div class="icon-wrapper">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="card-content">
              <div class="project-info">
                <h3 class="project-title">团队协作</h3>
                <p class="project-description">实时协作与沟通工具</p>
                <div class="project-meta">
                  <div class="tech-tags">
                    <span class="tech-tag">Team</span>
                  </div>
                  <div class="project-status coming-soon">
                    <span class="status-dot"></span>
                    <span>敬请期待</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <div class="action-group">
                <span class="action-icon">👥</span>
                <span class="action-text">敬请期待</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多按钮 -->
        <div class="load-more" v-if="projects.length > 12">
          <button class="load-more-btn">
            <span>加载更多项目</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 项目数据
const projects = ref([
  {
    id: 'yunmu-practice',
    title: '双拼练习',
    description: '专业的双拼输入法练习工具',
    category: 'learning',
    status: 'active',
    icon: '🛡️',
    tech: ['Vue 3', 'Web'],
    route: '/yunmu-practice'
  },
  {
    id: 'writer',
    title: '写作练习',
    description: '双拼打字练习与写作训练',
    category: 'learning',
    status: 'active',
    icon: '✍️',
    tech: ['Vue 3', 'Text'],
    route: '/writer'
  },
  {
    id: 'project-management',
    title: '项目管理',
    description: '任务管理与协作工具',
    category: 'productivity',
    status: 'coming-soon',
    icon: '📅',
    tech: ['Planning'],
    badge: '开发中'
  },
  {
    id: 'data-analysis',
    title: '数据分析',
    description: '智能数据可视化平台',
    category: 'tools',
    status: 'coming-soon',
    icon: '📊',
    tech: ['Analytics'],
    badge: '规划中'
  },
  {
    id: 'time-management',
    title: '时间管理',
    description: '效率提升与时间追踪',
    category: 'productivity',
    status: 'coming-soon',
    icon: '⏰',
    tech: ['Productivity']
  },
  {
    id: 'automation-testing',
    title: '自动化测试',
    description: '智能测试与质量保证',
    category: 'tools',
    status: 'coming-soon',
    icon: '🔧',
    tech: ['Testing']
  },
  {
    id: 'utilities',
    title: '快捷工具集',
    description: '常用小工具集合',
    category: 'tools',
    status: 'coming-soon',
    icon: '🛠️',
    tech: ['Utilities']
  },
  {
    id: 'api-manager',
    title: 'API 管理器',
    description: '接口测试与文档工具',
    category: 'tools',
    status: 'coming-soon',
    icon: '🔌',
    tech: ['API']
  },
  {
    id: 'team-collaboration',
    title: '团队协作',
    description: '实时协作与沟通工具',
    category: 'productivity',
    status: 'coming-soon',
    icon: '👥',
    tech: ['Team']
  }
])

// 筛选状态
const currentFilter = ref('all')
const filteredProjects = computed(() => {
  if (currentFilter.value === 'all') {
    return projects.value
  }
  return projects.value.filter(project => project.category === currentFilter.value)
})

// 筛选方法
function filterCategory(category) {
  currentFilter.value = category
}

// 添加项目的工具方法
function addProject(project) {
  projects.value.push({
    id: project.id,
    title: project.title,
    description: project.description,
    category: project.category || 'tools',
    status: project.status || 'coming-soon',
    icon: project.icon || '📦',
    tech: project.tech || [],
    route: project.route,
    badge: project.badge
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
/* Figma-style dark theme design */
.projects-container {
  min-height: 100vh;
  background: #0d0d0d;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow-x: hidden;
  color: #e5e5e5;
}

.background-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

.container {
  background: #1a1a1a;
  border-radius: 16px;
  padding: 48px 32px;
  max-width: 1400px;
  width: 100%;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Figma-style header */
.header {
  margin-bottom: 40px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 8px rgba(102, 126, 234, 0.3));
}

.logo-text {
  text-align: left;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 14px;
  color: #8e8e93;
  font-weight: 400;
  line-height: 1.4;
}

.header-stats {
  display: flex;
  gap: 32px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
}

.stat-label {
  font-size: 12px;
  color: #8e8e93;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Projects section with Figma styling */
.projects-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 32px;
  flex-wrap: wrap;
}

.section-title-area {
  flex: 1;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
}

.section-subtitle {
  font-size: 14px;
  color: #8e8e93;
  font-weight: 400;
  line-height: 1.4;
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

/* Figma-style card grid - 4 columns on desktop */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* Compact card design */
.project-card {
  position: relative;
  background: #242424;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 280px;
}

.project-card:hover {
  background: #2a2a2a;
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
}

.project-card.featured {
  background: linear-gradient(135deg, #1e3a8a 0%, #2a4858 100%);
  border-color: rgba(102, 126, 234, 0.3);
}

.project-card.featured:hover {
  background: linear-gradient(135deg, #1e3a8a 0%, #2a4858 100%);
}

.coming-soon {
  opacity: 0.7;
  cursor: not-allowed;
}

.coming-soon:hover {
  transform: none;
  background: #242424;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 16px 12px;
  gap: 12px;
}

.project-icon {
  position: relative;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  background: #333333;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.project-card:hover .icon-wrapper {
  background: #404040;
  transform: scale(1.05);
}

.icon-wrapper svg {
  width: 24px;
  height: 24px;
  color: #667eea;
  transition: color 0.2s ease;
}

.project-card.featured .icon-wrapper {
  background: rgba(102, 126, 234, 0.2);
}

.card-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #667eea;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  line-height: 1;
}

.card-content {
  flex: 1;
  padding: 0 16px 16px;
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
  font-size: 13px;
  color: #8e8e93;
  line-height: 1.4;
  margin-bottom: 12px;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.project-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #8e8e93;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: blink 2s infinite;
}

.project-status.active .status-dot {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

.project-status.active {
  color: #10b981;
}

.project-status.coming-soon .status-dot {
  background: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
}

.project-status.coming-soon {
  color: #f59e0b;
}

.card-actions {
  padding: 12px 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.action-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #8e8e93;
  transition: color 0.2s ease;
}

.action-icon {
  font-size: 16px;
}

.project-card:not(.coming-soon):hover .action-group {
  color: #667eea;
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

/* Responsive design - Figma style breakpoints */
@media (max-width: 1200px) {
  .projects-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .container {
    padding: 32px 24px;
  }
}

@media (max-width: 900px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .header-content {
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }

  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }

  .logo {
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .projects-container {
    padding: 12px;
  }

  .container {
    padding: 24px 16px;
  }

  .projects-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .project-card {
    height: 240px;
  }

  .title {
    font-size: 24px;
  }

  .filter-group {
    flex-wrap: wrap;
    justify-content: center;
  }

  .header-stats {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}

@media (max-width: 400px) {
  .project-card {
    height: 220px;
  }

  .card-header {
    padding: 12px 12px 8px;
  }

  .icon-wrapper {
    width: 32px;
    height: 32px;
  }

  .icon-wrapper svg {
    width: 20px;
    height: 20px;
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