<template>
  <div class="moment-card card rounded-2xl shadow-sm mb-4 overflow-hidden">
    <div class="card-body p-4">
      <!-- 头部：头像、昵称、时间、编辑/删除按钮 -->
      <div class="d-flex align-items-center gap-3 mb-3">
        <img
          :src="authorAvatar"
          class="img-fluid rounded-circle moment-avatar"
          alt="avatar"
          loading="lazy"
        />
        <div class="flex-grow-1">
          <router-link
            :to="`/author/${authorId}`"
            class="fw-semibold text-body text-primary text-decoration-none"
          >
            {{ authorNickname }}
          </router-link>
          <div class="text-muted text-xs">{{ createTimeText }}</div>
        </div>
        <div v-if="isOwner" class="d-flex gap-1">
          <button
            type="button"
            class="btn btn-outline-secondary btn-xs"
            @click="handleEdit"
          >
            <i class="bi bi-pencil"></i>
          </button>
          <button
            type="button"
            class="btn btn-outline-danger btn-xs"
            @click="handleDelete"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>

      <!-- 动态内容 -->
      <p class="moment-content text-body text-sm mb-3 leading-relaxed">
        {{ moment.content }}
      </p>

      <!-- 图片网格 -->
      <div v-if="moment.images && moment.images.length > 0" class="moment-images-container">
        <div :class="gridClass" class="moment-images-grid">
          <div
            v-for="(img, index) in displayImages"
            :key="index"
            :data-fancybox="fancyboxGroupKey"
            :data-caption="`${index + 1}/${moment.images.length}`"
            class="moment-img-item"
          >
            <img
              :src="img"
              class="moment-img"
              loading="lazy"
              alt="moment-image"
            />
          </div>
        </div>
      </div>

      <!-- 位置信息 -->
      <div v-if="moment.location" class="d-flex align-items-center text-muted text-xs mb-3">
        <i class="bi bi-geo-alt me-1"></i>
        {{ moment.location }}
      </div>

      <!-- 操作栏 -->
      <div class="d-flex align-items-center gap-4 pt-3 border-top border-gray-100">
        <button
          v-if="!hideCommentBtn"
          type="button"
          :class="[
            'btn btn-link btn-sm d-flex align-items-center gap-1 p-0',
            commentExpanded ? 'text-primary' : 'text-muted'
          ]"
          @click="handleToggleComment"
        >
          <i class="bi bi-chat"></i>
          <span>{{ moment.comment_count || 0 }}</span>
        </button>
        <button
          type="button"
          :class="[
            'btn btn-link btn-sm d-flex align-items-center gap-1 p-0',
            likeStatus ? 'text-red-500' : 'text-muted'
          ]"
          @click="handleLike"
        >
          <i :class="['bi', likeStatus ? 'bi-heart-fill' : 'bi-heart']"></i>
          <span>{{ moment.likes || 0 }}</span>
        </button>
        <button
          type="button"
          :class="[
            'btn btn-link btn-sm d-flex align-items-center gap-1 p-0',
            collectStatus ? 'text-yellow-500' : 'text-muted'
          ]"
          @click="handleCollect"
        >
          <i :class="['bi', collectStatus ? 'bi-star-fill' : 'bi-star']"></i>
          <span>{{ moment.favorites || 0 }}</span>
        </button>
        <button
          type="button"
          class="btn btn-link text-muted btn-sm d-flex align-items-center gap-1 p-0 ms-auto"
          @click="handleShare"
        >
          <i class="bi bi-share"></i>
          <span>分享</span>
        </button>
      </div>

      <!-- 点赞提示 -->
      <div
        v-if="moment.likes && moment.likes > 0"
        class="mt-3 pt-3 border-top border-gray-100"
      >
        <div class="d-flex align-items-center gap-1">
          <span class="text-sm"><i class="bi bi-heart-fill text-red-500"></i></span>
          <span class="text-muted text-xs">{{ moment.likes }} 人觉得很赞</span>
        </div>
      </div>

      <!-- 评论插槽 -->
      <slot name="comments"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import utils from '@/utils/utils'

// ====================== 常量统一管理 ======================
const CONST = {
  DEFAULT_AVATAR: '/static/avatar.png',
  MAX_IMAGE_COUNT: 9
}

const props = defineProps({
  moment: {
    type: Object,
    required: true
  },
  likeStatus: {
    type: Boolean,
    default: false
  },
  collectStatus: {
    type: Boolean,
    default: false
  },
  isOwner: {
    type: Boolean,
    default: false
  },
  commentExpanded: {
    type: Boolean,
    default: false
  },
  hideCommentBtn: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'like',
  'collect',
  'share',
  'toggle-comment',
  'edit',
  'delete'
])

// 快捷取值计算属性，消除模板大量可选链
const authorInfo = computed(() => props.moment.result?.author || {})
const authorAvatar = computed(() => authorInfo.value.avatar || CONST.DEFAULT_AVATAR)
const authorNickname = computed(() => authorInfo.value.nickname || '未知用户')
const authorId = computed(() => authorInfo.value.id)
const createTimeText = computed(() => formatTime(props.moment.create_time))

// fancybox 分组唯一标识，隔离不同动态预览组
const fancyboxGroupKey = computed(() => `moment-${props.moment.id}`)
// 最多展示9张图片
const displayImages = computed(() => (props.moment.images || []).slice(0, CONST.MAX_IMAGE_COUNT))

// 图片网格class优化，消除超长三元
const gridClass = computed(() => {
  const len = displayImages.value.length
  if (len === 1) return 'moment-grid-1'
  if (len === 2 || len === 4) return 'moment-grid-2'
  return 'moment-grid-3'
})

// ====================== 工具函数 ======================
function formatTime(timestamp) {
  if (utils.is.empty(timestamp)) return ''
  return utils.time.nature(timestamp, 5)
}

// ====================== 事件封装（方便后续增加防抖、loading拦截） ======================
const handleEdit = () => emit('edit', props.moment)
const handleDelete = () => emit('delete', props.moment)
const handleToggleComment = () => emit('toggle-comment', props.moment)
const handleLike = () => emit('like', props.moment)
const handleCollect = () => emit('collect', props.moment)
const handleShare = () => emit('share', props.moment)

// ====================== Fancybox 修复：避免重复绑定 ======================
let fancyboxInstance = null
onMounted(() => {
  if (!window.Fancybox) return
  // 只绑定当前组件内分组，全局不会冲突
  fancyboxInstance = window.Fancybox.bind(`[data-fancybox="${fancyboxGroupKey.value}"]`, {
    Hash: false,
    Thumbs: { autoStart: false }
  })
})

// 组件卸载销毁预览绑定，防止内存泄漏、重复绑定
onUnmounted(() => {
  if (fancyboxInstance) {
    fancyboxInstance.destroy()
    fancyboxInstance = null
  }
})
</script>

<style scoped>
.moment-card {
  width: 100%;
}

.moment-avatar {
  width: 50px;
}

/* 动态内容换行 */
.moment-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
}

.moment-images-container {
  margin-bottom: 12px;
}

.moment-images-grid {
  display: grid;
  width: fit-content;
  gap: 2px;
}

.moment-grid-1 {
  grid-template-columns: 1fr;
}

.moment-grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.moment-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.moment-img-item {
  overflow: hidden;
  cursor: pointer;
  display: block;
}

.moment-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.moment-img:hover {
  transform: scale(1.03);
}

/* 单图特殊样式 */
:deep(.moment-grid-1 .moment-img-item) {
  max-width: 180px;
  max-height: 180px;
}
:deep(.moment-grid-1 .moment-img) {
  object-fit: contain;
}

/* 双图/三图格子统一尺寸 */
:deep(.moment-grid-2 .moment-img-item),
:deep(.moment-grid-3 .moment-img-item) {
  aspect-ratio: 1;
  width: 90px;
  height: 90px;
}
</style>