let audioCtx
let okBuffer = null
let badBuffer = null
let triedLoad = false
let okUrl = '/sounds/ting.mp3'
let badUrl = '/sounds/cuowu.mp3'

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

export function setSoundURLs({ ok, bad } = {}) {
  if (ok) okUrl = ok
  if (bad) badUrl = bad
  okBuffer = badBuffer = null
  triedLoad = false
}

async function tryLoadBuffers() {
  if (triedLoad) return { ok: !!okBuffer, bad: !!badBuffer }
  triedLoad = true
  const ctx = ensureCtx()
  if (!ctx) return { ok: false, bad: false }
  resumeIfSuspended()
  async function loadOne(url) {
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      const arr = await res.arrayBuffer()
      return await ctx.decodeAudioData(arr)
    } catch { return null }
  }
  const [ok, bad] = await Promise.all([loadOne(okUrl), loadOne(badUrl)])
  okBuffer = ok
  badBuffer = bad
  return { ok: !!okBuffer, bad: !!badBuffer }
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
  const endAt = now + (buf.duration || 0.35)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.6), endAt - 0.02)
  src.connect(gain); gain.connect(ctx.destination)
  src.start(now)
  src.stop(endAt + 0.02)
  src.onended = () => { try { src.disconnect(); gain.disconnect() } catch {} }
}

// Play key sound using audio files only
export function playKeySound(kind = 'ok', { volume = 0.18 } = {}) {
  const ctx = ensureCtx()
  if (!ctx) return
  resumeIfSuspended()

  // Load audio buffers if not already loaded
  if (!triedLoad) tryLoadBuffers()

  // Play the appropriate buffer
  const buffer = kind === 'ok' ? okBuffer : badBuffer
  if (buffer) {
    playBuffer(buffer, { volume })
  }
}

export async function loadCustomSounds() {
  return await tryLoadBuffers()
}
