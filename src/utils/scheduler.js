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

// 加权随机出题 - 错题强化模式
// 70% 概率选出错率最高的韵母，30% 随机
export function getNextWeighted(pool, last, errorStats, weakStreak) {
  if (!pool.length) return ''
  if (pool.length === 1) return pool[0]
  
  // 找出有错误的韵母
  const weakItems = pool.filter(f => errorStats[f] && errorStats[f] > 0)
  
  // 30% 概率随机，70% 概率从错题中选
  const useRandom = Math.random() < 0.3 || weakItems.length === 0
  
  if (useRandom) {
    return getNextUniform(pool, last)
  }
  
  // 从错题中加权选择（错误次数越多，概率越大）
  // 排除正在连续正确的韵母
  const availableWeak = weakItems.filter(f => !weakStreak[f] || weakStreak[f] < 3)
  
  if (availableWeak.length === 0) {
    return getNextUniform(pool, last)
  }
  
  // 计算总权重
  let totalWeight = 0
  const weights = availableWeak.map(f => {
    const w = errorStats[f] || 1
    totalWeight += w
    return w
  })
  
  // 加权随机选择
  let r = Math.random() * totalWeight
  for (let i = 0; i < availableWeak.length; i++) {
    r -= weights[i]
    if (r <= 0) {
      const target = availableWeak[i]
      if (target !== last) return target
      // 如果选中的是上一个，换一个
      const nextIdx = (i + 1) % availableWeak.length
      return availableWeak[nextIdx]
    }
  }
  
  return availableWeak[availableWeak.length - 1]
}

