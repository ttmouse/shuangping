// 均匀随机出题，避免与上一题重复
export function getNextUniform(pool, last) {
  if (!pool.length) return ''
  if (pool.length === 1) return pool[0]
  let target = pool[Math.floor(Math.random() * pool.length)]
  if (pool.length > 1 && target === last) {
    // 强制换一个
    const idx = (pool.indexOf(target) + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length
    target = pool[idx]
  }
  return target
}

