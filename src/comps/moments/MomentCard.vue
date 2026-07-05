<template>
  <div class="card rounded-2xl shadow-sm mb-4 overflow-hidden">
    <div class="card-body p-4">
      <!-- 头部：头像、昵称、时间、编辑/删除按钮 -->
      <div class="d-flex align-items-center gap-3 mb-3">
        <img 
          :src="moment.result?.author?.avatar || '/static/avatar.png'" 
          class="img-fluid rounded-circle"
          style="width: 50px;"
          alt="avatar"
        />
        <div class="flex-grow-1">
          <router-link :to="`/author/${moment.result?.author?.id}`" class="fw-semibold text-body text-primary text-decoration-none">
            {{ moment.result?.author?.nickname || '未知用户' }}
          </router-link>
          <div class="text-muted text-xs">{{ formatTime(moment.create_time) }}</div>
        </div>
        <div v-if="isOwner" class="d-flex gap-1">
          <button 
            type="button" 
            class="btn btn-outline-secondary btn-xs"
            @click="$emit('edit', moment)"
          >
            <i class="bi bi-pencil"></i>
          </button>
          <button 
            type="button" 
            class="btn btn-outline-danger btn-xs"
            @click="$emit('delete', moment)"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
      
      <!-- 动态内容 - 增加换行处理 -->
      <p class="text-body text-sm mb-3 leading-relaxed moment-content">{{ moment.content }}</p>
      
      <!-- 图片网格 -->
      <div v-if="moment.images && moment.images.length > 0" class="moment-images-container">
        <div 
          :class="[
            'moment-images-grid',
            moment.images.length === 1 ? 'moment-grid-1' : 
            moment.images.length === 2 ? 'moment-grid-2' : 
            moment.images.length === 4 ? 'moment-grid-2' : 'moment-grid-3'
          ]"
        >
          <a 
            v-for="(img, index) in moment.images.slice(0, 9)" 
            :key="index" 
            :href="img"
            :data-fancybox="`moment-${moment.id}`"
            :data-caption="`${index + 1}/${moment.images.length}`"
            :class="[
              'moment-img-item',
              moment.images.length === 1 ? 'moment-img-single' : 
              moment.images.length === 2 ? 'moment-img-double' : 
              moment.images.length === 4 ? 'moment-img-double' : 'moment-img-grid'
            ]"
          >
            <img :src="img" class="moment-img" />
          </a>
        </div>
      </div>
      
      <!-- 位置信息 -->
      <div v-if="moment.location" class="d-flex align-items-center text-muted text-xs mb-3">
        <i class="bi bi-geo-alt me-1"></i>
        {{ moment.location }}
      </div>
      
      <!-- 操作栏：评论、点赞、收藏、分享 -->
      <div class="d-flex align-items-center gap-4 pt-3 border-top border-gray-100">
        <button 
          v-if="!hideCommentBtn"
          type="button" 
          :class="[
            'btn btn-link btn-sm d-flex align-items-center gap-1 p-0',
            commentExpanded ? 'text-primary' : 'text-muted'
          ]"
          @click="$emit('toggle-comment', moment)"
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
          @click="$emit('like', moment)"
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
          @click="$emit('collect', moment)"
        >
          <i :class="['bi', collectStatus ? 'bi-star-fill' : 'bi-star']"></i>
          <span>{{ moment.favorites || 0 }}</span>
        </button>
        <button 
          type="button" 
          class="btn btn-link text-muted btn-sm d-flex align-items-center gap-1 p-0 ms-auto"
          @click="$emit('share', moment)"
        >
          <i class="bi bi-share"></i>
          <span>分享</span>
        </button>
      </div>
      
      <!-- "X人觉得很赞" 提示 -->
      <div v-if="moment.likes && moment.likes > 0" class="mt-3 pt-3 border-top border-gray-100">
        <div class="d-flex align-items-center gap-1">
          <span class="text-sm"><i class="bi bi-heart-fill text-red-500"></i></span>
          <span class="text-muted text-xs">{{ moment.likes }} 人觉得很赞</span>
        </div>
      </div>

      <!-- 评论区域插槽 -->
      <slot name="comments"></slot>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import utils from '@/utils/utils'

defineProps({
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

defineEmits(['like', 'collect', 'share', 'toggle-comment', 'edit', 'delete'])

onMounted(() => {
  if (window.Fancybox) {
    window.Fancybox.bind("[data-fancybox]", {
      Hash: false,
      Thumbs: { autoStart: false }
    })
  }
})

const formatTime = (timestamp) => {
  if (utils.is.empty(timestamp)) return ''
  return utils.time.nature(timestamp, 5)
}
</script>

<style scoped>
/* 动态内容换行处理 */
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
}

.moment-img-single {
  max-width: 180px;
  max-height: 180px;
}

.moment-img-single .moment-img {
  object-fit: contain;
}

.moment-img-double {
  aspect-ratio: 1;
  width: 90px;
  height: 90px;
}

.moment-img-grid {
  aspect-ratio: 1;
  width: 90px;
  height: 90px;
}
</style>