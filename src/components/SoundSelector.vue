<template>
  <div class="soundBar">
    <label>正确音效：</label>
    <select :value="settings.soundOkFile" @change="onSelect">
      <option v-for="n in options" :key="n" :value="n">{{ n }}</option>
    </select>
  </div>
  
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import { setSoundURLs, loadCustomSounds } from '../utils/sound.js'

const settings = useSettingsStore()
const options = ref([])

onMounted(async () => {
  await settings.loadSoundList()
  options.value = settings.soundList
  if (!settings.soundOkFile && options.value.length > 0) {
    settings.setOkSoundFile(options.value[0])
  }
  apply()
})

function apply() {
  if (settings.soundOkFile) {
    setSoundURLs({ ok: `/sounds/${settings.soundOkFile}`, bad: '/sounds/cuowu.mp3' })
    loadCustomSounds().catch(() => {})
  } else {
    // 无选择时使用默认正确音效
    setSoundURLs({ ok: '/sounds/ting.mp3', bad: '/sounds/cuowu.mp3' })
  }
}

function onSelect(e) {
  const name = e.target.value
  settings.setOkSoundFile(name)
  apply()
}
</script>

<style scoped>
.soundBar { display: inline-flex; gap: 8px; align-items: center; padding: 6px 10px; }
label { color: var(--theme-text-color); font-size: 12px; }
select { padding: 4px 8px; border-radius: 6px; border: 1px solid var(--theme-border-color); background: var(--theme-background-light-color); color: var(--theme-text-color); }
</style>
