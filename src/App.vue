<template>
  <router-view />

  <!-- 全局暂停浮层 -->
  <div v-if="paused && pauseActive" class="modalMask pause-overlay" @click.self="togglePause">
    <div class="modal pause-modal">
      <h2>游戏暂停</h2>
      <p>游戏已暂停，按空格或回车继续</p>
      <p class="pause-motivation">快点回来吧，你的英语能力正在蓄势待发！</p>
      <div class="modalFooter pause-footer">
        <div class="actions">
          <button class="el-button el-button--small primary" @click="togglePause">继续游戏</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, watch } from 'vue'

// 提供默认暂停状态，使顶部暂停按钮在所有页面可见
// 练习页（Writer.vue / YunmuPractice.vue）会覆盖 provide 以实现实际暂停逻辑
const paused = ref(false)
// 仅当当前页面处于「可暂停的活动」场景（练习/阅读进行中）时才允许暂停，
// 默认开启以兼容纯练习页；浏览类页面（课包/课程列表等）会把它关掉，避免弹「游戏暂停」。
const pauseActive = ref(true)
function togglePause() { paused.value = !paused.value }
// 一旦退出「可暂停」场景（返回浏览态/阅读结束），立即清除残留暂停，
// 否则 paused 仍为 true，下个练习一开始 pauseActive 变 true 会莫名弹出暂停浮层
watch(pauseActive, (active) => { if (!active) paused.value = false })
provide('paused', paused)
provide('togglePause', togglePause)
provide('pauseActive', pauseActive)

// 浏览器 Tab 切换时自动暂停：离开页面（切换到其他 Tab / 最小化浏览器）→ 暂停
// 仅用 visibilitychange，不用 blur（打开 DevTools 会触发 blur 但不会触发 visibilitychange → hidden）
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && pauseActive.value && !paused.value) {
    paused.value = true
  }
})

// 全局键盘监听：暂停时空格/回车恢复
function onKeyDown(e) {
  if (paused.value) {
    if (e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      togglePause()
    }
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', onKeyDown)
}
</script>

<style>
</style>

