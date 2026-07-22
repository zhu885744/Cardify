<template>
  <div class="comments-section">
    <!-- 评论关闭提示 -->
    <div
      v-if="!commentAllow && !commentShow"
      class="text-center py-2 text-muted text-sm"
    >
      评论功能已关闭
    </div>

    <!-- 顶部评论输入框 -->
    <div v-else-if="commentAllow" class="comment-input-wrapper">
      <input
        type="text"
        v-model="commentContent"
        class="comment-input"
        placeholder="写下你的评论..."
        @keyup.enter.prevent="submitComment"
      />
      <button
        type="button"
        class="comment-submit-btn"
        @click="submitComment"
        :disabled="submitingComment || !commentContent.trim()"
      >
        发送
      </button>
    </div>

    <!-- 评论列表区域 -->
    <template v-if="commentShow">
      <!-- 加载中 -->
      <div
        v-if="commentsLoading"
        class="text-center py-2"
      >
        <div class="spinner-border spinner-border-sm" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- 暂无评论 -->
      <div
        v-else-if="comments.length === 0"
        class="text-center py-4 text-muted text-sm"
      >
        暂无评论，来抢沙发吧~
      </div>

      <!-- 评论列表 -->
      <div v-else class="comments-list">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item"
        >
          <img
            :src="getAvatar(comment.result?.author)"
            class="comment-avatar"
            alt="avatar"
          />
          <div class="comment-content">
            <div class="comment-header">
              <router-link
                :to="`/author/${comment.result?.author?.id}`"
                class="comment-nickname text-body text-primary text-decoration-none"
              >
                {{ getNickname(comment.result?.author) }}
              </router-link>
              <span class="comment-time">{{ formatTime(comment.create_time) }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
            <div class="comment-actions">
              <button
                type="button"
                :class="['comment-action-btn', isLiked(comment.id) ? 'liked' : '']"
                @click="handleCommentLike(comment)"
                :disabled="likeLoadingIds.has(comment.id)"
              >
                <i :class="['bi', isLiked(comment.id) ? 'bi-heart-fill' : 'bi-heart']"></i>
                <span v-if="getLikeCount(comment.id) > 0">{{ getLikeCount(comment.id) }}</span>
              </button>
              <button
                type="button"
                class="comment-action-btn"
                @click="toggleReply(comment.id)"
              >
                <span>回复</span>
              </button>
            </div>

            <!-- 子评论列表 -->
            <div
              v-if="comment.replies && comment.replies.length > 0"
              class="comment-replies"
            >
              <div
                v-for="reply in comment.replies"
                :key="reply.id"
                class="reply-item"
              >
                <img
                  :src="getAvatar(reply.result?.author)"
                  class="reply-avatar"
                  alt="avatar"
                />
                <div class="reply-content">
                  <div class="reply-header">
                    <router-link
                      :to="`/author/${reply.result?.author?.id}`"
                      class="comment-nickname text-body text-primary text-decoration-none"
                    >
                      {{ getNickname(reply.result?.author) }}
                    </router-link>
                    <span class="reply-time">{{ formatTime(reply.create_time) }}</span>
                  </div>
                  <p class="reply-text">
                    <span
                      v-if="reply.replyToAuthor"
                      class="reply-to"
                    >回复 @{{ reply.replyToAuthor.nickname }}：</span>
                    {{ reply.content }}
                  </p>
                  <div class="reply-actions">
                    <button
                      type="button"
                      :class="['reply-action-btn', isLiked(reply.id) ? 'liked' : '']"
                      @click="handleCommentLike(reply)"
                      :disabled="likeLoadingIds.has(reply.id)"
                    >
                      <i :class="['bi', isLiked(reply.id) ? 'bi-heart-fill' : 'bi-heart']"></i>
                      <span v-if="getLikeCount(reply.id) > 0">{{ getLikeCount(reply.id) }}</span>
                    </button>
                    <button
                      type="button"
                      class="reply-action-btn"
                      @click="toggleReply(reply.id)"
                    >
                      <span>回复</span>
                    </button>
                  </div>

                  <!-- 子评论内回复输入框 -->
                  <div
                    v-if="replyingCommentId === reply.id"
                    class="sub-reply-input-wrapper"
                  >
                    <input
                      type="text"
                      v-model="replyContent"
                      class="reply-input"
                      :placeholder="`回复 ${getNickname(reply.result?.author)}...`"
                      @keyup.enter.prevent="submitReply(reply)"
                    />
                    <button
                      type="button"
                      class="reply-submit-btn"
                      @click="submitReply(reply)"
                      :disabled="submitingReply || !replyContent.trim()"
                    >
                      回复
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 主评论回复输入框 -->
            <div
              v-if="replyingCommentId === comment.id"
              class="reply-input-wrapper"
            >
              <input
                type="text"
                v-model="replyContent"
                class="reply-input"
                :placeholder="`回复 ${getNickname(comment.result?.author)}...`"
                @keyup.enter.prevent="submitReply(comment)"
              />
              <button
                type="button"
                class="reply-submit-btn"
                @click="submitReply(comment)"
                :disabled="submitingReply || !replyContent.trim()"
              >
                回复
              </button>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div
          v-if="!commentsLoading && hasMore && comments.length > 0"
          class="load-more-wrapper"
        >
          <button
            type="button"
            class="load-more-btn"
            @click="loadMoreComments"
            :disabled="loadingMore"
          >
            <span
              v-if="loadingMore"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            {{ loadingMore ? '加载中...' : '加载更多评论' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onUnmounted } from 'vue'
import { useCommStore } from '@/store/comm'
import { request } from '@/utils/network'
import { toast } from '@/utils/app'
import utils from '@/utils/utils'

// ====================== 常量统一管理 ======================
const PAGE_SIZE = 10
const DEFAULT_AVATAR = '/static/avatar.png'
// 接口常量
const API = {
  commentList: '/api/moments/comment',
  commentCreate: '/api/comment/create',
  likeToggle: '/api/exp/like',
  likeOne: '/api/exp/one',
  likeCount: '/api/exp/count'
}

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

// 状态
const comments = ref([])
const commentsLoading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)

const commentContent = ref('')
const replyingCommentId = ref(null)
const replyContent = ref('')

// 提交锁，防止重复点击
const submitingComment = ref(false)
const submitingReply = ref(false)
// 点赞请求loading集合，单个评论点赞互斥
const likeLoadingIds = ref(new Set())

const commentLikeStatus = reactive({})
const commentLikeCounts = reactive({})

// 请求控制器，组件卸载取消请求
let loadCommentsAbort = null

// ====================== 计算属性 ======================
const momentsConfig = computed(() => {
  const cfg = store.siteInfo?.config?.MOMENTS || {}
  try {
    return typeof cfg === 'string' ? JSON.parse(cfg) : cfg
  } catch {
    return {}
  }
})

const commentAllow = computed(() => momentsConfig.value.comment?.allow !== 0)
const commentShow = computed(() => momentsConfig.value.comment?.show !== 0)

// ====================== 工具方法 ======================
/** 判断登录 */
const isLogin = () => {
  const loginState = store.getLogin
  return loginState.finish && !utils.is.empty(loginState.user)
}

/** 获取用户头像 */
const getAvatar = (author) => {
  return author?.avatar || DEFAULT_AVATAR
}
/** 获取昵称 */
const getNickname = (author) => {
  return author?.nickname || '未知用户'
}
/** 是否点赞 */
const isLiked = (id) => !!commentLikeStatus[id]
/** 获取点赞数 */
const getLikeCount = (id) => commentLikeCounts[id] || 0

/** 时间格式化 */
const formatTime = (timestamp) => {
  if (utils.is.empty(timestamp)) return ''
  return utils.time.nature(timestamp, 5)
}

/** 切换回复框显示/隐藏 */
const toggleReply = (targetId) => {
  if (replyingCommentId.value === targetId) {
    replyingCommentId.value = null
    replyContent.value = ''
  } else {
    replyingCommentId.value = targetId
    replyContent.value = ''
  }
}

// ====================== 【重点优化】评论树形构建 ======================
/**
 * 构建评论树（简化算法，避免多层向上查找pid）
 * 规则：只支持两级结构：一级评论 + 一级评论下的回复
 */
const buildCommentTree = (rawList) => {
  const rootMap = new Map()
  const replyList = []
  const tree = []

  // 第一轮：分离根评论（pid=0）与回复
  rawList.forEach(item => {
    const row = { ...item, replies: [], replyToAuthor: null }
    if (!row.pid) {
      rootMap.set(row.id, row)
      tree.push(row)
    } else {
      replyList.push(row)
    }
  })

  // 第二轮：回复挂载到根评论
  replyList.forEach(reply => {
    const parent = rawList.find(r => r.id === reply.pid)
    if (parent?.result?.author) {
      reply.replyToAuthor = parent.result.author
    }
    // 找到这条回复所属的一级根评论
    let root = rootMap.get(reply.pid)
    if (!root) {
      // 回复的父是回复，向上追溯一级根评论
      let pId = reply.pid
      while (pId) {
        const pItem = rawList.find(r => r.id === pId)
        if (!pItem) break
        if (!pItem.pid) {
          root = rootMap.get(pItem.id)
          break
        }
        pId = pItem.pid
      }
    }
    if (root) {
      root.replies.push(reply)
    }
  })
  return tree
}

// ====================== 点赞状态加载 ======================
const loadLikeStatus = async (commentIds) => {
  if (!isLogin() || !commentIds.length) return
  const userId = String(store.login.user.id)

  // 批量循环优化，你有条件可以改成后端提供批量接口，大幅减少请求
  const tasks = commentIds.map(async (id) => {
    try {
      const statusWhere = JSON.stringify({
        uid: userId, bind_id: id, type: 'like', bind_type: 'comment', state: 1
      })
      const countWhere = JSON.stringify({
        bind_id: id, type: 'like', bind_type: 'comment', state: 1
      })
      const [statusRes, countRes] = await Promise.all([
        request.get(API.likeOne, { where: statusWhere }),
        request.get(API.likeCount, { where: countWhere })
      ])
      commentLikeStatus[id] = statusRes.code === 200 && !!statusRes.data
      commentLikeCounts[id] = countRes.code === 200 ? (countRes.data || 0) : 0
    } catch {
      commentLikeStatus[id] = false
      commentLikeCounts[id] = 0
    }
  })
  await Promise.all(tasks)
}

// ====================== 加载评论 ======================
const loadComments = async (reset = false) => {
  // 取消上一次未完成请求
  if (loadCommentsAbort) loadCommentsAbort.abort()
  const controller = new AbortController()
  loadCommentsAbort = controller

  if (reset) {
    currentPage.value = 1
    comments.value = []
    hasMore.value = true
  }

  const loadingRef = reset ? commentsLoading : loadingMore
  loadingRef.value = true

  try {
    const { code, data: resData } = await request.get(API.commentList, {
      bind_id: props.bindId,
      order: 'create_time desc',
      page: currentPage.value,
      limit: PAGE_SIZE
    }, { signal: controller.signal })

    if (code === 200) {
      const data = resData.data || []
      const treeData = buildCommentTree(data)
      if (reset) {
        comments.value = treeData
      } else {
        comments.value.push(...treeData)
      }
      hasMore.value = data.length === PAGE_SIZE
      const ids = data.map(c => c.id)
      await loadLikeStatus(ids)
    }
  } catch (err) {
    // 主动abort不提示错误
    if (err.name !== 'AbortError') {
      console.error('获取评论失败:', err)
    }
  } finally {
    loadingRef.value = false
  }
}

const loadMoreComments = () => {
  if (loadingMore.value || !hasMore.value) return
  currentPage.value++
  loadComments()
}

// ====================== 发布评论 ======================
const submitComment = async () => {
  const content = commentContent.value.trim()
  if (!content) return toast.warning('请输入评论内容')
  if (!isLogin()) return toast.warning('请登录后再评论')
  if (submitingComment.value) return

  submitingComment.value = true
  try {
    const { code, msg } = await request.post(API.commentCreate, {
      content,
      bind_id: props.bindId,
      bind_type: props.bindType
    })
    if (code === 200) {
      toast.success(msg || '评论成功')
      commentContent.value = ''
      emit('comment-added')
      loadComments(true)
    } else if (code === 429) {
      toast.warning(msg || '评论过于频繁，请稍后再试')
    } else {
      toast.error(msg || '评论失败')
    }
  } catch (err) {
    toast.error('评论失败：' + (err.message || '请稍后重试'))
  } finally {
    submitingComment.value = false
  }
}

// ====================== 提交回复 ======================
const submitReply = async (targetComment) => {
  const content = replyContent.value.trim()
  if (!content) return toast.warning('请输入回复内容')
  if (!isLogin()) return toast.warning('请登录后再回复')
  if (submitingReply.value) return

  submitingReply.value = true
  try {
    const { code, msg } = await request.post(API.commentCreate, {
      content,
      bind_id: props.bindId,
      bind_type: props.bindType,
      pid: targetComment.id
    })
    if (code === 200) {
      toast.success(msg || '回复成功')
      replyContent.value = ''
      replyingCommentId.value = null
      loadComments(true)
    } else if (code === 429) {
      toast.warning(msg || '评论过于频繁，请稍后再试')
    } else {
      toast.error(msg || '回复失败')
    }
  } catch (err) {
    toast.error('回复失败：' + (err.message || '请稍后重试'))
  } finally {
    submitingReply.value = false
  }
}

// ====================== 点赞 ======================
const handleCommentLike = async (comment) => {
  if (!isLogin()) return toast.warning('请登录后再操作')
  const cid = comment.id
  if (likeLoadingIds.value.has(cid)) return

  const currentStatus = !!commentLikeStatus[cid]
  const newStatus = !currentStatus
  const userId = String(store.login.user.id)

  // 乐观更新
  commentLikeStatus[cid] = newStatus
  commentLikeCounts[cid] = Math.max(0, getLikeCount(cid) + (newStatus ? 1 : -1))
  likeLoadingIds.value.add(cid)

  try {
    const { code, msg } = await request.post(API.likeToggle, {
      bind_type: 'comment',
      bind_id: cid,
      state: currentStatus ? 0 : 1,
      uid: userId,
      description: '评论点赞'
    })
    if (code === 200) {
      toast.success(newStatus ? '点赞成功' : '取消点赞成功')
    } else if (code === 202) {
      // 已点赞，回滚状态
      commentLikeStatus[cid] = currentStatus
      commentLikeCounts[cid] = Math.max(0, getLikeCount(cid) + (currentStatus ? 1 : -1))
      toast.warning(msg || '已经点过赞啦！')
    } else {
      throw new Error(msg || '操作失败')
    }
  } catch (err) {
    // 异常回滚
    commentLikeStatus[cid] = currentStatus
    commentLikeCounts[cid] = Math.max(0, getLikeCount(cid) + (currentStatus ? 1 : -1))
    toast.error(err.message || '操作失败，请稍后重试')
  } finally {
    likeLoadingIds.value.delete(cid)
  }
}

// ====================== 监听 ======================
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

// 组件卸载，中断请求，防止内存泄漏
onUnmounted(() => {
  if (loadCommentsAbort) loadCommentsAbort.abort()
})
</script>

<style scoped>
/* 样式只微调，结构不变，你原有样式全部保留 */
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

.comment-action-btn:hover:not(:disabled) {
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

.reply-time {
  font-size: 11px;
  color: #9ca3af;
}

.reply-text {
  font-size: 13px;
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

.reply-action-btn:hover:not(:disabled) {
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