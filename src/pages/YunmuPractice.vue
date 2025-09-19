<template>
  <div class="app" data-v-01350f3e>
    <TopStatusBar />

    <div class="pageCenter">
      <div class="tipsTextContent" data-v-01350f3e>
        <h1 data-v-01350f3e>双拼在线练习软件</h1>
        <h2 data-v-01350f3e>为快速入门双拼打字而生，提供双拼声母、韵母专项练习法。</h2>
      </div>

      <div class="mask" :class="{ active: !started }" @click="start">
        <p>键盘按任意键<br/>或点击当前页面开始练习</p>
      </div>

      <div class="operation" />

      <div class="cardsWrap">
        <div class="cards">
          <div
            v-for="(f, idx) in upcoming"
            :key="idx + '-' + f"
            class="card"
            :class="{ current: idx === currentIndex, done: idx < currentIndex }"
          >
            <div class="hz">{{ f }}</div>
            <div class="keys">
              <span
                v-for="(l,i) in lettersForFinal(f)"
                :key="i + '-' + l"
                class="letter"
                :class="{ done: idx < currentIndex }"
              >{{ l }}</span>
            </div>
          </div>
        </div>
      </div>

      <Keyboard :handle="onPress" />

      <div class="footerSpace" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import Keyboard from '../components/Keyboard.vue'
import TopStatusBar from '../components/TopStatusBar.vue'
import { finalToKeyCodes, keyByCode } from '../data/xiaohe.js'
import { useSettingsStore } from '../stores/settings.js'
import { useSessionStore } from '../stores/session.js'

const settings = useSettingsStore()
const session = useSessionStore()

onMounted(() => {
  settings.load()
  session.load()
  if (!session.started) {
    // 等待用户开始
  } else if (!session.currentTarget) {
    session.nextTarget()
  }
  // 启动时任意按键开始
  const handler = (e) => {
    if (!session.started) {
      e.preventDefault()
      start()
    }
    window.removeEventListener('keydown', handler)
  }
  window.addEventListener('keydown', handler)
})

const target = computed(() => session.currentTarget)
const upcoming = computed(() => session.upcoming)
const currentIndex = computed(() => session.pos)

function codeToLetter(c) { return (c || '').replace('Key','') }
function lettersForFinal(final) {
  const codes = Array.from(finalToKeyCodes.get(final) || [])
  const letters = codes.map(c => keyByCode.get(c)?.label || codeToLetter(c))
  // 去重，保持顺序
  return Array.from(new Set(letters))
}
const started = computed(() => session.started)

function start() {
  session.start()
}

function onPress(code) {
  if (!session.started) return { correct: false }
  const res = session.submitKeyCode(code)
  return res
}
</script>

<style scoped>
.pageCenter { min-height: calc(100vh - 52px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 12px; }
/* 卡片样式与 Writer 对齐 */
.cardsWrap { width: 1040px; max-width: 96%; margin: 10px auto 10px; }
.cards { display: flex; gap: 10px; justify-content: center; }
.card { width: 96px; height: 124px; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 10px; box-shadow: 0 2px 0 rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 6px; }
.card.current { border-color: var(--theme-menu-hover-color); box-shadow: 0 0 0 2px #35e2b733 inset, 0 0 10px #35e2b733; }
.card.done { opacity: 0.65; }
.card .hz { font-size: 28px; font-weight: 700; color: var(--theme-main-text-color); line-height: 1; }
.card .keys { font-size: 22px; color: #54709536; letter-spacing: 1px; }
.card .keys .letter { margin: 0 0px; }
.card .keys .letter.done { color: var(--theme-menu-text-color); font-weight: 700; }
</style>
