<template>
  <div v-if="showPicker" class="emoji-picker-panel border bg-body shadow-sm" :class="{ 'bg-dark border-secondary': isDarkMode }">
    <!-- 表情分类导航 -->
    <ul class="nav nav-pills px-2 pt-2 pb-1" role="tablist">
      <li class="nav-item" v-for="(emojis, category) in owoEmojis" :key="category">
        <button 
          class="nav-link rounded-3 px-3 py-1 mb-1"
          :class="activeCategory === category ? 'active bg-primary text-white' : 'text-secondary'"
          @click="activeCategory = category"
          type="button"
          role="tab"
        >
          {{ category }}
        </button>
      </li>
    </ul>
    <!-- 表情网格 -->
    <div class="emoji-grid px-2 pb-2">
      <button 
        v-for="(emoji, index) in owoEmojis[activeCategory].container" 
        :key="index"
        @click="selectEmoji(emoji.icon)"
        class="emoji-btn rounded-2"
        :title="emoji.text"
        type="button"
      >
        {{ emoji.icon }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import owoJson from '@/assets/json/OwO.json'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const showPicker = ref(props.modelValue)
const activeCategory = ref(Object.keys(owoJson)[0])
const owoEmojis = ref(owoJson)

const selectEmoji = (emoji) => {
  emit('select', emoji)
  showPicker.value = false
  emit('update:modelValue', false)
}

const handleClickOutside = (event) => {
  const emojiPickers = event.target.closest('.emoji-picker-panel')
  const emojiButtons = event.target.closest('[title="表情"], .emoji-button')
  if (!emojiPickers && !emojiButtons) {
    showPicker.value = false
    emit('update:modelValue', false)
  }
}

watch(() => props.modelValue, (newVal) => {
  showPicker.value = newVal
})

watch(showPicker, (newVal) => {
  if (newVal !== props.modelValue) {
    emit('update:modelValue', newVal)
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.emoji-picker-panel {
  animation: emojiFadeIn 0.2s ease;
  max-height: 200px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@keyframes emojiFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
  padding: 6px;
  max-height: 150px;
}

.emoji-grid::-webkit-scrollbar {
  width: 6px;
}

.emoji-grid::-webkit-scrollbar-track {
  background: transparent;
}

.emoji-grid::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.3);
  border-radius: 3px;
}

.emoji-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.5);
}

.emoji-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 32px;
  padding: 4px 8px;
  font-size: 14px;
  font-family: 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 8px;
  line-height: 1.2;
  color: inherit;
  flex-shrink: 0;
}

.emoji-btn:hover {
  background: rgba(var(--bs-primary-rgb), 0.2);
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.emoji-btn:active {
  transform: scale(0.95);
}

:deep(.nav-pills .nav-link) {
  transition: all 0.2s ease;
  font-size: 0.85rem;
  font-weight: 500;
}

:deep(.nav-pills .nav-link:hover:not(.active)) {
  background: rgba(var(--bs-primary-rgb), 0.1);
  color: var(--bs-primary);
}

:deep(.nav-pills .nav-link.active) {
  box-shadow: 0 2px 4px rgba(var(--bs-primary-rgb), 0.3);
}

/* 深色模式 */
:deep(.bg-dark .emoji-grid) {
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

:deep(.bg-dark .emoji-grid::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.2);
}

:deep(.bg-dark .emoji-btn) {
  background: rgba(255, 255, 255, 0.08);
}

:deep(.bg-dark .emoji-btn:hover) {
  background: rgba(255, 255, 255, 0.15);
}

:deep(.bg-dark .nav-pills .nav-link:hover:not(.active)) {
  background: rgba(255, 255, 255, 0.1);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .emoji-grid {
    gap: 4px;
    padding: 4px;
  }

  .emoji-btn {
    min-width: 28px;
    min-height: 28px;
    padding: 3px 6px;
    font-size: 12px;
    border-radius: 6px;
  }
}
</style>
