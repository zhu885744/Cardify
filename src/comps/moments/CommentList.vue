<template>
  <div class="comments-section">
    <div v-if="!commentAllow && !commentShow" class="text-center py-2 text-muted text-sm">
      评论功能已关闭
    </div>
    
    <div v-else-if="commentAllow" class="comment-input-wrapper">
      <input 
        type="text" 
        v-model="commentContent" 
        class="comment-input"
        placeholder="写下你的评论..."
        @keyup.enter="submitComment"
      />
      <button 
        type="button" 
        class="comment-submit-btn"
        @click="submitComment"
        :disabled="!commentContent.trim()"
      >
        发送
      </button>
    </div>
    
    <div v-if="commentShow && commentsLoading" class="text-center py-2">
      <div class="spinner-border spinner-border-sm" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    
    <div v-else-if="commentShow && comments.length === 0" class="text-center py-4 text-muted text-sm">
      暂无评论，来抢沙发吧~
    </div>
    
    <div v-else-if="commentShow" class="comments-list">
      <div 
        v-for="comment in comments" 
        :key="comment.id" 
        class="comment-item"
      >
        <img 
          :src="comment.result?.author?.avatar || '/static/avatar.png'" 
          class="comment-avatar"
          alt="avatar"
        />
        <div class="comment-content">
          <div class="comment-header">
            <span class="comment-nickname">{{ comment.result?.author?.nickname || '未知用户' }}</span>
            <span class="comment-time">{{ formatTime(comment.create_time) }}</span>
          </div>
          <p class="comment-text">{{ comment.content }}</p>
          <div class="comment-actions">
            <button 
              type="button" 
              :class="[
                'comment-action-btn',
                commentLikeStatus[comment.id] ? 'liked' : ''
              ]"
              @click="handleCommentLike(comment)"
            >
              <i :class="['bi', commentLikeStatus[comment.id] ? 'bi-heart-fill' : 'bi-heart']"></i>
              <span v-if="commentLikeCounts[comment.id] && commentLikeCounts[comment.id] > 0">{{ commentLikeCounts[comment.id] }}</span>
            </button>
            <button 
              type="button" 
              class="comment-action-btn"
              @click="replyToComment(comment)"
            >
              <span>回复</span>
            </button>
          </div>
          
          <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
            <div 
              v-for="reply in comment.replies" 
              :key="reply.id" 
              class="reply-item"
            >
              <img 
                :src="reply.result?.author?.avatar || '/static/avatar.png'" 
                class="reply-avatar"
                alt="avatar"
              />
              <div class="reply-content">
                <div class="reply-header">
                  <span class="reply-nickname">{{ reply.result?.author?.nickname || '未知用户' }}</span>
                  <span class="reply-time">{{ formatTime(reply.create_time) }}</span>
                </div>
                <p class="reply-text">
                  <span v-if="reply.replyToAuthor" class="reply-to">回复 @{{ reply.replyToAuthor.nickname }}：</span>
                  {{ reply.content }}
                </p>
                <div class="reply-actions">
                  <button 
                    type="button" 
                    :class="[
                      'reply-action-btn',
                      commentLikeStatus[reply.id] ? 'liked' : ''
                    ]"
                    @click="handleCommentLike(reply)"
                  >
                    <i :class="['bi', commentLikeStatus[reply.id] ? 'bi-heart-fill' : 'bi-heart']"></i>
                    <span v-if="commentLikeCounts[reply.id] && commentLikeCounts[reply.id] > 0">{{ commentLikeCounts[reply.id] }}</span>
                  </button>
                  <button 
                    type="button" 
                    class="reply-action-btn"
                    @click="replyToComment(reply)"
                  >
                    <span>回复</span>
                  </button>
                </div>
                
                <div v-if="replyingCommentId === reply.id" class="sub-reply-input-wrapper">
                  <input 
                    type="text" 
                    v-model="replyContent" 
                    class="reply-input"
                    :placeholder="`回复 ${reply.result?.author?.nickname || '用户'}...`"
                    @keyup.enter="submitReply(reply)"
                  />
                  <button 
                    type="button" 
                    class="reply-submit-btn"
                    @click="submitReply(reply)"
                    :disabled="!replyContent.trim()"
                  >
                    回复
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="replyingCommentId === comment.id" class="reply-input-wrapper">
            <input 
              type="text" 
              v-model="replyContent" 
              class="reply-input"
              :placeholder="`回复 ${comment.result?.author?.nickname || '用户'}...`"
              @keyup.enter="submitReply(comment)"
            />
            <button 
              type="button" 
              class="reply-submit-btn"
              @click="submitReply(comment)"
              :disabled="!replyContent.trim()"
            >
              回复
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="commentShow && !commentsLoading && hasMore && comments.length > 0" class="load-more-wrapper">
        <button 
          type="button" 
          class="load-more-btn"
          @click="loadMoreComments"
          :disabled="loadingMore"
        >
          <span v-if="loadingMore" class="spinner-border spinner-border-sm me-2"></span>
          {{ loadingMore ? '加载中...' : '加载更多评论' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useCommStore } from '@/store/comm'
import { request } from '@/utils/network'
import { toast } from '@/utils/app'
import utils from '@/utils/utils'

const props = defineProps({
  bindId: {
    type: [Number, String],
    required: true
  },
  bindType: {
    type: String,
    default: 'moments'
  }
})

const emit = defineEmits(['comment-added'])

const store = useCommStore()

const comments = ref([])
const commentsLoading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = 10
const commentContent = ref('')
const replyingCommentId = ref(null)
const replyContent = ref('')
const commentLikeStatus = reactive({})
const commentLikeCounts = reactive({})

const momentsConfig = computed(() => {
  const config = store.siteInfo?.config?.MOMENTS || {}
  try {
    return typeof config === 'string' ? JSON.parse(config) : config
  } catch {
    return {}
  }
})

const commentAllow = computed(() => {
  return momentsConfig.value.comment?.allow !== 0
})

const commentShow = computed(() => {
  return momentsConfig.value.comment?.show !== 0
})

const isLogin = () => {
  const loginState = store.getLogin
  return loginState.finish && !utils.is.empty(loginState.user)
}

const formatTime = (timestamp) => {
  if (utils.is.empty(timestamp)) return ''
  return utils.time.nature(timestamp, 5)
}

const buildCommentTree = (comments) => {
  const map = {}
  const roots = []
  const idToRootId = {}
  
  comments.forEach(c => {
    map[c.id] = { ...c, replies: [], replyToAuthor: null }
    if (!c.pid) {
      idToRootId[c.id] = c.id
    }
  })
  
  comments.forEach(c => {
    if (c.pid) {
      let rootId = idToRootId[c.pid]
      if (!rootId) {
        let parent = map[c.pid]
        while (parent && parent.pid) {
          parent = map[parent.pid]
          if (parent && idToRootId[parent.id]) {
            rootId = idToRootId[parent.id]
            break
          }
        }
        if (!rootId && map[c.pid] && !map[c.pid].pid) {
          rootId = c.pid
        }
        if (rootId) {
          idToRootId[c.id] = rootId
        }
      } else {
        idToRootId[c.id] = rootId
      }
      
      const originalParent = map[c.pid]
      if (originalParent && originalParent.result?.author) {
        map[c.id].replyToAuthor = originalParent.result.author
      }
      
      if (!map[c.pid] || map[c.pid].pid === 0) {
        if (map[c.pid]) {
          map[c.pid].replies.push(map[c.id])
        } else if (rootId && map[rootId]) {
          map[rootId].replies.push(map[c.id])
        }
      } else {
        const rootComment = map[rootId]
        if (rootComment) {
          rootComment.replies.push(map[c.id])
        }
      }
    } else if (!c.pid) {
      roots.push(map[c.id])
    }
  })
  
  return roots
}

const loadLikeStatus = async (commentIds) => {
  if (!isLogin() || commentIds.length === 0) return
  
  const userId = String(store.login.user.id)
  
  for (const id of commentIds) {
    try {
      const statusWhere = JSON.stringify({ uid: userId, bind_id: id, type: 'like', bind_type: 'comment', state: 1 })
      const countWhere = JSON.stringify({ bind_id: id, type: 'like', bind_type: 'comment', state: 1 })
      
      const [statusRes, countRes] = await Promise.all([
        request.get('/api/exp/one', { where: statusWhere }),
        request.get('/api/exp/count', { where: countWhere })
      ])
      
      commentLikeStatus[id] = statusRes.code === 200 && !!statusRes.data
      commentLikeCounts[id] = countRes.code === 200 ? (countRes.data || 0) : 0
    } catch (error) {
      commentLikeStatus[id] = false
      commentLikeCounts[id] = 0
    }
  }
}

const loadComments = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    comments.value = []
    hasMore.value = true
  }
  
  const loadingRef = reset ? commentsLoading : loadingMore
  loadingRef.value = true
  
  try {
    const { code, data: resData } = await request.get('/api/moments/comment', {
      bind_id: props.bindId,
      order: 'create_time desc',
      page: currentPage.value,
      limit: pageSize
    })

    if (code == 200) {
      const data = resData.data || []
      const treeData = buildCommentTree(data)
      if (reset) {
        comments.value = treeData
      } else {
        comments.value = [...comments.value, ...treeData]
      }
      hasMore.value = data.length === pageSize
      
      const commentIds = data.map(c => c.id)
      await loadLikeStatus(commentIds)
    }
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    loadingRef.value = false
  }
}

const loadMoreComments = () => {
  if (loadingMore.value || !hasMore.value) return
  currentPage.value++
  loadComments()
}

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    toast.warning('请输入评论内容')
    return
  }
  if (!isLogin()) {
    toast.warning('请登录后再评论')
    return
  }

  try {
    const { code, msg } = await request.post('/api/comment/create', {
      content: commentContent.value.trim(),
      bind_id: props.bindId,
      bind_type: props.bindType
    })

    if (code === 200) {
      toast.success(msg || '评论成功')
      commentContent.value = ''
      emit('comment-added')
      loadComments(true)
    } else if (code === 400) {
      toast.error(msg || '评论失败')
    } else if (code === 429) {
      toast.warning(msg || '评论过于频繁，请稍后再试')
    } else {
      toast.error(msg || '评论失败')
    }
  } catch (error) {
    toast.error('评论失败：' + (error.message || '请稍后重试'))
  }
}

const replyToComment = (comment) => {
  if (replyingCommentId.value === comment.id) {
    replyingCommentId.value = null
    replyContent.value = ''
  } else {
    replyingCommentId.value = comment.id
    replyContent.value = ''
  }
}

const submitReply = async (comment) => {
  if (!replyContent.value.trim()) {
    toast.warning('请输入回复内容')
    return
  }
  if (!isLogin()) {
    toast.warning('请登录后再回复')
    return
  }

  try {
    const { code, msg } = await request.post('/api/comment/create', {
      content: replyContent.value.trim(),
      bind_id: props.bindId,
      bind_type: props.bindType,
      pid: comment.id
    })

    if (code === 200) {
      toast.success(msg || '回复成功')
      replyContent.value = ''
      replyingCommentId.value = null
      loadComments(true)
    } else if (code === 400) {
      toast.error(msg || '回复失败')
    } else if (code === 429) {
      toast.warning(msg || '评论过于频繁，请稍后再试')
    } else {
      toast.error(msg || '回复失败')
    }
  } catch (error) {
    toast.error('回复失败：' + (error.message || '请稍后重试'))
  }
}

const handleCommentLike = async (comment) => {
  if (!isLogin()) {
    toast.warning('请登录后再操作')
    return
  }

  const commentId = comment.id
  const currentStatus = !!commentLikeStatus[commentId]
  const newStatus = !currentStatus
  const userId = String(store.login.user.id)

  commentLikeStatus[commentId] = newStatus
  commentLikeCounts[commentId] = Math.max(0, (commentLikeCounts[commentId] || 0) + (newStatus ? 1 : -1))

  try {
    const { code, msg } = await request.post('/api/exp/like', {
      bind_type: 'comment',
      bind_id: commentId,
      state: currentStatus ? 0 : 1,
      uid: userId,
      description: '评论点赞'
    })

    if (code == 200) {
      toast.success(newStatus ? '点赞成功' : '取消点赞成功')
    } else if (code == 202) {
      commentLikeStatus[commentId] = currentStatus
      commentLikeCounts[commentId] = Math.max(0, (commentLikeCounts[commentId] || 0) + (currentStatus ? 1 : -1))
      toast.warning(msg || '已经点过赞啦！')
    } else {
      commentLikeStatus[commentId] = currentStatus
      commentLikeCounts[commentId] = Math.max(0, (commentLikeCounts[commentId] || 0) + (currentStatus ? 1 : -1))
      toast.error(msg || '操作失败')
    }
  } catch (error) {
    commentLikeStatus[commentId] = currentStatus
    commentLikeCounts[commentId] = Math.max(0, (commentLikeCounts[commentId] || 0) + (currentStatus ? 1 : -1))
    toast.error('操作失败，请稍后重试')
  }
}

watch(() => props.bindId, (newId) => {
  if (newId && commentShow.value) {
    loadComments(true)
  }
}, { immediate: true })

watch(commentShow, (show) => {
  if (show && props.bindId) {
    loadComments(true)
  }
})
</script>

<style scoped>
.comments-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.comment-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.comment-input {
  flex-grow: 1;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.comment-input:focus {
  border-color: #4f46e5;
}

.comment-submit-btn {
  padding: 8px 16px;
  background-color: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.comment-submit-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 8px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex-grow: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-nickname {
  font-weight: 500;
  font-size: 13px;
  color: #374151;
}

.comment-time {
  font-size: 12px;
  color: #9ca3af;
}

.comment-text {
  font-size: 14px;
  color: #1f2937;
  line-height: 1.5;
  margin-bottom: 6px;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.comment-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s;
}

.comment-action-btn:hover {
  color: #4f46e5;
}

.comment-action-btn.liked {
  color: #ef4444;
}

.comment-replies {
  margin-top: 8px;
  padding-left: 44px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-item {
  display: flex;
  gap: 6px;
}

.reply-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.reply-content {
  flex-grow: 1;
  min-width: 0;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.reply-nickname {
  font-weight: 500;
  font-size: 12px;
  color: #374151;
}

.reply-time {
  font-size: 11px;
  color: #9ca3af;
}

.reply-text {
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
  margin-bottom: 4px;
  word-break: break-word;
}

.reply-to {
  color: #4f46e5;
  font-weight: 500;
}

.reply-actions {
  display: flex;
  gap: 12px;
}

.reply-action-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  font-size: 11px;
  color: #6b7280;
  cursor: pointer;
  padding: 2px 0;
  transition: color 0.2s;
}

.reply-action-btn:hover {
  color: #4f46e5;
}

.reply-action-btn.liked {
  color: #ef4444;
}

.reply-input-wrapper {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  padding-left: 44px;
}

.sub-reply-input-wrapper {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  padding-left: 0;
}

.reply-input {
  flex-grow: 1;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.reply-input:focus {
  border-color: #4f46e5;
}

.reply-submit-btn {
  padding: 6px 12px;
  background-color: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reply-submit-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.load-more-wrapper {
  text-align: center;
  padding: 12px 0;
}

.load-more-btn {
  padding: 8px 24px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  border-color: #4f46e5;
  color: #4f46e5;
}

.load-more-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>