<template>
  <div class="keyWrap" data-testid="keyWrap">
    <div v-for="(row, ri) in rows" :key="ri" class="keyRow">
      <div
        v-for="code in row"
        :key="code"
        class="keyBox"
        :class="boxClass(code)"
        @mousedown.prevent="onClick(code)"
        @touchstart.prevent="onClick(code)"
      >
        <div class="keyCapital"><p>{{ keyByCode.get(code).label }}</p></div>
        <div class="keyAuxiliary" style="display:block;" v-if="!settings.blindMode">
          <p v-if="keyByCode.get(code).hint" class="red-text">{{ keyByCode.get(code).hint }}</p>
          <p v-for="(f, i) in keyByCode.get(code).finals" :key="i">{{ f }}</p>
        </div>
        <div class="keyMnemonic" v-if="keyByCode.get(code).mnemonics?.length">
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
})

const flash = reactive(new Map()) // code -> 'ok' | 'bad' | undefined
const pressed = reactive(new Set())

function boxClass(code) {
  return {
    pressed: pressed.has(code),
    'flash-ok': flash.get(code) === 'ok',
    'flash-bad': flash.get(code) === 'bad',
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
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<style scoped>
</style>
