<template>
  <div class="keyWrap" data-testid="keyWrap">
    <div v-for="(row, ri) in rows" :key="ri" class="keyRow" :class="{ shiftedLeft: ri === rows.length - 1 }">
      <div
        v-for="code in row"
        :key="code"
        class="keyBox"
        :class="boxClass(code)"
        @mousedown.prevent="onClick(code)"
        @touchstart.prevent="onClick(code)"
      >
        <div class="keyCapital"><p>{{ keyByCode.get(code).label }}</p></div>
        <div class="keyAuxiliary" style="display:block;" v-if="showHints && !settings.blindMode">
          <p v-if="keyByCode.get(code).hint" class="red-text">{{ keyByCode.get(code).hint }}</p>
          <p v-for="(f, i) in keyByCode.get(code).finals" :key="i">{{ f }}</p>
        </div>
        <div class="keyMnemonic" v-if="showHints && keyByCode.get(code).mnemonics?.length">
          <span v-for="(m,i) in keyByCode.get(code).mnemonics" :key="i">{{ m }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive } from 'vue'
import { keyRows as rows, keyByCode } from '../data/xiaohe.js'
import { playKeySound } from '../utils/sound.js'
import { useSettingsStore } from '../stores/settings.js'

const settings = useSettingsStore()
const props = defineProps({
  handle: { type: Function, required: false },
  selectable: { type: Boolean, default: false },
  selectedCodes: { type: Array, default: () => [] },
  onToggle: { type: Function, required: false },
  pressedCodes: { type: Object, default: null }, // 展示模式：外部按压状态（reactive Set）
  flashCodes: { type: Object, default: null }, // 展示模式：外部闪光状态（reactive Map: code -> 'ok'|'bad'）
  showHints: { type: Boolean, default: true }, // 是否显示双拼提示区
})

const flash = reactive(new Map()) // code -> 'ok' | 'bad' | undefined
const pressed = reactive(new Set())

function boxClass(code) {
  const extFlash = props.flashCodes?.get?.(code)
  return {
    pressed: pressed.has(code) || props.pressedCodes?.has?.(code),
    'flash-ok': flash.get(code) === 'ok' || extFlash === 'ok',
    'flash-bad': flash.get(code) === 'bad' || extFlash === 'bad',
    selected: props.selectable && props.selectedCodes?.includes?.(code),
  }
}

function doFlash(code, kind) {
  flash.set(code, kind)
  setTimeout(() => {
    if (flash.get(code) === kind) flash.delete(code)
  }, kind === 'ok' ? 220 : 280)
}

function onClick(code) {
  if (props.selectable && props.onToggle) {
    props.onToggle(code)
    return
  }
  // 展示模式：不处理输入（输入由父组件统一接管）
  if (props.pressedCodes || props.flashCodes) return
  if (props.handle) {
    const res = props.handle?.(code) || { correct: false }
    if (!res?.ignore) {
      doFlash(code, res.correct ? 'ok' : 'bad')
      if (settings.sound) {
        playKeySound(res.correct ? 'ok' : 'bad', { volume: settings.soundVolume })
      }
    }
  }
}

function onKeyDown(e) {
  const code = e.code
  if (!keyByCode.has(code)) return
  if (props.selectable) return
  if (e.repeat) return
  if (!pressed.has(code)) pressed.add(code)
  const res = props.handle?.(code) || { correct: false }
  if (!res?.ignore) {
    doFlash(code, res.correct ? 'ok' : 'bad')
    if (settings.sound) {
      playKeySound(res.correct ? 'ok' : 'bad', { volume: settings.soundVolume })
    }
  }
}

function onKeyUp(e) {
  const code = e.code
  if (pressed.has(code)) pressed.delete(code)
}

onMounted(() => {
  // 展示模式（传入外部状态）时组件不监听键盘，输入与反馈均由父组件驱动
  if (!props.pressedCodes && !props.flashCodes) {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  }
})
onBeforeUnmount(() => {
  if (!props.pressedCodes && !props.flashCodes) {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  }
})
</script>

<style scoped>
</style>
