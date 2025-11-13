// Play pronunciation audio for a given final using remote resources.
// Attempts several URL patterns from yunmu.hanyupinyin.cn; caches on first success.

const cache = new Map() // final -> resolved URL string
let audioEl = null
let lastPlayAt = 0

function getAudio() {
  if (!audioEl) {
    audioEl = new Audio()
    audioEl.preload = 'none'
    audioEl.crossOrigin = 'anonymous'
    audioEl.volume = 0.9
  }
  return audioEl
}

function candidateUrls(final) {
  // Only use local assets; never reach online addresses at runtime
  const f = String(final || '').toLowerCase()
  return [
    `/finals/${f}.mp3`,
    `/sounds/finals/${f}.mp3`,
  ]
}

async function tryPlayUrl(url) {
  return new Promise((resolve, reject) => {
    const a = getAudio()
    let settled = false
    a.onended = () => { if (!settled) { settled = true; resolve() } }
    a.onerror = () => { if (!settled) { settled = true; reject(new Error('audio error')) } }
    a.oncanplay = () => { /* no-op */ }
    try {
      a.src = url
      const p = a.play()
      if (p && typeof p.then === 'function') {
        p.then(() => { /* started */ }).catch(() => reject(new Error('play blocked'))) }
    } catch (e) {
      reject(e)
    }
    // safety timeout to reject quickly if cannot play
    setTimeout(() => { if (!settled && a.paused) reject(new Error('timeout')) }, 1200)
  })
}

export async function playFinalAudio(final) {
  const now = Date.now()
  // throttle rapid replays within 120ms
  if (now - lastPlayAt < 120) return
  lastPlayAt = now
  if (!final) return

  const key = String(final).toLowerCase()
  if (cache.has(key)) {
    try { await tryPlayUrl(cache.get(key)); return } catch {}
  }
  const urls = candidateUrls(key)
  for (const u of urls) {
    try {
      await tryPlayUrl(u)
      cache.set(key, u)
      return
    } catch {}
  }
  // No fallback: if no audio found, stay silent as requested
}
