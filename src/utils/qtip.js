// 快速悬停提示指令 v-qtip：深色底白字，hover/focus 立即弹出，fixed 定位 + 最高 z-index，
// 不受父级 overflow 裁剪 / stacking context / 其他弹层层级影响。
// 用法：<button v-qtip data-tip="提示内容">；data-tip 可动态更新，弹出时实时读取。
const bubble = document.createElement('div')
bubble.className = 'qtip-bubble'
bubble.setAttribute('aria-hidden', 'true')
document.body.appendChild(bubble)

let shownEl = null
const handlers = new WeakMap()

function onScroll() {
  hide()
}

function position(el) {
  const rect = el.getBoundingClientRect()
  bubble.textContent = el.getAttribute('data-tip') || ''
  // 先隐藏态放上去量宽度，再定最终位置（避免边缘溢出）
  bubble.style.visibility = 'hidden'
  bubble.style.opacity = '0'
  bubble.style.left = '0px'
  bubble.style.top = '0px'
  bubble.style.bottom = 'auto'
  const bw = bubble.offsetWidth
  let left = rect.left + rect.width / 2 - bw / 2
  left = Math.max(8, Math.min(left, window.innerWidth - bw - 8))
  // 视口上半区向下弹、下半区向上弹（顶部栏按钮向下、底部按钮向上）
  const down = rect.top < window.innerHeight / 2
  bubble.style.left = left + 'px'
  bubble.style.top = down ? rect.bottom + 7 + 'px' : 'auto'
  bubble.style.bottom = down ? 'auto' : window.innerHeight - rect.top + 7 + 'px'
  bubble.style.visibility = 'visible'
  bubble.style.opacity = '1'
}

function show(el) {
  if (el.disabled) return
  if (shownEl === el) return
  hide()
  shownEl = el
  position(el)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)
}

function hide() {
  if (!shownEl) return
  bubble.style.visibility = 'hidden'
  bubble.style.opacity = '0'
  shownEl = null
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
}

function bindEvents(el) {
  const h = {
    enter: () => show(el),
    leave: hide,
    focus: () => show(el),
    blur: hide,
  }
  handlers.set(el, h)
  el.addEventListener('mouseenter', h.enter)
  el.addEventListener('mouseleave', h.leave)
  el.addEventListener('focus', h.focus)
  el.addEventListener('blur', h.blur)
}

function unbindEvents(el) {
  const h = handlers.get(el)
  if (!h) return
  handlers.delete(el)
  el.removeEventListener('mouseenter', h.enter)
  el.removeEventListener('mouseleave', h.leave)
  el.removeEventListener('focus', h.focus)
  el.removeEventListener('blur', h.blur)
}

export const vQtip = {
  mounted(el) {
    bindEvents(el)
  },
  unmounted(el) {
    unbindEvents(el)
    if (shownEl === el) hide()
  },
}
