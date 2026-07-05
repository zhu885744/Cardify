<template>
  <div class="moments-container">
    <!-- 返回按钮（详情页） -->
    <div v-if="isDetail" class="mt-2 mb-2">
      <button 
        type="button" 
        class="btn btn-primary btn-sm"
        @click="goBack"
      >
        <i class="bi bi-arrow-left me-1"></i>
        返回动态列表
      </button>
    </div>

    <!-- 发布编辑器（列表页 + 已登录） -->
    <MomentEditor
      v-if="!isDetail && isLogin"
      mode="create"
      @published="onMomentPublished"
      @draft-saved="onMomentPublished"
    />

    <!-- 编辑编辑器 -->
    <MomentEditor
      v-if="editData"
      mode="edit"
      :editData="editData"
      @updated="onMomentUpdated"
      @cancelled="editData = null"
    />

    <!-- 详情页加载中 -->
    <div v-if="isDetail && loading && !singleMoment" class="text-center py-8">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">加载中...</p>
    </div>

    <!-- 详情页不存在 -->
    <div v-else-if="isDetail && !singleMoment" class="alert alert-light text-center py-8">
      <i class="bi bi-chat-dots text-4xl text-muted mb-2"></i>
      <p class="text-muted">动态不存在</p>
    </div>

    <!-- 详情页 -->
    <div v-else-if="isDetail && singleMoment" class="moment-detail">
      <MomentCard
        :moment="singleMoment"
        :likeStatus="!!momentLikeStatus[singleMoment.id]"
        :collectStatus="!!momentCollectStatus[singleMoment.id]"
        :isOwner="canEdit(singleMoment)"
        :commentExpanded="expandedCommentId === singleMoment.id"
        :hideCommentBtn="true"
        @like="handleLike"
        @collect="handleCollect"
        @share="shareMoment"
        @toggle-comment="toggleComment"
        @edit="startEdit"
        @delete="deleteMoment"
        @preview-image="previewImageSrc = $event"
      >
        <template #comments>
          <CommentList
            :bindId="singleMoment.id"
            bindType="moments"
            @comment-added="singleMoment.comment_count = (singleMoment.comment_count || 0) + 1"
          />
        </template>
      </MomentCard>
    </div>

    <!-- 列表页加载中 -->
    <div v-else-if="loading && momentList.length === 0" class="text-center py-8 mt-2">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">加载中...</p>
    </div>

    <!-- 列表页空状态 -->
    <div v-else-if="momentList.length === 0 && !loading" class="alert alert-light text-center py-8">
      <i class="bi bi-chat-dots text-4xl text-muted mb-2"></i>
      <p class="text-muted">暂无动态内容</p>
    </div>

    <!-- 动态列表 -->
    <div v-else class="moment-list mt-2">
      <MomentCard
        v-for="moment in momentList"
        :key="moment.id"
        :moment="moment"
        :likeStatus="!!momentLikeStatus[moment.id]"
        :collectStatus="!!momentCollectStatus[moment.id]"
        :isOwner="canEdit(moment)"
        :commentExpanded="expandedCommentId === moment.id"
        @like="handleLike"
        @collect="handleCollect"
        @share="shareMoment"
        @toggle-comment="toggleComment"
        @edit="startEdit"
        @delete="deleteMoment"
        @preview-image="previewImageSrc = $event"
      >
        <template #comments>
          <CommentList
            v-if="expandedCommentId === moment.id"
            :bindId="moment.id"
            bindType="moments"
            @comment-added="moment.comment_count = (moment.comment_count || 0) + 1"
          />
        </template>
      </MomentCard>
    </div>

    <!-- 加载更多 -->
    <div v-if="!isDetail && !loading && hasMore" class="text-center py-4">
      <button 
        type="button" 
        class="btn btn-outline-secondary"
        @click="loadMore"
        :disabled="loadingMore"
      >
        <span v-if="loadingMore" class="spinner-border spinner-border-sm me-2"></span>
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </button>
    </div>

    <!-- 图片预览遮罩 -->
    <div v-if="previewImageSrc" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" @click="previewImageSrc = ''">
      <img :src="previewImageSrc" class="max-w-full max-h-full" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCommStore } from '@/store/comm'
import { request } from '@/utils/network'
import { toast } from '@/utils/app'
import utils from '@/utils/utils'
import MomentCard from '@/comps/moments/MomentCard.vue'
import CommentList from '@/comps/moments/CommentList.vue'
import MomentEditor from '@/comps/moments/MomentEditor.vue'

const router = useRouter()
const route = useRoute()
const store = useCommStore()

// ========== 数据状态 ==========
const momentList = ref([])
const singleMoment = ref(null)
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const page = ref(1)
const pageSize = 10
const editData = ref(null)
const expandedCommentId = ref(null)
const previewImageSrc = ref('')

const momentLikeStatus = reactive({})
const momentCollectStatus = reactive({})

// ========== 用户操作缓存（使用 utils.js） ==========
const USER_ACTIONS_CACHE_KEY = 'moments_user_actions'
const USER_ACTIONS_CACHE_EXPIRE = 30

const getCachedUserAction = (momentId, actionType) => {
  const userId = loggedInUserId.value
  if (utils.is.empty(momentId) || utils.is.empty(userId)) return null
  
  const cacheKey = `${userId}_${momentId}`
  const cached = utils.get.storage(USER_ACTIONS_CACHE_KEY, cacheKey)
  
  if (cached !== 'expire' && cached !== null && cached !== false) {
    return cached[actionType]
  }
  return null
}

const setCachedUserAction = (momentId, actionType, value) => {
  const userId = loggedInUserId.value
  if (utils.is.empty(momentId) || utils.is.empty(userId)) return
  
  const cacheKey = `${userId}_${momentId}`
  const existing = utils.get.storage(USER_ACTIONS_CACHE_KEY, cacheKey)
  
  const data = existing !== 'expire' && existing !== null && existing !== false 
    ? { ...existing, [actionType]: value } 
    : { [actionType]: value }
  
  utils.set.storage(USER_ACTIONS_CACHE_KEY, cacheKey, { ...data, time: USER_ACTIONS_CACHE_EXPIRE })
}

// ========== 计算属性 ==========
const isDetail = computed(() => !!route.params.id)

const isLogin = computed(() => {
  const loginState = store.getLogin
  return loginState.finish && !utils.is.empty(loginState.user)
})

const loggedInUserId = computed(() => {
  return store.login.user?.id
})

// ========== 工具函数 ==========
const canEdit = (moment) => {
  if (!isLogin.value) return false
  return moment.uid === loggedInUserId.value
}

// ========== 查询用户操作状态（参考 archives.vue 实现） ==========
const checkMomentUserActions = async (momentId) => {
  if (!isLogin.value || !momentId || !loggedInUserId.value) return

  const userId = String(loggedInUserId.value)

  // 先查缓存
  const cachedLiked = getCachedUserAction(momentId, 'isLiked')
  const cachedCollected = getCachedUserAction(momentId, 'isCollected')

  if (cachedLiked !== null && cachedCollected !== null) {
    momentLikeStatus[momentId] = cachedLiked
    momentCollectStatus[momentId] = cachedCollected
    return
  }

  try {
    const [likeRes, collectRes] = await Promise.all([
      request.get('/api/exp/one', {
        where: JSON.stringify({
          uid: userId,
          type: 'like',
          bind_id: momentId,
          bind_type: 'moments',
          state: 1
        })
      }),
      request.get('/api/exp/one', {
        where: JSON.stringify({
          uid: userId,
          type: 'collect',
          bind_id: momentId,
          bind_type: 'moments',
          state: 1
        })
      })
    ])

    const isLiked = !!(likeRes.data && likeRes.data.state === 1)
    const isCollected = !!(collectRes.data && collectRes.data.state === 1)

    momentLikeStatus[momentId] = isLiked
    momentCollectStatus[momentId] = isCollected

    setCachedUserAction(momentId, 'isLiked', isLiked)
    setCachedUserAction(momentId, 'isCollected', isCollected)
  } catch (error) {
    // 接口查询失败，保持默认 false，不阻塞页面展示
    if (momentLikeStatus[momentId] === undefined) {
      momentLikeStatus[momentId] = false
    }
    if (momentCollectStatus[momentId] === undefined) {
      momentCollectStatus[momentId] = false
    }
  }
}

// ========== 查询动态点赞/收藏/评论计数 ==========
const fetchMomentStats = async (momentId) => {
  if (!momentId) return

  try {
    const [likeCountRes, collectCountRes, commentCountRes] = await Promise.all([
      request.get('/api/exp/count', {
        where: JSON.stringify({
          type: 'like',
          bind_id: momentId,
          bind_type: 'moments',
          state: 1
        })
      }),
      request.get('/api/exp/count', {
        where: JSON.stringify({
          type: 'collect',
          bind_id: momentId,
          bind_type: 'moments',
          state: 1
        })
      }),
      request.get('/api/moments/comment_count', {
        bind_id: momentId
      })
    ])

    const likeCount = likeCountRes.data || 0
    const collectCount = collectCountRes.data || 0
    const commentCount = commentCountRes.data || 0

    const momentInList = momentList.value.find(m => String(m.id) === String(momentId))
    if (momentInList) {
      momentInList.likes = likeCount
      momentInList.favorites = collectCount
      momentInList.comment_count = commentCount
    }

    if (singleMoment.value && String(singleMoment.value.id) === String(momentId)) {
      singleMoment.value.likes = likeCount
      singleMoment.value.favorites = collectCount
      singleMoment.value.comment_count = commentCount
    }

    return { likeCount, collectCount, commentCount }
  } catch (error) {
    console.error('获取动态统计失败:', error)
    return { likeCount: 0, collectCount: 0, commentCount: 0 }
  }
}

// ========== 点赞 / 收藏 / 分享 ==========
const handleLike = async (moment) => {
  if (!isLogin.value) {
    toast.warning('请登录后再操作')
    return
  }

  const momentId = moment.id
  const userId = String(loggedInUserId.value)

  // 如果本地状态不确定，先查询真实状态
  if (momentLikeStatus[momentId] === undefined) {
    await checkMomentUserActions(momentId)
  }

  const currentStatus = !!momentLikeStatus[momentId]
  const newStatus = !currentStatus

  // 乐观更新
  momentLikeStatus[momentId] = newStatus
  moment.likes = (moment.likes || 0) + (newStatus ? 1 : -1)
  setCachedUserAction(momentId, 'isLiked', newStatus)

  try {
    const { code, msg } = await request.post('/api/exp/like', {
      bind_type: 'moments',
      bind_id: momentId,
      state: currentStatus ? 0 : 1,
      uid: userId,
      description: '动态点赞'
    })

    if (code == 200) {
      toast.success(msg || (newStatus ? '点赞成功！' : '取消点赞成功！'))
    } else {
      // 接口失败，回滚状态
      momentLikeStatus[momentId] = currentStatus
      moment.likes = (moment.likes || 0) + (currentStatus ? 1 : -1)
      setCachedUserAction(momentId, 'isLiked', currentStatus)
      toast.error(msg || '操作失败')
    }
  } catch (error) {
    // 请求异常，回滚状态
    momentLikeStatus[momentId] = currentStatus
    moment.likes = (moment.likes || 0) + (currentStatus ? 1 : -1)
    setCachedUserAction(momentId, 'isLiked', currentStatus)
    toast.error('操作失败，请稍后重试')
  }
}

const handleCollect = async (moment) => {
  if (!isLogin.value) {
    toast.warning('请登录后再操作')
    return
  }

  const momentId = moment.id
  const userId = String(loggedInUserId.value)

  // 如果本地状态不确定，先查询真实状态
  if (momentCollectStatus[momentId] === undefined) {
    await checkMomentUserActions(momentId)
  }

  const currentStatus = !!momentCollectStatus[momentId]
  const newStatus = !currentStatus

  // 乐观更新
  momentCollectStatus[momentId] = newStatus
  moment.favorites = (moment.favorites || 0) + (newStatus ? 1 : -1)
  setCachedUserAction(momentId, 'isCollected', newStatus)

  try {
    const { code, msg } = await request.post('/api/exp/collect', {
      bind_type: 'moments',
      bind_id: momentId,
      state: currentStatus ? 0 : 1,
      uid: userId,
      description: '动态收藏'
    })

    if (code == 200) {
      toast.success(msg || (newStatus ? '收藏成功！' : '取消收藏成功！'))
    } else {
      // 接口失败，回滚状态
      momentCollectStatus[momentId] = currentStatus
      moment.favorites = (moment.favorites || 0) + (currentStatus ? 1 : -1)
      setCachedUserAction(momentId, 'isCollected', currentStatus)
      toast.error(msg || '操作失败')
    }
  } catch (error) {
    // 请求异常，回滚状态
    momentCollectStatus[momentId] = currentStatus
    moment.favorites = (moment.favorites || 0) + (currentStatus ? 1 : -1)
    setCachedUserAction(momentId, 'isCollected', currentStatus)
    toast.error('操作失败，请稍后重试')
  }
}

const shareMoment = async (moment) => {
  const url = `${window.location.origin}/moments/${moment.id}`

  if (isLogin.value) {
    try {
      await request.post('/api/exp/share', {
        bind_type: 'moments',
        bind_id: moment.id
      })
    } catch (error) {
      console.error('分享经验值失败:', error)
    }
  }

  navigator.clipboard.writeText(url).then(() => {
    toast.success('链接已复制')
  }).catch(() => {
    toast.error('复制失败')
  })
}

// ========== 评论展开 / 收起 ==========
const toggleComment = (moment) => {
  if (expandedCommentId.value === moment.id) {
    expandedCommentId.value = null
  } else {
    expandedCommentId.value = moment.id
  }
}

// ========== 编辑 / 删除 ==========
const startEdit = (moment) => {
  editData.value = {
    id: moment.id,
    content: moment.content,
    images: Array.isArray(moment.images) ? [...moment.images] : (moment.images ? moment.images.split(',') : []),
    location: moment.location || ''
  }
}

const deleteMoment = async (moment) => {
  if (!confirm('确定要删除这条动态吗？')) return

  try {
    const { code, msg } = await request.delete('/api/moments/remove', {
      ids: moment.id
    })

    if (code == 200) {
      toast.success(msg || '删除成功')
      if (isDetail.value) {
        router.push('/moments')
      } else {
        loadMoments(true)
      }
    } else {
      toast.error(msg || '删除失败')
    }
  } catch (error) {
    toast.error('删除失败：' + (error.message || '请稍后重试'))
  }
}

// ========== 编辑器事件 ==========
const onMomentPublished = () => {
  loadMoments(true)
}

const onMomentUpdated = () => {
  editData.value = null
  if (isDetail.value) {
    loadSingleMoment()
  } else {
    loadMoments(true)
  }
}

// ========== 导航 ==========
const goBack = () => {
  singleMoment.value = null
  expandedCommentId.value = null
  router.push('/moments')
}

// ========== 数据加载 ==========
const loadMoments = async (reset = false) => {
  if (reset) {
    page.value = 1
    momentList.value = []
    hasMore.value = true
    loading.value = true
  }

  try {
    const { code, msg, data: resData } = await request.get('/api/moments/all', {
      page: page.value,
      limit: pageSize,
      order: 'create_time desc',
      where: JSON.stringify({ status: 1 })
    })

    if (code == 200) {
      const data = resData.data || []
      data.forEach(item => {
        if (item.images) {
          item.images = item.images.split(',').filter(img => img.trim())
        } else {
          item.images = []
        }
        if (item.result?.author?.is_liked !== undefined) {
          momentLikeStatus[item.id] = item.result.author.is_liked
        }
        if (item.result?.author?.is_collected !== undefined) {
          momentCollectStatus[item.id] = item.result.author.is_collected
        }
      })

      if (reset) {
        momentList.value = data
      } else {
        momentList.value = [...momentList.value, ...data]
      }

      // 数据赋值后再查询统计计数（确保能找到对应对象）
      data.forEach(item => {
        checkMomentUserActions(item.id)
        fetchMomentStats(item.id)
      })

      hasMore.value = data.length === pageSize
    } else {
      toast.error(msg || '获取动态失败')
    }
  } catch (error) {
    console.error('获取动态失败:', error)
    toast.error('获取动态失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadSingleMoment = async () => {
  loading.value = true
  try {
    const { code, msg, data } = await request.get('/api/moments/one', {
      id: route.params.id
    })

    if (code == 200) {
      if (data.images) {
        data.images = data.images.split(',').filter(img => img.trim())
      } else {
        data.images = []
      }
      // 优先用 API 返回的 is_liked/is_collected
      if (data.result?.author?.is_liked !== undefined) {
        momentLikeStatus[data.id] = data.result.author.is_liked
      }
      if (data.result?.author?.is_collected !== undefined) {
        momentCollectStatus[data.id] = data.result.author.is_collected
      }
      singleMoment.value = data
      expandedCommentId.value = data.id
      // 异步查询用户操作状态和统计计数（不阻塞页面展示）
      checkMomentUserActions(data.id)
      fetchMomentStats(data.id)
    } else {
      toast.error(msg || '获取动态失败')
    }
  } catch (error) {
    console.error('获取动态失败:', error)
    toast.error('获取动态失败')
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  page.value++
  loadMoments()
}

// ========== 生命周期 ==========
onMounted(() => {
  if (isDetail.value) {
    loadSingleMoment()
  } else {
    loadMoments()
  }
})

watch(() => route.params.id, (newId, oldId) => {
  if (newId) {
    loadSingleMoment()
  } else if (oldId) {
    singleMoment.value = null
    expandedCommentId.value = null
    loadMoments(true)
  }
})
</script>

<style scoped>
.moment-list {
  margin-top: 0;
}

.moment-detail {
  margin-top: 0;
}
</style>