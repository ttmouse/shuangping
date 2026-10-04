<template>
  <!-- 单词词卡浮层：练习页与阅读模式共用的唯一实现 -->
  <div class="wordcard" :style="{ left: x + 'px', top: y + 'px' }" @click.stop>
    <div class="wc-head">
      <span class="wc-word" :class="{ 'is-vocab': inVocab }">{{ word }}</span>
      <button class="wc-btn" v-qtip data-tip="美式发音" @click="$emit('play', 'us')">美</button>
      <button class="wc-btn" v-qtip data-tip="英式发音" @click="$emit('play', 'uk')">英</button>
      <button
        class="wc-add"
        :class="{ on: inVocab }"
        v-qtip
        :data-tip="inVocab ? '点击从生词本移除' : '收藏到生词本，长期保留'"
        @click="$emit('toggle')"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M12 7v6"/><path d="M9 10h6"/></svg>
      </button>
    </div>
    <div class="wc-phs">
      <span v-if="phUs" class="wc-ph"><b>美</b>{{ phUs }}</span>
      <span v-if="phUk" class="wc-ph"><b>英</b>{{ phUk }}</span>
    </div>
    <div class="wc-defs">
      <div class="wc-def"><i v-if="posCn">{{ posCn }}</i>{{ def || '' }}</div>
    </div>
    <!-- 扩展内容（例句/词典释义/相关词等）由使用方通过默认插槽注入 -->
    <slot />
  </div>
</template>

<script setup>
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  word: { type: String, default: '' },
  phUs: { type: String, default: '' },
  phUk: { type: String, default: '' },
  posCn: { type: String, default: '' },
  def: { type: String, default: '' },
  inVocab: { type: Boolean, default: false },
})
defineEmits(['play', 'toggle'])
</script>

<style scoped>
.wordcard { position: fixed; z-index: 200; width: 300px; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 14px; box-shadow: 0 12px 32px rgba(0,0,0,.18); padding: 14px 16px; }
.wc-head { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
.wc-word { font-size: 22px; font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wc-word.is-vocab { color: var(--theme-warning); }
.wc-phs { display: flex; gap: 10px; margin-top: 2px; flex-wrap: wrap; }
.wc-ph { font-size: 14px; color: var(--theme-text-secondary); }
.wc-ph b { font-weight: 600; color: var(--theme-main-text-color); margin-right: 3px; font-style: normal; }
.wc-btn { padding: 2px 9px; font-size: 12px; border-radius: 6px; border: 1px solid var(--theme-border-color); background: transparent; color: var(--theme-text-color); cursor: pointer; }
.wc-btn:hover { border-color: var(--theme-main-text-color); color: var(--theme-main-text-color); }
/* 收藏生词本：头部行尾的小图标按钮（生词本+ 图标；收藏后仅变主题色） */
.wc-add { display: inline-flex; align-items: center; justify-content: center; flex: none; margin-left: auto; width: 24px; height: 24px; padding: 0; border-radius: 50%; border: 1px solid var(--theme-border-color); background: transparent; color: var(--theme-text-color); cursor: pointer; transition: border-color .15s ease, color .15s ease, background .15s ease; }
.wc-add:hover { border-color: var(--theme-main-text-color); color: var(--theme-main-text-color); }
.wc-add.on { border-color: var(--theme-main-text-color); background: color-mix(in srgb, var(--theme-main-text-color) 12%, transparent); color: var(--theme-main-text-color); }
.wc-defs { margin-top: 10px; }
.wc-def { font-size: 14px; line-height: 1.6; }
.wc-def i { font-style: normal; color: var(--theme-main-text-color); margin-right: 4px; }
@media (max-width: 720px) { .wordcard { width: 260px; } }
</style>
