<template>
  <div class="schemeSelector">
    <label>双拼方案：</label>
    <div class="dropdown" @click="toggleMenu">
      <span class="dropdownLabel">{{ currentScheme.name }}</span>
      <span class="caret">▾</span>
      <div v-if="showMenu" class="ddMenu" @click.stop>
        <div
          v-for="scheme in schemes"
          :key="scheme.id"
          class="menuItem"
          :class="{ active: scheme.id === currentSchemeId }"
          @click="selectScheme(scheme.id)"
        >
          <span>{{ scheme.name }}</span>
          <span v-if="scheme.id === currentSchemeId" class="check">✓</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettingsStore } from '../stores/settings.js'

// 导入所有双拼方案
import { XIAOHE_SCHEME } from '../data/schemes/xiaohe.js'
import { MICROSOFT_SCHEME } from '../data/schemes/microsoft.js'
import { SOGOU_SCHEME } from '../data/schemes/sogou.js'
import { ZIRAN_SCHEME } from '../data/schemes/ziran.js'
import { ZIGUANG_SCHEME } from '../data/schemes/ziguang.js'
import { JIAJIA_SCHEME } from '../data/schemes/jiajia.js'
import { GUOJI_SCHEME } from '../data/schemes/guoji.js'
import { ABC_SCHEME } from '../data/schemes/abc.js'

const settings = useSettingsStore()
const showMenu = ref(false)

// 所有可用的双拼方案
const schemes = [
  XIAOHE_SCHEME,
  MICROSOFT_SCHEME,
  SOGOU_SCHEME,
  ZIRAN_SCHEME,
  ZIGUANG_SCHEME,
  JIAJIA_SCHEME,
  GUOJI_SCHEME,
  ABC_SCHEME
]

const currentSchemeId = computed(() => settings.currentScheme || 'xiaohe')
const currentScheme = computed(() =>
  schemes.find(s => s.id === currentSchemeId.value) || XIAOHE_SCHEME
)

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function selectScheme(schemeId) {
  settings.setCurrentScheme(schemeId)
  showMenu.value = false
}

// 点击外部关闭菜单
document.addEventListener('click', (e) => {
  if (!e.target.closest('.schemeSelector')) {
    showMenu.value = false
  }
})
</script>

<style scoped>
.schemeSelector {
  display: flex;
  align-items: center;
  gap: 6px;
}

.schemeSelector label {
  color: var(--theme-text-color);
  font-size: 12px;
}

.dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 120px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-text-color);
  cursor: pointer;
}

.dropdownLabel {
  flex: 1;
  text-align: left;
  font-size: 12px;
}

.caret {
  font-size: 10px;
  color: var(--theme-text-color);
  opacity: 0.7;
}

.ddMenu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 150px;
  max-height: 200px;
  overflow: auto;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.18);
  padding: 6px;
  z-index: 20;
  display: block;
}

.menuItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menuItem:hover {
  background: rgba(53,226,183,0.08);
}

.menuItem.active {
  background: rgba(53,226,183,0.15);
  color: var(--theme-menu-hover-color);
}

.check {
  color: var(--theme-menu-hover-color);
  font-weight: bold;
}
</style>