<template>
  <div class="moments-container">
    <div v-if="isLogin" class="card shadow-sm mb-4 mt-2">
      <div class="card-body">
        <div class="d-flex align-items-start gap-3">
          <div class="flex-grow-1">
            <textarea 
              v-model="newMoment.content" 
              class="form-control mb-3" 
              rows="3" 
              placeholder="分享你的动态..."
              maxlength="500"
            ></textarea>
            <div v-if="newMoment.images.length > 0" class="d-flex flex-wrap gap-2 mb-3">
              <div 
                v-for="(img, index) in newMoment.images" 
                :key="index" 
                class="position-relative"
              >
                <img :src="img" class="rounded-lg w-20 h-20 object-cover" />
                <button 
                  type="button" 
                  class="btn-close btn-close-white position-absolute top-0 right-0"
                  @click="removeImage(index)"
                ></button>
              </div>
            </div>
            <div class="d-flex align-items-center justify-between">
              <button 
                type="button" 
                class="btn btn-outline-secondary btn-sm"
                @click="triggerImageUpload"
              >
                <i class="bi bi-image me-1"></i>
                添加图片
              </button>
              <input 
                ref="imageInput" 
                type="file" 
                multiple 
                accept="image/*" 
                class="d-none"
                @change="handleImageUpload"
              />
              <div class="d-flex gap-2">
                <button 
                  type="button" 
                  class="btn btn-outline-secondary btn-sm"
                  @click="saveMomentDraft"
                  :disabled="isSubmitting || !newMoment.content.trim()"
                >
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
                  保存草稿
                </button>
                <button 
                  type="button" 
                  class="btn btn-primary btn-sm"
                  @click="publishMoment"
                  :disabled="isSubmitting || !newMoment.content.trim()"
                >
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
                  发布动态
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="editingMoment" class="card shadow-sm mb-4">
      <div class="card-header bg-body-secondary">
        <h6 class="mb-0">编辑动态</h6>
      </div>
      <div class="card-body">
        <textarea 
          v-model="editingMoment.content" 
          class="form-control mb-3" 
          rows="3"
          maxlength="500"
        ></textarea>
        <div v-if="editingMoment.images.length > 0" class="d-flex flex-wrap gap-2 mb-3">
          <div 
            v-for="(img, index) in editingMoment.images" 
            :key="index" 
            class="position-relative"
          >
            <img :src="img" class="rounded-lg w-20 h-20 object-cover" />
            <button 
              type="button" 
              class="btn-close btn-close-white position-absolute top-0 right-0"
              @click="removeEditImage(index)"
            ></button>
          </div>
        </div>
        <div class="d-flex align-items-center justify-between">
          <button 
            type="button" 
            class="btn btn-outline-secondary btn-sm"
            @click="triggerEditImageUpload"
          >
            <i class="bi bi-image me-1"></i>
            添加图片
          </button>
          <input 
            ref="editImageInput" 
            type="file" 
            multiple 
            accept="image/*" 
            class="d-none"
            @change="handleEditImageUpload"
          />
          <div class="d-flex gap-2">
            <button 
              type="button" 
              class="btn btn-secondary btn-sm"
              @click="cancelEdit"
            >
              取消
            </button>
            <button 
              type="button" 
              class="btn btn-primary btn-sm"
              @click="updateMoment"
              :disabled="isSubmitting || !editingMoment.content.trim()"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
              保存修改
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading && momentList.length === 0" class="text-center py-8">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">加载中...</p>
    </div>

    <div v-else-if="momentList.length === 0 && !loading" class="alert alert-light text-center py-8">
      <i class="bi bi-chat-dots text-4xl text-muted mb-2"></i>
      <p class="text-muted">暂无动态内容</p>
    </div>

    <div v-else class="moment-list">
      <div 
        v-for="moment in momentList" 
        :key="moment.id" 
        class="card rounded-2xl shadow-sm mb-4 overflow-hidden"
      >
        <div class="card-body p-4">
          <div class="d-flex align-items-center gap-3 mb-3">
            <img 
              :src="moment.result?.author?.avatar || '/static/avatar.png'" 
              class="rounded-circle w-11 h-11 flex-shrink-0 object-cover"
              alt="avatar"
            />
            <div class="flex-grow-1">
              <div class="fw-semibold text-body">{{ moment.result?.author?.nickname || '未知用户' }}</div>
              <div class="text-muted text-xs">{{ formatTime(moment.create_time) }}</div>
            </div>
            <div v-if="canEdit(moment)" class="d-flex gap-1">
              <button 
                type="button" 
                class="btn btn-outline-secondary btn-xs"
                @click="startEdit(moment)"
              >
                <i class="bi bi-pencil"></i>
              </button>
              <button 
                type="button" 
                class="btn btn-outline-danger btn-xs"
                @click="deleteMoment(moment)"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          
          <p class="text-body text-sm mb-3 leading-relaxed">{{ moment.content }}</p>
          
          <div v-if="moment.images && moment.images.length > 0" class="mb-3">
            <div 
              :class="[
                'grid gap-2',
                moment.images.length === 1 ? 'grid-cols-1' : 
                moment.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
              ]"
            >
              <img 
                v-for="(img, index) in moment.images.slice(0, 9)" 
                :key="index" 
                :src="img" 
                :class="[
                  'rounded-xl object-cover cursor-pointer',
                  moment.images.length === 1 ? 'w-full h-64' : 
                  moment.images.length === 2 ? 'w-full h-40' : 'w-full h-32'
                ]"
                @click="previewImage(img)"
              />
            </div>
          </div>
          
          <div v-if="moment.location" class="d-flex align-items-center text-muted text-xs mb-3">
            <i class="bi bi-geo-alt me-1"></i>
            {{ moment.location }}
          </div>
          
          <div class="d-flex align-items-center gap-4 pt-3 border-top border-gray-100">
            <button 
              type="button" 
              class="btn btn-link text-muted btn-sm d-flex align-items-center gap-1 p-0"
              @click="handleLike(moment)"
            >
              <i class="bi bi-chat"></i>
              <span>{{ moment.comment_count || 0 }}</span>
            </button>
            <button 
              type="button" 
              class="btn btn-link text-muted btn-sm d-flex align-items-center gap-1 p-0"
              @click="handleLike(moment)"
            >
              <i class="bi bi-heart"></i>
              <span>{{ moment.likes || 0 }}</span>
            </button>
            <button 
              type="button" 
              class="btn btn-link text-muted btn-sm d-flex align-items-center gap-1 p-0"
              @click="handleLike(moment)"
            >
              <i class="bi bi-star"></i>
              <span>{{ moment.favorites || 0 }}</span>
            </button>
            <button 
              type="button" 
              class="btn btn-link text-muted btn-sm d-flex align-items-center gap-1 p-0 ms-auto"
              @click="shareMoment(moment)"
            >
              <i class="bi bi-share"></i>
              <span>分享</span>
            </button>
          </div>
          
          <div v-if="moment.likes && moment.likes > 0" class="mt-3 pt-3 border-top border-gray-100">
            <div class="d-flex align-items-center gap-1">
              <span class="text-sm"><i class="bi bi-heart-fill text-red-500"></i></span>
              <span class="text-muted text-xs">{{ moment.likes }} 人觉得很赞</span>
            </div>
          </div>
          
          <div v-if="moment.id === expandedCommentId" class="mt-3 pt-3 border-top border-gray-100">
            <div class="input-group">
              <input 
                type="text" 
                v-model="commentContent" 
                class="form-control form-control-sm rounded-full"
                placeholder="写下你的评论..."
                @keyup.enter="submitComment(moment)"
              />
              <button 
                type="button" 
                class="btn btn-primary btn-sm rounded-full"
                @click="submitComment(moment)"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && hasMore" class="text-center py-4">
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

    <div v-if="previewImageSrc" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" @click="previewImageSrc = ''">
      <img :src="previewImageSrc" class="max-w-full max-h-full" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCommStore } from '@/store/comm'
import { request } from '@/utils/network'
import { toast } from '@/utils/app'
import utils from '@/utils/utils'

const router = useRouter()
const route = useRoute()
const store = useCommStore()

const momentList = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const page = ref(1)
const pageSize = 10

const isLogin = computed(() => {
  const loginState = store.getLogin
  return loginState.finish && !utils.is.empty(loginState.user)
})

const loggedInUserId = computed(() => {
  return store.login.user?.id
})

const newMoment = ref({
  content: '',
  images: [],
  location: ''
})

const editingMoment = ref(null)
const isSubmitting = ref(false)
const imageInput = ref(null)
const editImageInput = ref(null)

const expandedCommentId = ref(null)
const commentContent = ref('')

const previewImageSrc = ref('')

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}

const canEdit = (moment) => {
  if (!isLogin.value) return false
  return moment.uid === loggedInUserId.value
}

const triggerImageUpload = () => {
  imageInput.value?.click()
}

const triggerEditImageUpload = () => {
  editImageInput.value?.click()
}

const handleImageUpload = async (event) => {
  const files = Array.from(event.target.files || [])
  for (const file of files) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const { code, msg, data } = await request.post('/api/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (code === 200) {
        newMoment.value.images.push(data.url)
      } else {
        toast.error('上传失败：' + msg)
      }
    } catch (error) {
      toast.error('上传失败：' + error.message)
    }
  }
  event.target.value = ''
}

const handleEditImageUpload = async (event) => {
  const files = Array.from(event.target.files || [])
  for (const file of files) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const { code, msg, data } = await request.post('/api/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (code === 200) {
        editingMoment.value.images.push(data.url)
      } else {
        toast.error('上传失败：' + msg)
      }
    } catch (error) {
      toast.error('上传失败：' + error.message)
    }
  }
  event.target.value = ''
}

const removeImage = (index) => {
  newMoment.value.images.splice(index, 1)
}

const removeEditImage = (index) => {
  editingMoment.value.images.splice(index, 1)
}

const publishMoment = async () => {
  if (!newMoment.value.content.trim()) {
    toast.warning('请输入动态内容')
    return
  }
  
  isSubmitting.value = true
  try {
    const { code, msg } = await request.post('/api/moments/create', {
      content: newMoment.value.content.trim(),
      images: newMoment.value.images.join(','),
      location: newMoment.value.location,
      status: 1
    })
    
    if (code === 200) {
      toast.success(msg)
      newMoment.value = { content: '', images: [], location: '' }
      loadMoments(true)
    } else {
      toast.error(msg)
    }
  } catch (error) {
    toast.error('发布失败：' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

const saveMomentDraft = async () => {
  if (!newMoment.value.content.trim()) {
    toast.warning('请输入动态内容')
    return
  }
  
  isSubmitting.value = true
  try {
    const { code, msg } = await request.post('/api/moments/create', {
      content: newMoment.value.content.trim(),
      images: newMoment.value.images.join(','),
      location: newMoment.value.location,
      status: 0
    })
    
    if (code === 200) {
      toast.success(msg)
      newMoment.value = { content: '', images: [], location: '' }
    } else {
      toast.error(msg)
    }
  } catch (error) {
    toast.error('保存失败：' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

const startEdit = (moment) => {
  editingMoment.value = {
    id: moment.id,
    content: moment.content,
    images: moment.images ? moment.images.split(',') : [],
    location: moment.location || ''
  }
}

const cancelEdit = () => {
  editingMoment.value = null
}

const updateMoment = async () => {
  if (!editingMoment.value.content.trim()) {
    toast.warning('请输入动态内容')
    return
  }
  
  isSubmitting.value = true
  try {
    const { code, msg } = await request.put('/api/moments/update', {
      id: editingMoment.value.id,
      content: editingMoment.value.content.trim(),
      images: editingMoment.value.images.join(','),
      location: editingMoment.value.location,
      status: 1
    })
    
    if (code === 200) {
      toast.success(msg)
      editingMoment.value = null
      loadMoments(true)
    } else {
      toast.error(msg)
    }
  } catch (error) {
    toast.error('更新失败：' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

const deleteMoment = async (moment) => {
  if (!confirm('确定要删除这条动态吗？')) return
  
  try {
    const { code, msg } = await request.delete('/api/moments/remove', {
      ids: moment.id
    })
    
    if (code === 200) {
      toast.success(msg)
      loadMoments(true)
    } else {
      toast.error(msg)
    }
  } catch (error) {
    toast.error('删除失败：' + error.message)
  }
}

const handleLike = (moment) => {
  if (!isLogin.value) {
    toast.warning('请登录后再操作')
    return
  }
  toast.success('点赞成功')
}

const toggleComment = (moment) => {
  if (expandedCommentId.value === moment.id) {
    expandedCommentId.value = null
  } else {
    expandedCommentId.value = moment.id
  }
}

const submitComment = (moment) => {
  if (!commentContent.value.trim()) {
    toast.warning('请输入评论内容')
    return
  }
  if (!isLogin.value) {
    toast.warning('请登录后再评论')
    return
  }
  toast.success('评论成功')
  commentContent.value = ''
  expandedCommentId.value = null
}

const shareMoment = (moment) => {
  const url = `${window.location.origin}${window.location.pathname}#/moments`
  navigator.clipboard.writeText(url).then(() => {
    toast.success('链接已复制')
  }).catch(() => {
    toast.error('复制失败')
  })
}

const previewImage = (src) => {
  previewImageSrc.value = src
}

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
    
    if (code === 200) {
      const data = resData.data || []
      data.forEach(item => {
        if (item.images) {
          item.images = item.images.split(',').filter(img => img.trim())
        } else {
          item.images = []
        }
      })
      
      if (reset) {
        momentList.value = data
      } else {
        momentList.value = [...momentList.value, ...data]
      }
      
      hasMore.value = data.length === pageSize
    } else {
      toast.error(msg)
    }
  } catch (error) {
    console.error('获取动态失败:', error)
    toast.error('获取动态失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  page.value++
  loadMoments()
}

onMounted(() => {
  loadMoments()
})
</script>

<style scoped>

.moment-list {
  margin-top: 0;
}
</style>