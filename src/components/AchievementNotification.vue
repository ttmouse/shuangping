<template>
  <TransitionGroup name="achievement" tag="div" class="achievement-notifications">
    <div
      v-for="achievement in notifications"
      :key="achievement.id"
      class="achievement-toast"
      :class="{ 'rare': isRare(achievement) }"
    >
      <div class="achievement-icon">{{ achievement.icon }}</div>
      <div class="achievement-content">
        <div class="achievement-title">解锁成就</div>
        <div class="achievement-name">{{ achievement.name }}</div>
        <div class="achievement-desc">{{ achievement.description }}</div>
      </div>
      <div class="achievement-shine"></div>
    </div>
  </TransitionGroup>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  newAchievements: {
    type: Array,
    default: () => []
  }
})

const notifications = ref([])
const RARE_ACHIEVEMENTS = ['ten-thousand', 'streak-30', 'combo-50', 'accuracy-95']

function isRare(achievement) {
  return RARE_ACHIEVEMENTS.includes(achievement.id)
}

watch(() => props.newAchievements, (newVals) => {
  if (newVals?.length) {
    newVals.forEach((achievement, index) => {
      setTimeout(() => {
        notifications.value.push(achievement)
        setTimeout(() => {
          const idx = notifications.value.findIndex(a => a.id === achievement.id)
          if (idx > -1) notifications.value.splice(idx, 1)
        }, 4000)
      }, index * 500)
    })
  }
}, { deep: true })
</script>

<style scoped>
.achievement-notifications {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.achievement-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #35e2b7;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(53, 226, 183, 0.3), 0 0 0 1px rgba(53, 226, 183, 0.1);
  min-width: 280px;
  position: relative;
  overflow: hidden;
  pointer-events: auto;
}

.achievement-toast.rare {
  border-color: #ffd700;
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.4), 0 0 0 1px rgba(255, 215, 0, 0.2);
  animation: rareGlow 2s ease-in-out infinite;
}

@keyframes rareGlow {
  0%, 100% { box-shadow: 0 8px 32px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.2); }
  50% { box-shadow: 0 8px 32px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.4); }
}

.achievement-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  animation: shine 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

.achievement-icon {
  font-size: 40px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.achievement-content {
  flex: 1;
}

.achievement-title {
  font-size: 11px;
  color: #35e2b7;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.achievement-toast.rare .achievement-title {
  color: #ffd700;
}

.achievement-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 2px;
}

.achievement-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* Transition animations */
.achievement-enter-active {
  animation: achievementSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.achievement-leave-active {
  animation: achievementSlideOut 0.3s ease-in;
}

@keyframes achievementSlideIn {
  0% {
    transform: translateX(120%) scale(0.8);
    opacity: 0;
  }
  70% {
    transform: translateX(-10%) scale(1.02);
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes achievementSlideOut {
  0% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(120%) scale(0.8);
    opacity: 0;
  }
}

/* Mobile responsive */
@media (max-width: 600px) {
  .achievement-notifications {
    top: 70px;
    right: 10px;
    left: 10px;
  }

  .achievement-toast {
    min-width: auto;
    padding: 14px 16px;
  }

  .achievement-icon {
    font-size: 32px;
  }

  .achievement-name {
    font-size: 16px;
  }
}
</style>
