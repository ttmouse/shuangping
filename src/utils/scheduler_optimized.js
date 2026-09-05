// 实现滑动窗口去重与难度加权机制

// 原始逻辑：getNextUniform 和 getNextWeighted 过于简单，导致高频重复。
// 改进思路：
// 1. 维护一个长度为 windowSize 的 history 队列，确保新题不在该队列中。
// 2. 根据 errorStats 为韵母分配不同的抽题权重，让错误率高的题目出现频率更高。

const WINDOW_SIZE = 6; // 记忆窗口，避免6题内重复

export function getNextQuestion(pool, stats, history) {
  // 1. 过滤掉历史窗口中的题目
  const recentHistory = history.slice(-WINDOW_SIZE);
  const eligiblePool = pool.filter(q => !recentHistory.includes(q));

  // 2. 计算加权概率
  // 错误率越高，权重越大
  const weightedPool = eligiblePool.map(q => {
    const errorCount = stats[q] || 0;
    // 基础权重 1，错误每增加 1 次，权重增加 2
    return { q, weight: 1 + (errorCount * 2) };
  });

  // 3. 加权随机算法
  const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of weightedPool) {
    random -= item.weight;
    if (random <= 0) return item.q;
  }

  // Fallback
  return eligiblePool[0] || pool[0];
}
