// 音效播放（WebAudio：mp3 → AudioBuffer 缓存 → 播放）
// 现支持多音效 kind：ok / bad / combo / victory / error
// 文件放 public/sounds/，运行时 fetch 解码后播放
let audioCtx = null
const buffers = {}            // kind -> AudioBuffer|null
const urls = {
  ok: '/sounds/ting.mp3',
  bad: '/sounds/cuowu.mp3',
  combo: '/sounds/combo.mp3',
  victory: '/sounds/victory.mp3',
  error: '/sounds/error.mp3',
}
let triedLoad = false

function ensureCtx() {
  if (audioCtx) return audioCtx
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioCtx = new Ctx()
  return audioCtx
}

export function resumeIfSuspended() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume?.()
  }
}

export function setSoundURLs({ ok, bad, combo, victory, error } = {}) {
  if (ok) urls.ok = ok
  if (bad) urls.bad = bad
  if (combo) urls.combo = combo
  if (victory) urls.victory = victory
  if (error) urls.error = error
  for (const k of Object.keys(buffers)) buffers[k] = null
  triedLoad = false
}

async function tryLoadBuffers() {
  if (triedLoad) return buffers
  triedLoad = true
  const ctx = ensureCtx()
  if (!ctx) return buffers
  resumeIfSuspended()
  async function loadOne(kind, url) {
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      const arr = await res.arrayBuffer()
      return await ctx.decodeAudioData(arr)
    } catch { return null }
  }
  const jobs = Object.entries(urls).map(async ([kind, url]) => {
    buffers[kind] = await loadOne(kind, url)
  })
  await Promise.all(jobs)
  return buffers
}

function playBuffer(buf, { volume = 0.18 } = {}) {
  if (!buf) return
  const ctx = ensureCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = buf
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + 0.008)
  // natural tail with safety decay
  const dur = buf.duration
  const stopAt = now + dur
  gain.gain.setValueAtTime(Math.max(0.001, volume), stopAt - 0.06)
  gain.gain.exponentialRampToValueAtTime(0.0001, stopAt)
  src.connect(gain)
  gain.connect(ctx.destination)
  src.start(now)
  src.stop(stopAt + 0.02)
}

// Play key sound using audio files only（kind: ok/bad/combo/victory/error）
export function playKeySound(kind = 'ok', { volume = 0.18 } = {}) {
  const ctx = ensureCtx()
  if (!ctx) return
  resumeIfSuspended()
  if (!triedLoad) tryLoadBuffers()
  const buffer = buffers[kind]
  if (buffer) {
    playBuffer(buffer, { volume })
  }
}

export async function loadCustomSounds() {
  return await tryLoadBuffers()
}
