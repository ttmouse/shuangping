<template>
  <div class="topStatus" :class="{ courseMode: !!course }">
    <!-- 课包课程练习：顶部栏替换为课程面包屑导航（不再显示模式入口/今日目标/正确率） -->
    <template v-if="course">
      <div class="left courseLeft">
        <button class="courseBackBtn" title="回到课程列表" @click="course.onBack" data-nav>‹ 课程列表</button>
        <div class="courseBreadcrumb">
          <span class="courseCrumbPack" :title="course.packTitle">{{ course.packTitle }}</span>
          <span class="courseCrumbSep">›</span>
          <span class="courseCrumbCourse" :title="course.courseTitle">{{ course.courseTitle }}</span>
        </div>
        <div class="courseNav">
          <button class="courseNavBtn" :disabled="course.index <= 0" @click="course.onPrev" title="上一课" data-nav>‹</button>
          <span class="courseNavPos">{{ course.position }}</span>
          <button class="courseNavBtn" :disabled="course.index >= course.total - 1" @click="course.onNext" title="下一课" data-nav>›</button>
        </div>
      </div>
    </template>
    <!-- 常规页面：左侧模式导航入口（练习中隐藏） -->
    <div v-show="!started" v-else class="left">
      <button
        class="modeBtn"
        :class="{ active: route.name === 'projects' }"
        @click="go('/projects')"
        title="首页"
        data-nav
      >首页</button>
      <button
        v-for="m in PRACTICE_MODES"
        :key="m.id"
        class="modeBtn"
        :class="{ active: isModeActive(m.id) }"
        @click="goMode(m.id)"
        :title="m.label"
        data-nav
      >
        <span class="modeBtnIcon" v-html="m.icon"></span>{{ m.label }}
      </button>
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
    <!-- 今日目标：顶部栏常驻，随时指引进展（三达标：时长/正确率/错词清零） -->
    <div v-if="!course" class="goalTop" :class="{ all: goal.allDone }" title="今日目标：练满时长 + 正确率达到 + 错词清零">
      <span class="goalTopTitle"><svg class="btnIcon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2"/></svg>今日目标</span>
      <span class="goalTopTime" :class="{ done: goal.timeDoneFlag }">
        <span class="goalTopBar"><span class="goalTopFill" :style="{ width: goal.timePercent + '%' }"></span></span>
        {{ goal.timeDone }}/{{ goal.timeTarget }}分
      </span>
      <span class="goalTopItem" :class="{ done: goal.accuracyDone }">{{ goal.accuracy }}%</span>
      <span class="goalTopItem" :class="{ done: goal.mistakesDone }">错{{ goal.mistakes }}</span>
      <span class="goalTopItem" :class="{ done: goal.sessionDoneFlag }">练{{ goal.sessionDone }}/{{ goal.sessionTarget }}次</span>
      <span class="goalTopAll" v-if="goal.allDone"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 8.5 3.5 3.5L13 5"/></svg></span>
    </div>
    <div class="right">
      <div class="accuracy" v-if="!course && session.totalAttempts > 0" title="正确率">
        <span class="acc-value">{{ session.accuracy }}%</span>
        <span class="acc-label">正确率</span>
      </div>
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
        <!-- 设置浮层：居中大卡片 + 分组 -->
        <div v-if="showSettings" class="settingsMask" @click.self="showSettings = false">
          <div class="settingsPanel">
            <div class="spHeader">
              <span class="spTitle">设置</span>
              <button class="spClose" title="关闭" @click="showSettings = false" data-nav>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="spBody">
              <!-- 组1：英文·掌握判定 -->
              <div class="spGroup">
                <div class="spGroupTitle">英文·掌握判定</div>
                <div class="setRow">
                  <span class="setLabel" title="抄写模式（显示字母，照着打）：不用回忆，所以要求打得快才算掌握">抄写·多快算掌握</span>
                  <span class="setCtrl">
                    <input type="number" :value="settings.enMasteryMs" min="100" max="3000" step="100" @change="setMasteryMs" />
                    <span class="setUnit">ms/字母</span>
                  </span>
                </div>
                <div class="setRow">
                  <span class="setLabel" title="抄写模式平均每字母超过该值（即使没打错）→ 视为没掌握">抄写·多慢算生疏</span>
                  <span class="setCtrl">
                    <input type="number" :value="settings.enSlowMs" min="200" max="5000" step="100" @change="setSlowMs" />
                    <span class="setUnit">ms/字母</span>
                  </span>
                </div>
                <div class="setRow">
                  <span class="setLabel" title="默写模式（隐藏字母，凭记忆打）：回忆要花时间，所以标准放宽">默写·多快算掌握</span>
                  <span class="setCtrl">
                    <input type="number" :value="settings.enMasteryMsDict" min="100" max="3000" step="100" @change="setMasteryMsDict" />
                    <span class="setUnit">ms/字母</span>
                  </span>
                </div>
                <div class="setRow">
                  <span class="setLabel" title="平均每字母超过该值（即使无错）→ 视为掌握不好">默写·多慢算生疏</span>
                  <span class="setCtrl">
                    <input type="number" :value="settings.enSlowMsDict" min="200" max="5000" step="100" @change="setSlowMsDict" />
                    <span class="setUnit">ms/字母</span>
                  </span>
                </div>
                <div class="setRow">
                  <span class="setLabel" title="慢词刻意练习阈值：平均每字母超过该值的词会自动收录，专项练到该值以内过关">慢词练习阈值</span>
                  <span class="setCtrl">
                    <input type="number" :value="settings.enPracticeMs" min="100" max="5000" step="50" @change="setPracticeMs" />
                    <span class="setUnit">ms/字母</span>
                  </span>
                </div>
              </div>

              <!-- 组2：英文·练习显示 -->
              <div class="spGroup">
                <div class="spGroupTitle">英文·练习显示</div>
                <label class="setRow">
                  <span class="setLabel" title="开启后：所有英文单词默认隐藏字母（全默写，凭记忆打），不再区分是否掌握；打错仍会显示单词">英文全默写</span>
                  <input type="checkbox" :checked="settings.enAllDictation" @change="settings.toggleEnAllDictation()" />
                </label>
                <label class="setRow">
                  <span class="setLabel" title="开启后显示每个英文单词上方的中文翻译；关闭后界面更简洁，专注拼写">单词·显示中文</span>
                  <input type="checkbox" :checked="settings.enShowWordCn" @change="settings.toggleEnShowWordCn()" />
                </label>
                <label class="setRow">
                  <span class="setLabel" title="开启后显示每个英文单词下方本词的平均用时(ms)；关闭后界面更简洁">单词·显示用时(ms)</span>
                  <input type="checkbox" :checked="settings.enShowWordTime" @change="settings.toggleEnShowWordTime()" />
                </label>
                <div class="setRow">
                  <span class="setLabel" title="单词字母着色模式：词根着色（按前缀/词根/后缀分组上色）、音节着色（按自然拼读发音块上色）或关闭">着色模式</span>
                  <span class="setCtrl setChips">
                    <button class="chipBtn" :class="{ active: settings.enColorMode === 'word-root' }" @click="settings.setEnColorMode('word-root')" title="按前缀/词根/后缀分组上色">词根</button>
                    <button class="chipBtn" :class="{ active: settings.enColorMode === 'syllable' }" @click="settings.setEnColorMode('syllable')" title="按自然拼读发音块上色">音节</button>
                    <button class="chipBtn" :class="{ active: settings.enColorMode === 'off' }" @click="settings.setEnColorMode('off')" title="不显示着色">关</button>
                  </span>
                </div>
                <label class="setRow">
                  <span class="setLabel" title="默写模式下当前录入位置的字母是否显示：默认不显示（回忆拼写，仅该位置下划线高亮）；勾选后显示字母">默写·显示当前字母</span>
                  <input type="checkbox" :checked="settings.enDictCurrentHint" @change="settings.toggleEnDictCurrentHint()" />
                </label>
                <label class="setRow">
                  <span class="setLabel" title="开启后：打错的单词会重新入队、放到第二行重练（错题模式）；关闭后：打错即过，不重练错词">错题重练</span>
                  <input type="checkbox" :checked="settings.enRedoPractice" @change="settings.toggleEnRedoPractice()" />
                </label>
                <label class="setRow">
                  <span class="setLabel" title="宽松模式：输入过程中不判错，可自由修改；整词完成后统一判断对错">宽松模式</span>
                  <input type="checkbox" :checked="settings.enGentleMode" @change="settings.toggleEnGentleMode()" />
                </label>
                <label class="setRow">
                  <span class="setLabel" title="句子练习时是否在词与词之间展示原句的逗号/句号等标点（默认关；开后在练习中显示标点，标点不参与输入）">句中标点</span>
                  <input type="checkbox" :checked="settings.enShowPunct" @change="settings.toggleEnShowPunct()" />
                </label>
              </div>

              <!-- 组3：英文·发音 -->
              <div class="spGroup">
                <div class="spGroupTitle">英文·发音</div>
                <label class="setRow">
                  <span class="setLabel" title="英文模式：单词出现时朗读一遍；打错时也会再次朗读该词提示正确发音（浏览器内置语音）">单词发音</span>
                  <input type="checkbox" :checked="settings.enSpeakWords" @change="settings.toggleEnSpeakWords()" />
                </label>
                <label class="setRow">
                  <span class="setLabel" title="英文短文/自定义模式：进入新句子时整句作一次请求先试有道原声（与单词同音色），未收录的句子自动回退系统语音整句朗读">整句朗读</span>
                  <input type="checkbox" :checked="settings.enSpeakSentence" @change="settings.toggleEnSpeakSentence()" />
                </label>
                <label class="setRow" v-if="settings.enSpeakSentence">
                  <span class="setLabel" title="读完整句后：单词输入前不再逐个朗读（安静回想/试拼）；打错时的纠音朗读仍保留（建议短文模式使用）">整句后免单词预读</span>
                  <input type="checkbox" :checked="settings.enNoWordPreSpeak" @change="settings.toggleEnNoWordPreSpeak()" />
                </label>
                <div class="setRow setRowSound" v-if="settings.enSpeakWords">
                  <span class="setLabel" title="发音口音：有道词典 TTS，英音（type=2）或美音（type=1）">发音口音</span>
                  <select :value="settings.enTTSAccent" @change="onSelectTTSAccent">
                    <option value="uk">英音</option>
                    <option value="us">美音</option>
                  </select>
                </div>
              </div>

              <!-- 组4：通用键盘 -->
              <div class="spGroup">
                <div class="spGroupTitle">通用键盘</div>
                <label class="setRow">
                  <span class="setLabel" title="关闭后底部虚拟键盘不再显示（适合使用外接实体键盘的场景）；各练习页顶部的单独“隐藏键盘”开关仍可用">显示底部键盘</span>
                  <input type="checkbox" :checked="settings.showKeyboard" @change="settings.toggleShowKeyboard()" />
                </label>
                <label class="setRow">
                  <span class="setLabel">卡片隐藏字母</span>
                  <input type="checkbox" :checked="settings.cardHideLetters" @change="settings.toggleCardHideLetters()" />
                </label>
                <label class="setRow">
                  <span class="setLabel">盲打模式</span>
                  <input type="checkbox" :checked="settings.blindMode" @change="settings.toggleBlindMode()" />
                </label>
              </div>

              <!-- 组5：声音 -->
              <div class="spGroup">
                <div class="spGroupTitle">声音</div>
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
import { useProgressStore } from '../stores/progress.js'
import { setSoundURLs, loadCustomSounds } from '../utils/sound.js'

// 课包课程练习：传入非空对象时，顶部栏切换为课程面包屑导航
// { packTitle, courseTitle, position, index, total, onPrev, onNext, onBack }
// started：练习进行中时简化导航，只保留目标/正确率/设置
const props = defineProps({
  course: { type: Object, default: null },
  started: { type: Boolean, default: false },
})

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()
const session = useSessionStore()
const progress = useProgressStore()
// 今日目标实时进度（顶部栏常驻显示）
const goal = computed(() => progress.todayGoal)

const isDark = computed(() => settings.theme === 'dark')
const showSettings = ref(false)
const soundOptions = ref([])

function toggleTheme() { settings.toggleTheme() }
function setMasteryMs(e) { settings.setEnMasteryMs(e.target.value) }
function setSlowMs(e) { settings.setEnSlowMs(e.target.value) }
function setMasteryMsDict(e) { settings.setEnMasteryMsDict(e.target.value) }
function setSlowMsDict(e) { settings.setEnSlowMsDict(e.target.value) }
function setPracticeMs(e) { settings.setEnPracticeMs(e.target.value) }
function go(path) { if (route.path !== path) router.push(path) }

// 练习模式导航（点击进入常规打字页并选中对应模式；与 PracticeModes 的 MODES 一一对应）
const PRACTICE_MODES = [
  {
    id: 'cards',
    label: '中文拼音',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>',
  },
  {
    id: 'english',
    label: '英文',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>',
  },
  {
    id: 'numbers',
    label: '键盘数字',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3L8 21"/><path d="M16 3l-2 18"/></svg>',
  },
  {
    id: 'letters',
    label: '字母键位',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="9" width="8" height="8" rx="1.5"/><rect x="13" y="9" width="8" height="8" rx="1.5"/></svg>',
  },
  {
    id: 'syllables',
    label: '拼音音节',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h3l2-5 3 10 3-8 2 3h5"/></svg>',
  },
]
// 当前是否高亮某个练习模式：位于打字练习页且 query.mode 匹配（无 query 时默认 cards）
function isModeActive(id) {
  if (route.name !== 'practice-modes') return false
  const q = route.query.mode
  if (q) return q === id
  return id === 'cards'
}
// 点击模式导航：进入打字练习页并写入 query.mode，让页内选中对应模式
function goMode(id) {
  router.push({ path: '/practice-modes', query: { mode: id } })
}

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

// 发音口音（有道 TTS：英音/美音）
function onSelectTTSAccent(e) {
  settings.setEnTTSAccent(e.target.value)
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
  progress.load()
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
  gap: 12px;
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
  flex: 1 1 auto;
  min-width: 0;
}
.left::-webkit-scrollbar { display: none; }
.right { display: flex; gap: 10px; align-items: center; flex: 0 0 auto; }
/* 今日目标（顶部栏常驻）：紧凑条 */
.goalTop {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--theme-background-color);
  border: 1px solid var(--theme-border-color);
  font-size: 12px;
  color: var(--theme-text-color);
  white-space: nowrap;
}
.goalTop.all { border-color: #3db389; }
.goalTopTitle { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: var(--theme-main-text-color); }
.goalTopTime { display: inline-flex; align-items: center; gap: 5px; font-variant-numeric: tabular-nums; }
.goalTopBar { width: 44px; height: 6px; border-radius: 3px; background: var(--theme-border-color); overflow: hidden; display: inline-block; }
.goalTopFill { display: block; height: 100%; background: var(--theme-menu-hover-color); border-radius: 3px; transition: width .3s ease; }
.goalTopItem { font-variant-numeric: tabular-nums; }
.goalTop .done { color: #3db389; font-weight: 600; }
.goalTopItem { }
.goalTopAll { font-size: 14px; }
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
.modeBtnIcon { display: inline-flex; width: 15px; height: 15px; flex: 0 0 auto; }
.modeBtnIcon svg { width: 15px; height: 15px; }
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
.settingsMask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.settingsPanel {
  width: min(640px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: var(--theme-background-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}
.spHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--theme-border-color);
  position: sticky;
  top: 0;
  background: var(--theme-background-color);
}
.spTitle { font-size: 16px; font-weight: 700; color: var(--theme-main-text-color); }
.spClose {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--theme-text-color);
  cursor: pointer;
}
.spClose:hover { background: var(--theme-background-light-color); }
.spBody {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.spGroup { display: flex; flex-direction: column; gap: 10px; }
.spGroupTitle {
  font-size: 12px;
  font-weight: 700;
  color: var(--theme-text-color);
  letter-spacing: 0.5px;
  padding-bottom: 4px;
  border-bottom: 1px dashed var(--theme-border-color);
}
@media (max-width: 600px) {
  .settingsMask { padding: 12px; }
  .settingsPanel { max-height: calc(100vh - 24px); }
  .spBody { padding: 14px 14px; }
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
.setChips { gap: 4px; }
.chipBtn {
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-menu-text-color);
  font-size: 12px;
  cursor: pointer;
  transition: all .12s ease;
}
.chipBtn.active {
  border-color: var(--theme-menu-hover-color);
  background: var(--theme-menu-hover-color);
  color: #fff;
  box-shadow: 0 0 0 1px var(--theme-menu-hover-color);
}
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

@media (max-width: 1100px) {
  .goalTopTitle { display: none; }
}
@media (max-width: 900px) {
  .goalTopItem { display: none; }
  .goalTopBar { width: 34px; }
}
@media (max-width: 700px) {
  .goalTop { padding: 4px 8px; }
  .goalTopAll { display: none; }
}
@media (max-width: 520px) {
  .topStatus { padding: 8px 8px; }
  .accuracy { display: none; }
}
</style>
