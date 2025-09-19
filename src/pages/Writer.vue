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
          <label>长度：</label>
          <select :value="writer.bucketId" @change="onBucket">
            <option v-for="b in buckets" :key="b.id" :value="b.id">{{ b.label }}</option>
          </select>
        </div>
        <button class="el-button el-button--small" @click="nextOne">随机更换</button>
        <label><input type="checkbox" :checked="writer.showPinyin" @change="e=>writer.setShowPinyin(e.target.checked)"/> 拼音显示</label>
        <label><input type="checkbox" :checked="writer.showShuangpin" @change="e=>writer.setShowShuangpin(e.target.checked)"/> 双拼编码显示</label>
        <label><input type="checkbox" :checked="writer.hideKeyboard" @change="e=>writer.setHideKeyboard(e.target.checked)"/> 隐藏键盘</label>
      </div>

      <div class="cardsWrap">
        <div class="cards">
          <div
            v-for="(it, idx) in cardItems"
            :key="writer.charIdx + idx + '-' + it.ch + '-' + it.pinyin"
            class="card"
            :class="{ current: idx === currentInLine }"
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
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import { useWriterStore } from '../stores/writer.js'
import Keyboard from '../components/Keyboard.vue'
import TopStatusBar from '../components/TopStatusBar.vue'
import { LENGTH_BUCKETS } from '../data/words.js'

const settings = useSettingsStore()
const writer = useWriterStore()
const buckets = LENGTH_BUCKETS
const cardItems = computed(() => writer.queue.slice(writer.lineStart, writer.lineStart + writer.windowSize))
const currentInLine = computed(() => writer.charIdx - writer.lineStart)
function codeToLetter(c) { return (c || '').replace('Key','') }
function letterClass(cardIndex, letterIndex) {
  const pos = currentInLine.value
  const isDone = cardIndex < pos || (cardIndex === pos && letterIndex < writer.codeIdx)
  return { done: isDone, hidden: !writer.showShuangpin && !isDone }
}

function onBucket(e) { writer.setBucket(e.target.value) }
function nextOne() { writer.pickRandom() }
function onPress(code) { return writer.submit(code) }

onMounted(() => {
  settings.load()
  writer.load()
  writer.pickRandom()
})
</script>

<style scoped>
.pageCenter { min-height: calc(100vh - 52px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 12px; }
.operate { display: flex; gap: 10px; align-items: center; padding: 10px 20px; }
.operate .select select { padding: 4px 8px; border-radius: 6px; border: 1px solid var(--theme-border-color); background: var(--theme-background-light-color); color: var(--theme-text-color); }
.cardsWrap { width: 1040px; max-width: 96%; margin: 10px auto 10px; }
.cards { display: flex; gap: 10px; justify-content: center; }
.card { width: 96px; height: 124px; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 10px; box-shadow: 0 2px 0 rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; justify-content: space-around; padding: 8px 6px; }
.card.current { border-color: var(--theme-menu-hover-color); box-shadow: 0 0 0 2px #35e2b733 inset, 0 0 10px #35e2b733; }
.card .py { font-size: 22px; color: var(--theme-rich-text-color); }
.card .hz { font-size: 28px; font-weight: 700; color: var(--theme-main-text-color); line-height: 1; }
.card .keys { font-size: 22px; color: #54709536; letter-spacing: 1px; }
.card .keys .letter.hidden { opacity: 0; }
.card .keys .letter { margin: 0 0px; }
.card .keys .letter.done { color: var(--theme-menu-text-color); font-weight: 700; }
</style>
