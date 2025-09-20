<template>
  <div class="app" data-v-01350f3e>
    <TopStatusBar />

    <div class="pageCenter">
      <div class="tipsTextContent" data-v-01350f3e>
        <h1 data-v-01350f3e>双拼在线练习软件</h1>
        <h2 data-v-01350f3e>为快速入门双拼打字而生，提供双拼声母、韵母专项练习法。</h2>
      </div>

      <div class="operate">
        <div class="select">
          <label>文案：</label>
          <div class="dropdown" @click="toggleMenu">
            <span class="dropdownLabel">{{ currentCorpusTitle }}</span>
            <span class="caret">▾</span>
            <div v-if="showMenu" class="ddMenu" @click.stop>
              <div
                v-for="c in corpora"
                :key="c.id"
                class="menuItem"
                @click="selectCorpus(c.id)"
              >
                <span class="title">{{ c.title }}</span>
                <button
                  v-if="c.id.startsWith('custom-')"
                  class="delBtn"
                  title="删除"
                  @click.stop="deleteDoc(c.id)"
                >🗑️</button>
              </div>
            </div>
          </div>
        </div>
        <button class="el-button el-button--small" @click="openImport">导入文本</button>
        <label><input type="checkbox" :checked="writer.showPinyin" @change="e=>writer.setShowPinyin(e.target.checked)"/> 拼音显示</label>
        <label><input type="checkbox" :checked="writer.showShuangpin" @change="e=>writer.setShowShuangpin(e.target.checked)"/> 双拼编码显示</label>
        <label><input type="checkbox" :checked="writer.hideKeyboard" @change="e=>writer.setHideKeyboard(e.target.checked)"/> 隐藏键盘</label>
      </div>

      <div class="cardsWrap">
        <div class="cards">
          <div
            v-for="(it, idx) in cardItems"
            :key="it.id"
            class="card"
            :class="{
              current: idx === currentInLine,
              doneLatest: idx === currentInLine - 1,
              donePast: idx < currentInLine - 1
            }"
          >
            <div class="py" v-if="writer.showPinyin">{{ it.pinyin }}</div>
            <div class="hz">{{ it.ch }}</div>
            <div class="keys">
              <span
                v-for="(c,i) in it.seq"
                :key="i"
                class="letter"
                :class="letterClass(idx, i)"
              >{{ codeToLetter(c) }}</span>
            </div>
          </div>
        </div>
      </div>

      <Keyboard v-if="!writer.hideKeyboard" :handle="onPress" />

      <div class="footerSpace" />
    </div>

    <!-- 导入文本弹窗 -->
    <div v-if="showImport" class="modalMask" @click.self="closeImport">
      <div class="modal">
        <h3>导入自定义中文文本</h3>
        <textarea
          v-model="importText"
          placeholder="粘贴中文文本（仅中文会被用于练习，最多 1000 字）"
        />
        <div class="modalFooter">
          <div class="tip">中文计数：{{ hanCount }}/1000</div>
          <div class="actions">
            <button class="el-button el-button--small" @click="closeImport">取消</button>
            <button class="el-button el-button--small primary" :disabled="hanCount===0" @click="confirmImport">生成练习</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 练习完成浮层（仅自定义/内置文案） -->
    <div v-if="writer.completed" class="modalMask" @click.self="restart">
      <div class="modal">
        <h3>练习完成</h3>
        <p>已完成当前文案的全部文字练习。</p>
        <div class="modalFooter">
          <div />
          <div class="actions">
            <button class="el-button el-button--small primary" @click="restart">重新开始</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import { useWriterStore } from '../stores/writer.js'
import Keyboard from '../components/Keyboard.vue'
import TopStatusBar from '../components/TopStatusBar.vue'
import { LENGTH_BUCKETS } from '../data/words.js'
import { extractChinese } from '../utils/text2pinyin.js'

const settings = useSettingsStore()
const writer = useWriterStore()
const buckets = LENGTH_BUCKETS
const corpora = computed(() => writer.corpora)
const showMenu = ref(false)
const currentCorpusTitle = computed(() => corpora.value.find(c => c.id === writer.currentCorpusId)?.title || '选择文案')
function toggleMenu() { showMenu.value = !showMenu.value }
function selectCorpus(id) { writer.applyCorpus(id); showMenu.value = false }
function deleteDoc(id) { writer.deleteCustomDoc(id) }
const cardItems = computed(() => writer.queue.slice(writer.lineStart, writer.lineStart + writer.windowSize))
const currentInLine = computed(() => writer.charIdx - writer.lineStart)
function codeToLetter(c) { return (c || '').replace('Key','') }
function letterClass(cardIndex, letterIndex) {
  const pos = currentInLine.value
  const isDone = cardIndex < pos || (cardIndex === pos && letterIndex < writer.codeIdx)
  return { done: isDone, hidden: !writer.showShuangpin && !isDone }
}

function onBucket(e) { /* removed */ }
function onCorpus(e) { writer.applyCorpus(e.target.value) }
function onPress(code) { return writer.submit(code) }

// 导入文本弹窗逻辑
const showImport = ref(false)
const importText = ref('')
const hanCount = computed(() => extractChinese(importText.value).length)
function openImport() {
  importText.value = writer.lastText || ''
  showImport.value = true
}
function closeImport() { showImport.value = false }
function confirmImport() {
  writer.addCustomDocAndApply(importText.value)
  showImport.value = false
}

function restart() {
  writer.restartCurrent()
}

function onKeydownRestart(e) {
  if (!writer.completed) return
  if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) {
    e.preventDefault()
    restart()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydownRestart)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydownRestart)
})

onMounted(() => {
  settings.load()
  writer.load()
  writer.applyCorpus(writer.currentCorpusId)
})
</script>

<style scoped>
.pageCenter { min-height: calc(100vh - 52px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 12px; }
.operate { display: flex; gap: 10px; align-items: center; padding: 10px 20px; }
.operate .select select { display: none; }
.operate .select .dropdown { position: relative; display: inline-flex; align-items: center; gap: 6px; min-width: 220px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--theme-border-color); background: var(--theme-background-light-color); color: var(--theme-text-color); cursor: pointer; }
.operate .select .dropdown .ddMenu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 280px; max-height: 260px; overflow: auto; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 8px; box-shadow: 0 6px 16px rgba(0,0,0,0.18); padding: 6px; z-index: 20; display: block; }
.operate .select .dropdown .ddMenu .menuItem { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 8px; border-radius: 6px; }
.operate .select .dropdown .ddMenu .menuItem:hover { background: rgba(53,226,183,0.08); }
.operate .select .dropdown .ddMenu .menuItem .delBtn { background: transparent; border: none; color: #d9534f; cursor: pointer; font-size: 16px; }
.operate .select .dropdown .ddMenu .menuItem .delBtn:hover { color: #ff4d4f; }
.cardsWrap { width: 1040px; max-width: 96%; margin: 10px auto 10px; }
.cards { display: flex; gap: 10px; justify-content: center; perspective: 900px; }
.card { position: relative; width: 96px; height: 124px; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 10px; box-shadow: 0 2px 0 rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; justify-content: space-around; padding: 8px 6px; transform-style: preserve-3d; overflow: hidden; }
.card.current { border-color: var(--theme-menu-hover-color); box-shadow: 0 0 0 2px #35e2b733 inset, 0 0 10px #35e2b733; }
.card.doneLatest {
  transform-origin: bottom center;
  animation:
    cardHit 0.3s ease-out,
    cardFall 0.48s cubic-bezier(0.22, 0.62, 0.2, 0.95) 0.3s forwards;
  will-change: transform, opacity, box-shadow;
}
.card.doneLatest::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  box-shadow: 0 0 0 0 rgba(82,196,26,0.0), 0 0 0 rgba(82,196,26,0.0);
  opacity: 0;
  pointer-events: none;
  animation: cardHitGlow 0.3s ease-out;
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
.card.donePast { opacity: 0; visibility: hidden; pointer-events: none; }
@keyframes cardFall {
  0%   { transform: rotateX(0deg) translateY(0); opacity: 1; }
  100% { transform: rotateX(88deg) translateY(26px) scale(0.96); opacity: 0; visibility: hidden; }
}
.card .py { font-size: 22px; color: var(--theme-rich-text-color); }
.card .hz { font-size: 28px; font-weight: 700; color: var(--theme-main-text-color); line-height: 1; }
.card .keys { font-size: 22px; color: #54709536; letter-spacing: 1px; }
.card .keys .letter.hidden { opacity: 0; }
.card .keys .letter { margin: 0 0px; }
.card .keys .letter.done { color: var(--theme-menu-text-color); font-weight: 700; }

/* 简易弹窗样式 */
.modalMask { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 40; }
.modal { width: 720px; max-width: 92vw; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 10px; box-shadow: 0 6px 16px rgba(0,0,0,0.18); padding: 14px; }
.modal h3 { margin: 4px 0 10px; color: var(--theme-main-text-color); }
.modal textarea { width: 100%; height: 220px; padding: 10px; border-radius: 8px; border: 1px solid var(--theme-border-color); background: var(--theme-background-light-color); color: var(--theme-text-color); resize: vertical; }
.modalFooter { margin-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.modalFooter .tip { font-size: 12px; color: var(--theme-rich-text-color); }
.modalFooter .actions { display: flex; gap: 8px; }
.el-button.primary { background: var(--theme-menu-hover-color); color: #0b1a14; border-color: var(--theme-menu-hover-color); }
</style>
@keyframes cardHit {
  0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(82,196,26,0.0), 0 0 0 rgba(0,0,0,0); }
  60%  { transform: scale(1.12); box-shadow: 0 0 0 2px rgba(82,196,26,0.65) inset, 0 0 22px rgba(82,196,26,0.6); }
  100% { transform: scale(1); box-shadow: 0 0 0 2px rgba(82,196,26,0.30) inset, 0 4px 12px rgba(0,0,0,0.10); }
}
@keyframes cardHitGlow {
  0%   { opacity: 0; box-shadow: 0 0 0 0 rgba(82,196,26,0.0), 0 0 0 rgba(82,196,26,0.0); }
  50%  { opacity: 1; box-shadow: 0 0 0 2px rgba(82,196,26,0.75) inset, 0 0 28px rgba(82,196,26,0.65); }
  100% { opacity: 0; box-shadow: 0 0 0 0 rgba(82,196,26,0.0), 0 0 0 rgba(82,196,26,0.0); }
}
@keyframes cardRipple {
  0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
}
