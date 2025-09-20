<template>
  <div class="app" data-v-01350f3e>
    <TopStatusBar />

    <div class="pageCenter">
      <div class="tipsTextContent" data-v-01350f3e>
        <h1 data-v-01350f3e>双拼在线练习软件</h1>
        <h2 data-v-01350f3e>为快速入门双拼打字而生，提供双拼声母、韵母专项练习法。</h2>
      </div>

      <div class="mask" :class="{ active: !started && !selectMode }" @click="start">
        <p>键盘按任意键<br/>或点击当前页面开始练习</p>
      </div>

      <div class="operate">
        <div class="select">
          <label>范围：</label>
          <select :value="session.rangeId" @change="onRange">
            <option v-for="r in rangesDisplay" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>
        <label><input type="checkbox" :checked="settings.yunmuShowShuangpin" @change="e=>{ settings.yunmuShowShuangpin = !!e.target.checked; settings.save() }"/> 双拼编码显示</label>
        <!-- 自选模式：开始与重新选择的切换 -->
        <template v-if="session.rangeId === 'custom'">
          <button v-if="!session.started" class="el-button el-button--small" @click="start">开始</button>
          <button v-else class="el-button el-button--small" @click="reselect">重新选择</button>
          <button class="el-button el-button--small" @click="onClearSelected" :disabled="!session.selectedKeyCodes.length">清空选择</button>
        </template>
      </div>

      <div class="cardsWrap">
        <div class="cards">
          <div
            v-for="(f, idx) in upcoming"
            :key="idx + '-' + f"
            class="card"
            :class="{
              current: idx === currentIndex,
              doneLatest: idx === currentIndex - 1,
              donePast: idx < currentIndex - 1
            }"
          >
            <div class="hz">{{ f }}</div>
            <div class="keys" v-if="settings.yunmuShowShuangpin">
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

      <Keyboard v-if="!selectMode" :handle="onPress" />
      <Keyboard v-else :selectable="true" :selected-codes="session.selectedKeyCodes" :on-toggle="onToggleKey" />

      <div class="footerSpace" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import Keyboard from '../components/Keyboard.vue'
import TopStatusBar from '../components/TopStatusBar.vue'
import { finalToKeyCodes, keyByCode, ranges } from '../data/xiaohe.js'
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
      // 自选模式下不自动启动，等待点击“开始”
      if (session.rangeId === 'custom') return
      e.preventDefault()
      start()
    }
    if (session.started) window.removeEventListener('keydown', handler)
  }
  window.addEventListener('keydown', handler)
})

const target = computed(() => session.currentTarget)
const upcoming = computed(() => session.upcoming)
const currentIndex = computed(() => session.pos)
const rangesDisplay = [
  ...['row1','row2','row3','all'].map(id => ranges.find(r => r.id === id)).filter(Boolean),
  { id: 'custom', name: '自选韵母' }
]

function codeToLetter(c) { return (c || '').replace('Key','') }
function lettersForFinal(final) {
  const codes = Array.from(finalToKeyCodes.get(final) || [])
  const letters = codes.map(c => keyByCode.get(c)?.label || codeToLetter(c))
  // 去重，保持顺序
  return Array.from(new Set(letters))
}
const started = computed(() => session.started)
const selectMode = computed(() => session.rangeId === 'custom' && !session.started)

function start() {
  if (session.rangeId === 'custom') {
    if (!session.selectedKeyCodes.length) {
      alert('请先勾选至少一个韵母键')
      return
    }
  }
  session.start()
}

function onPress(code) {
  if (!session.started) return { correct: false }
  const res = session.submitKeyCode(code)
  return res
}

function onRange(e) {
  session.setRange(e.target.value)
}

function onToggleKey(code) {
  session.toggleKey(code)
}

function onClearSelected() {
  // 清空并进入选择模式
  session.clearSelected()
  if (session.started) session.reset()
  session.setRange('custom')
}

function reselect() {
  // 退出练习，回到自选勾选模式
  session.reset()
}
</script>

<style scoped>
.pageCenter { min-height: calc(100vh - 52px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 12px; }
.operate { display: flex; gap: 10px; align-items: center; padding: 10px 20px; }
.operate .select select { padding: 4px 8px; border-radius: 6px; border: 1px solid var(--theme-border-color); background: var(--theme-background-light-color); color: var(--theme-text-color); }
.cardsWrap { width: 1040px; max-width: 96%; margin: 10px auto 10px; }
.cards { display: flex; gap: 10px; justify-content: center; perspective: 900px; }
.card { position: relative; width: 96px; height: 124px; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 10px; box-shadow: 0 2px 0 rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 6px; transform-style: preserve-3d; overflow: hidden; }
.card.current { border-color: var(--theme-menu-hover-color); box-shadow: 0 0 0 2px #35e2b733 inset, 0 0 10px #35e2b733; }
.card.doneLatest {
  transform-origin: bottom center;
  animation:
    cardHit 0.3s ease-out,
    cardFall 0.48s cubic-bezier(0.22, 0.62, 0.2, 0.95) 0.3s forwards;
  will-change: transform, opacity, box-shadow;
}
.card.doneLatest::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 30px;
  height: 30px;
  transform: translate(-50%, -50%) scale(0.3);
  border: 2px solid #52c41a;
  border-radius: 50%;
  opacity: 0.8;
  pointer-events: none;
  animation: cardRipple 0.3s ease-out;
}
.card.doneLatest::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  box-shadow: 0 0 0 0 rgba(82,196,26,0.0), 0 0 0 rgba(82,196,26,0.0);
  opacity: 0;
  pointer-events: none;
  animation: cardHitGlow 0.22s ease-out;
}
.card.donePast { opacity: 0; visibility: hidden; pointer-events: none; }
@keyframes cardFall {
  0%   { transform: rotateX(0deg) translateY(0); opacity: 1; }
  100% { transform: rotateX(88deg) translateY(26px) scale(0.96); opacity: 0; visibility: hidden; }
}
.card .hz { font-size: 28px; font-weight: 700; color: var(--theme-main-text-color); line-height: 1; }
.card .keys { font-size: 22px; color: #54709536; letter-spacing: 1px; }
.card .keys .letter { margin: 0 0px; }
.card .keys .letter.done { color: var(--theme-menu-text-color); font-weight: 700; }
</style>
@keyframes cardHit {
  0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(82,196,26,0.0), 0 0 0 rgba(0,0,0,0); }
  60%  { transform: scale(1.08); box-shadow: 0 0 0 2px rgba(82,196,26,0.55) inset, 0 0 18px rgba(82,196,26,0.55); }
  100% { transform: scale(1); box-shadow: 0 0 0 2px rgba(82,196,26,0.30) inset, 0 4px 12px rgba(0,0,0,0.10); }
}
@keyframes cardHitGlow {
  0%   { opacity: 0; box-shadow: 0 0 0 0 rgba(82,196,26,0.0), 0 0 0 rgba(82,196,26,0.0); }
  50%  { opacity: 1; box-shadow: 0 0 0 2px rgba(82,196,26,0.65) inset, 0 0 24px rgba(82,196,26,0.55); }
  100% { opacity: 0; box-shadow: 0 0 0 0 rgba(82,196,26,0.0), 0 0 0 rgba(82,196,26,0.0); }
}
@keyframes cardRipple {
  0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
}
