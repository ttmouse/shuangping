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
                :class="{ custom: c.id.startsWith(CUSTOM_PREFIX) }"
                @click="selectCorpus(c.id)"
              >
                <span class="title">{{ c.title }}</span>
                <button
                  v-if="c.id.startsWith(CUSTOM_PREFIX)"
                  class="delBtn"
                  title="删除"
                  @click.stop="deleteDoc(c.id)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <SchemeSelector />
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
import { useWriterStore, CORPUS_IDS } from '../stores/writer.js'
import Keyboard from '../components/Keyboard.vue'
import TopStatusBar from '../components/TopStatusBar.vue'
import SchemeSelector from '../components/SchemeSelector.vue'
import { LENGTH_BUCKETS } from '../data/words.js'
import { extractChinese } from '../utils/text2pinyin.js'
import { playKeySound } from '../utils/sound.js'
import { keyByCode } from '../data/xiaohe.js'

// 自定义文案 ID 前缀
const CUSTOM_PREFIX = 'custom-'

const settings = useSettingsStore()
const writer = useWriterStore()
const buckets = LENGTH_BUCKETS
const corpora = computed(() => writer.corpora)
const showMenu = ref(false)
const currentCorpusTitle = computed(() => corpora.value.find(c => c.id === writer.currentCorpusId)?.title || '选择文案')
function toggleMenu() { showMenu.value = !showMenu.value }
function selectCorpus(id) { writer.applyCorpus(id); showMenu.value = false }
function deleteDoc(id) {
  const doc = writer.customDocs.find(d => d.id === id)
  if (doc && confirm(`确定要删除自定义文本"${doc.title}"吗？`)) {
    writer.deleteCustomDoc(id)
  }
}
const cardItems = computed(() => writer.queue.slice(writer.lineStart, writer.lineStart + writer.windowSize))
const currentInLine = computed(() => writer.charIdx - writer.lineStart)
function codeToLetter(c) { return (c || '').replace('Key','') }
function letterClass(cardIndex, letterIndex) {
  const pos = currentInLine.value
  const isDone = cardIndex < pos || (cardIndex === pos && letterIndex < writer.codeIdx)
  return { done: isDone, hidden: !writer.showShuangpin && !isDone }
}

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

// 处理键盘输入，即使键盘被隐藏也能工作
function onKeyDown(e) {
  if (writer.hideKeyboard && keyByCode.has(e.code)) {
    const res = writer.submit(e.code) || { correct: false }
    if (!res?.ignore) {
      if (settings.sound) {
        playKeySound(res.correct ? 'ok' : 'bad', { volume: settings.soundVolume })
      }
    }
  }
}

onMounted(() => {
  settings.load()
  writer.load()
  writer.applyCorpus(writer.currentCorpusId)
  window.addEventListener('keydown', onKeydownRestart)
  window.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydownRestart)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.pageCenter { min-height: calc(100dvh - 52px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 12px; }
.operate { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; padding: 10px 12px; }
.operate .select select { display: none; }
.operate .select .dropdown { position: relative; display: inline-flex; align-items: center; gap: 6px; min-width: 220px; padding: 6px 10px; border-radius: 10px; border: 1px solid var(--theme-border-color); background: var(--theme-background-light-color); color: var(--theme-text-color); cursor: pointer; }
.operate .select .dropdown .ddMenu { position: absolute; top: calc(100% + 6px); left: 0; right: 0; min-width: 0; max-height: 52dvh; overflow: auto; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 10px; box-shadow: 0 6px 16px rgba(0,0,0,0.18); padding: 6px; z-index: 20; display: block; }
.operate .select .dropdown .ddMenu .menuItem { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 10px; border-radius: 8px; }
.operate .select .dropdown .ddMenu .menuItem:hover { background: rgba(53,226,183,0.08); }
.operate .select .dropdown .ddMenu .menuItem.custom { padding-right: 6px; }
.operate .select .dropdown .ddMenu .menuItem .delBtn { background: transparent; border: none; color: #d9534f; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.operate .select .dropdown .ddMenu .menuItem .delBtn:hover { color: #ff4d4f; background: rgba(217,83,79,0.1); }
.cardsWrap { width: 1040px; max-width: 96%; margin: 10px auto 10px; }
.cards { display: flex; gap: 10px; justify-content: center; perspective: 900px; flex-wrap: wrap; }
.card { position: relative; width: 96px; height: 124px; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 10px; box-shadow: 0 2px 0 rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; justify-content: space-around; padding: 8px 6px; transform-style: preserve-3d; overflow: hidden; }
.card.current { border-color: var(--theme-menu-hover-color); box-shadow: 0 0 0 2px #35e2b733 inset, 0 0 10px #35e2b733; }
.card.doneLatest { transform-origin: bottom center; animation: cardFall 0.48s cubic-bezier(0.22, 0.62, 0.2, 0.95) forwards; }
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

@media (max-width: 520px) {
  .cardsWrap { max-width: 100%; }
  .cards { gap: 8px; }
  .card { width: 88px; height: 116px; }
  .card .py { font-size: 18px; }
  .card .hz { font-size: 26px; }
  .card .keys { font-size: 18px; }
  .operate { position: sticky; top: 52px; z-index: 10; backdrop-filter: blur(10px); background: color-mix(in srgb, var(--theme-background-light-color) 85%, transparent); border-bottom: 1px solid var(--theme-border-color); }
}

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
/* removed highlight animations */
