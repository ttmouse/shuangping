<template>
  <div class="topStatus">
    <div class="left">
      <button
        class="modeBtn"
        :class="{ active: route.name === 'projects' }"
        @click="go('/projects')"
        title="首页"
        data-nav
      >首页</button>
      <button
        class="modeBtn"
        :class="{ active: route.name === 'practice-modes' }"
        @click="go('/practice-modes')"
        title="常规打字练习"
        data-nav
      >打字练习</button>
      <button
        class="modeBtn"
        :class="{ active: route.name === 'yunmu-practice' }"
        @click="go('/yunmu-practice')"
        title="声母韵母练习"
        data-nav
      >声母韵母练习</button>
      <button
        class="modeBtn"
        :class="{ active: route.name === 'writer' }"
        @click="go('/writer')"
        title="双拼打字练习"
        data-nav
      >双拼打字练习</button>
      <button
        class="modeBtn"
        :class="{ active: route.name === 'statistics' }"
        @click="go('/statistics')"
        title="练习统计"
        data-nav
      >
        <svg class="btnIcon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 13V8"/><path d="M8 13V4"/><path d="M13 13V6"/></svg>
        统计
      </button>
      <button
        class="modeBtn"
        :class="{ active: route.name === 'progress' }"
        @click="go('/progress')"
        title="学习进度"
        data-nav
      >
        <svg class="btnIcon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/></svg>
        进度
      </button>
      <button
        class="modeBtn"
        :class="{ active: route.name === 'leaderboard' }"
        @click="go('/leaderboard')"
        title="排行榜"
        data-nav
      >
        <svg class="btnIcon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h6v4a3 3 0 0 1-6 0V3z"/><path d="M5 4H3v1a2.5 2.5 0 0 0 2.5 2.5"/><path d="M11 4h2v1a2.5 2.5 0 0 1-2.5 2.5"/><path d="M8 10v2"/><path d="M6 13h4"/></svg>
        排行
      </button>
    </div>
    <div class="right">
      <div class="accuracy" v-if="session.totalAttempts > 0" title="正确率">
        <span class="acc-value">{{ session.accuracy }}%</span>
        <span class="acc-label">正确率</span>
      </div>
      <select
        v-if="route.name === 'practice-modes'"
        class="gradeSelect"
        :value="settings.enGrade"
        @change="setEnGrade"
        title="英文词库难度"
      >
        <option v-for="g in EN_GRADES" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
      <button class="iconBtn" :title="isDark ? '切换到明亮模式' : '切换到暗色模式'" @click="toggleTheme">
        <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
      <div class="settingsWrap">
        <button
          class="iconBtn"
          title="设置"
          :class="{ active: showSettings }"
          @click="showSettings = !showSettings"
          data-nav
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
        <div v-if="showSettings" class="settingsPop">
          <div class="setRow">
            <span class="setLabel">掌握阈值</span>
            <span class="setCtrl">
              <input
                type="number"
                :value="settings.enMasteryMs"
                min="100"
                max="3000"
                step="100"
                @change="setMasteryMs"
              />
              <span class="setUnit">ms/字母</span>
            </span>
          </div>
          <div class="setRow">
            <span class="setLabel" title="平均每字母超过该值（即使无错）→ 视为掌握不好">慢词阈值</span>
            <span class="setCtrl">
              <input
                type="number"
                :value="settings.enSlowMs"
                min="200"
                max="5000"
                step="100"
                @change="setSlowMs"
              />
              <span class="setUnit">ms/字母</span>
            </span>
          </div>
          <label class="setRow">
            <span class="setLabel">卡片隐藏字母</span>
            <input type="checkbox" :checked="settings.cardHideLetters" @change="settings.toggleCardHideLetters()" />
          </label>
          <label class="setRow">
            <span class="setLabel">盲打模式</span>
            <input type="checkbox" :checked="settings.blindMode" @change="settings.toggleBlindMode()" />
          </label>
          <label class="setRow">
            <span class="setLabel">音效</span>
            <input type="checkbox" :checked="settings.sound" @change="settings.toggleSound()" />
          </label>
          <div class="setRow setRowSound">
            <span class="setLabel">正确音效</span>
            <select :value="settings.soundOkFile" @change="onSelectSound">
              <option v-for="n in soundOptions" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="topSpacer" />
  <!-- spacer to avoid overlap; keeps bar floating without pushing layout -->
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings.js'
import { useSessionStore } from '../stores/session.js'
import { setSoundURLs, loadCustomSounds } from '../utils/sound.js'

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()
const session = useSessionStore()

// 英文词库难度选项
const EN_GRADES = [
  { id: 'all', name: '全部词库' },
  { id: 'g4', name: '四年级' },
  { id: 'g5', name: '五年级' },
  { id: 'g6', name: '六年级' },
]

const isDark = computed(() => settings.theme === 'dark')
const showSettings = ref(false)
const soundOptions = ref([])

function toggleTheme() { settings.toggleTheme() }
function setMasteryMs(e) { settings.setEnMasteryMs(e.target.value) }
function setSlowMs(e) { settings.setEnSlowMs(e.target.value) }
function setEnGrade(e) { settings.setEnGrade(e.target.value) }
function go(path) { if (route.path !== path) router.push(path) }

// 正确音效选择（移入设置面板）
async function loadSounds() {
  await settings.loadSoundList()
  soundOptions.value = settings.soundList
  if (!settings.soundOkFile && soundOptions.value.length > 0) {
    settings.setOkSoundFile(soundOptions.value[0])
  }
  applySound()
}
function applySound() {
  if (settings.soundOkFile) {
    setSoundURLs({ ok: `/sounds/${settings.soundOkFile}`, bad: '/sounds/cuowu.mp3' })
  } else {
    setSoundURLs({ ok: '/sounds/ting.mp3', bad: '/sounds/cuowu.mp3' })
  }
  loadCustomSounds().catch(() => {})
}
function onSelectSound(e) {
  settings.setOkSoundFile(e.target.value)
  applySound()
}

// 点击设置面板外部时关闭
function onDocClick(e) {
  if (!showSettings.value) return
  if (e.target.closest('.settingsWrap')) return
  showSettings.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  loadSounds()
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.topStatus {
  position: fixed;
  inset: 0 0 auto 0;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--theme-background-light-color);
  border-bottom: 1px solid var(--theme-border-color);
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  z-index: 30;
}
.topSpacer { height: 52px; }
.left {
  display: flex;
  gap: 8px;
  align-items: center;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.left::-webkit-scrollbar { display: none; }
.right { display: flex; gap: 10px; align-items: center; flex: 0 0 auto; }
.modeBtn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-menu-text-color);
  cursor: pointer;
  white-space: nowrap;
  flex: 0 0 auto;
}
.modeBtn.active {
  border-color: var(--theme-menu-hover-color);
  box-shadow: 0 0 0 2px #35e2b733 inset;
}
.modeBtn:hover { color: var(--theme-menu-hover-color); }
.btnIcon { width: 15px; height: 15px; flex: 0 0 auto; }
.gradeSelect {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-menu-text-color);
  font-size: 12px;
  cursor: pointer;
  outline: none;
}
.gradeSelect:focus {
  border-color: var(--theme-menu-hover-color);
}
.accuracy { display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: var(--theme-background-color); border-radius: 6px; font-size: 12px; }
.acc-value { font-weight: 700; color: #67c23a; }
.acc-label { color: var(--theme-text-color); }

/* 设置图标 + 弹出面板 */
.settingsWrap { position: relative; }
.iconBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-menu-text-color);
  cursor: pointer;
  transition: border-color .15s, color .15s, transform .2s;
}
.iconBtn svg { width: 18px; height: 18px; }
.iconBtn:hover, .iconBtn.active {
  border-color: var(--theme-menu-hover-color);
  color: var(--theme-menu-hover-color);
}
.iconBtn.active { transform: rotate(40deg); }
.settingsPop {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 70;
  width: 250px;
  padding: 12px;
  background: var(--theme-background-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.setRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  color: var(--theme-text-color);
  cursor: pointer;
}
.setLabel { flex: 0 0 auto; }
.setCtrl { display: inline-flex; align-items: center; gap: 6px; }
.setCtrl input[type="number"] {
  width: 60px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-main-text-color);
  font-size: 13px;
  text-align: center;
  outline: none;
}
.setCtrl input[type="number"]:focus { border-color: var(--theme-menu-hover-color); }
.setUnit { font-size: 11px; opacity: 0.7; }
.setRow input[type="checkbox"] { width: 15px; height: 15px; accent-color: var(--theme-menu-hover-color); cursor: pointer; }
.setRowSound select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-text-color);
  font-size: 12px;
  cursor: pointer;
  outline: none;
  max-width: 120px;
}
.setRowSound select:focus { border-color: var(--theme-menu-hover-color); }

@media (max-width: 520px) {
  .topStatus { padding: 8px 8px; }
  .accuracy { display: none; }
  .gradeSelect { max-width: 90px; }
}
</style>
