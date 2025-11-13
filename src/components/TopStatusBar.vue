<template>
  <div class="topStatus">
    <div class="left">
      <button
        class="modeBtn"
        :class="{ active: route.name === 'home' }"
        @click="go('/')"
        title="首页"
      >首页</button>
      <button
        class="modeBtn"
        :class="{ active: route.name === 'yunmu-practice' }"
        @click="go('/yunmu-practice')"
        title="声母韵母练习"
      >声母韵母练习</button>
      <button
        class="modeBtn"
        :class="{ active: route.name === 'writer' }"
        @click="go('/writer')"
        title="双拼打字练习"
      >双拼打字练习</button>
    </div>
    <div class="right">
      <label class="themeToggle" title="明暗模式">
        <input type="checkbox" :checked="isDark" @change="toggleTheme" />
        <span>{{ isDark ? '暗' : '明' }}</span>
      </label>
      <SoundSelector />
    </div>
  </div>
  <div class="topSpacer" />
  <!-- spacer to avoid overlap; keeps bar floating without pushing layout -->
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings.js'
import SoundSelector from './SoundSelector.vue'

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()

const isDark = computed(() => settings.theme === 'dark')
function toggleTheme() { settings.toggleTheme() }
function go(path) { if (route.path !== path) router.push(path) }
</script>

<style scoped>
.topStatus {
  position: fixed;
  inset: 0 0 auto 0;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--theme-background-light-color);
  border-bottom: 1px solid var(--theme-border-color);
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  z-index: 30;
}
.topSpacer { height: 52px; }
.left { display: flex; gap: 8px; align-items: center; }
.right { display: flex; gap: 12px; align-items: center; }
.modeBtn {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-menu-text-color);
  cursor: pointer;
}
.modeBtn.active {
  border-color: var(--theme-menu-hover-color);
  box-shadow: 0 0 0 2px #35e2b733 inset;
}
.modeBtn:hover { color: var(--theme-menu-hover-color); }
.themeToggle { display: inline-flex; gap: 6px; align-items: center; color: var(--theme-text-color); font-size: 12px; }
.themeToggle input { width: 14px; height: 14px; }
</style>

