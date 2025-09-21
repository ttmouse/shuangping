let audioCtx
let okBuffer = null
let badBuffer = null
let triedLoad = false
let okUrl = '/sounds/correct.mp3'
let badUrl = '/sounds/error.mp3'

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

// Play key sound with distinct tone for ok vs bad; consistent across rows
export function playKeySound(kind = 'ok', { volume = 0.18 } = {}) {
  const ctx = ensureCtx()
  if (!ctx) return
  resumeIfSuspended()

  const now = ctx.currentTime

  // If custom buffers available, use them; otherwise kick off lazy load
  if (kind === 'ok' && okBuffer) { playBuffer(okBuffer, { volume }); return }
  if (kind === 'bad' && badBuffer) { playBuffer(badBuffer, { volume }); return }
  if (!triedLoad) tryLoadBuffers()

  if (kind === 'ok') {
    // 保留轻微高通噪声“闪亮”，去除合成主旋律与点缀
    const nd = 0.08
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * nd), ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const nsrc = ctx.createBufferSource(); nsrc.buffer = buf
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.setValueAtTime(2200, now)
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.0001, now)
    ng.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.16), now + 0.012)
    ng.gain.exponentialRampToValueAtTime(0.0001, now + nd)
    nsrc.connect(hp); hp.connect(ng); ng.connect(ctx.destination)
    nsrc.start(now); nsrc.stop(now + nd)
    nsrc.onended = () => { try { nsrc.disconnect(); hp.disconnect(); ng.disconnect() } catch {} }
  } else {
    // 错误音效：使用之前的“清脆单击”作为错误提示，清晰但不刺耳
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(540, now)
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.07)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.9), now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(now); osc.stop(now + 0.11)
    osc.onended = () => { try { osc.disconnect(); gain.disconnect() } catch {} }
  }
}

export async function loadCustomSounds() {
  return await tryLoadBuffers()
}
