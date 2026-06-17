<template>
  <div class="author-page-wrapper mt-2">
    <!-- 加载状态 -->
    <div v-if="loading" class="card border-0 shadow-sm">
      <div class="card-body mt-2">
        <!-- 用户基本信息骨架 -->
        <div class="d-flex align-items-start gap-4 mb-4">
          <div class="skeleton skeleton-avatar"></div>
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-3 mb-2">
              <div class="skeleton skeleton-nickname"></div>
              <div class="skeleton skeleton-badge"></div>
            </div>
            <div class="skeleton skeleton-website mb-3"></div>
            <div class="d-flex align-items-center gap-4 flex-wrap">
              <div class="skeleton skeleton-info-item"></div>
              <div class="skeleton skeleton-info-item"></div>
            </div>
          </div>
        </div>
        <div class="skeleton skeleton-description mb-4"></div>
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <div class="skeleton skeleton-tag"></div>
          <div class="skeleton skeleton-tag"></div>
          <div class="skeleton skeleton-tag"></div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="card border-0 shadow-sm">
      <div class="card-body text-center py-5">
        <i class="bi bi-exclamation-circle text-danger fs-1"></i>
        <p class="mt-3 text-body-secondary">{{ error }}</p>
        <button @click="fetchUserInfo" class="btn btn-outline-secondary btn-sm">
          重试
        </button>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-else-if="!userInfo" class="card border-0 shadow-sm">
      <div class="card-body text-center py-5">
        <i class="bi bi-person-x text-body-secondary fs-1"></i>
        <p class="mt-3 text-body-secondary">用户不存在</p>
      </div>
    </div>

    <!-- 用户信息内容 -->
    <div v-else>
      <!-- 用户信息卡片 -->
      <div class="card border-0 shadow-sm mb-2">
        <!-- 横幅背景 -->
        <div 
          class="card-img-top banner-bg" 
          :style="{ backgroundImage: `url(${userInfo.banner || defaultBanner})` }"
        ></div>
        
        <div class="card-body position-relative">
          <!-- 头像 -->
          <div class="d-flex flex-column align-items-center">
            <div class="avatar-wrapper mt-0">
              <div class="avatar-container position-relative">
                <img 
                  :src="userInfo.avatar || defaultAvatar" 
                  :alt="userInfo.nickname"
                  class="rounded-3 border-4 border-white shadow"
                  width="120"
                  height="120"
                  style="object-fit: cover;"
                  @error="handleAvatarError"
                >
                <div class="avatar-status" :class="{ 'online': userInfo.login_time && (Date.now() / 1000 - userInfo.login_time < 86400) }"></div>
              </div>
            </div>

            <!-- 用户名和标签 -->
            <h3 class="mt-3 mb-2 fw-bold">{{ userInfo.nickname }}</h3>
            
            <div class="d-flex flex-wrap justify-content-center gap-2 mb-3">
              <span v-for="(group, index) in userGroups" :key="index" class="badge bg-success px-3 py-1">
                {{ group.name }}
              </span>
              <span v-if="userLevelInfo" class="badge bg-primary rounded-pill px-3 py-1">
                Lv.{{ userLevelInfo.current.value }} {{ userLevelInfo.current.name }}
              </span>
            </div>

            <!-- 个人网站 -->
            <div v-if="userInfo.json?.website?.url" class="mb-3">
              <a 
                :href="userInfo.json.website.url" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-decoration-none text-body-secondary d-flex align-items-center gap-2"
              >
                <i class="bi bi-globe"></i>
                <span class="text-truncate" style="max-width: 200px;">
                  {{ userInfo.json.website.name || userInfo.json.website.url }}
                </span>
              </a>
            </div>

            <!-- 个人简介 -->
            <p class="text-body-secondary mb-3 text-center" style="max-width: 600px;">
              {{ userInfo.description || '这个人很懒，什么都没有留下！' }}
            </p>

            <!-- 用户基本信息 -->
            <div class="d-flex flex-wrap justify-content-center gap-4 text-sm text-body-secondary">
              <!-- 性别 -->
              <div v-if="genderText" class="d-flex align-items-center gap-1">
                <i class="bi bi-gender-ambiguous"></i>
                <span>{{ genderText }}</span>
              </div>
              <!-- 头衔 -->
              <div v-if="userInfo.title" class="d-flex align-items-center gap-1">
                <i class="bi bi-award"></i>
                <span>{{ userInfo.title }}</span>
              </div>
            </div>
            <!-- 注册时间 -->
            <div v-if="userInfo.create_time" class="d-flex align-items-center gap-1 mt-2">
              <i class="bi bi-calendar"></i>
              <span>加入时间：{{ formatRegisterTime(userInfo.create_time) }}</span>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="row g-0 mt-4 pt-4 border-top">
            <div class="col text-center py-2">
              <div v-if="statsLoading" class="spinner-border spinner-border-sm text-secondary" role="status"></div>
              <div v-else class="fw-bold fs-5">{{ userStats.articleCount }}</div>
              <div class="text-secondary small">文章</div>
            </div>
            <div class="col-auto d-none d-md-block border-end"></div>
            <div class="col text-center py-2">
              <div v-if="statsLoading" class="spinner-border spinner-border-sm text-secondary" role="status"></div>
              <div v-else class="fw-bold fs-5">{{ userStats.collectCount }}</div>
              <div class="text-secondary small">收藏</div>
            </div>
            <div class="col-auto d-none d-md-block border-end"></div>
            <div class="col text-center py-2">
              <div v-if="statsLoading" class="spinner-border spinner-border-sm text-secondary" role="status"></div>
              <div v-else class="fw-bold fs-5">{{ userStats.likeCount }}</div>
              <div class="text-secondary small">点赞</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文章列表卡片 -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent py-3">
          <h5 class="mb-0 fw-bold">
            <i class="bi bi-file-text me-2"></i>发布
            <span class="badge bg-secondary ms-2">{{ articleCount }}</span>
          </h5>
        </div>
        <div class="card-body p-3">
          <!-- 空状态 -->
          <div v-if="articles.length === 0" class="text-center py-5">
            <i class="bi bi-file-earmark-text text-body-secondary fs-1 mb-2 d-block"></i>
            <p class="mb-0 text-body-secondary">暂无文章</p>
          </div>

          <!-- 文章列表 -->
          <div v-else>
            <div 
              v-for="article in articles" 
              :key="article.id" 
              class="card article-item-card shadow-sm mb-3 overflow-hidden"
              @click="goToArticle(article.id)"
            >
              <div class="row g-0">
                <!-- 文章封面 -->
                <div class="col-md-4">
                  <img 
                    :src="article.covers || defaultCover" 
                    :alt="article.title"
                    class="img-fluid w-100 h-100"
                    style="object-fit: cover; min-height: 160px;"
                  >
                </div>
                <!-- 文章内容 -->
                <div class="col-md-8">
                  <div class="card-body d-flex flex-column h-100">
                    <h5 class="card-title fw-bold text-truncate mb-2">{{ article.title }}</h5>
                    <p class="card-text text-body-secondary small flex-grow-1">
                      {{ article.abstract || '暂无摘要' }}
                    </p>
                    <div class="d-flex justify-content-between align-items-center text-secondary small mt-auto">
                      <span class="badge bg-light text-dark">
                        {{ article?.result?.group?.[0]?.name || '未分类' }}
                      </span>
                      <span>{{ formatters.formatDate(article.publish_time) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分页 -->
            <div v-if="articleTotalPages > 1" class="d-flex justify-content-center mt-4">
              <nav>
                <ul class="pagination mb-0">
                  <li class="page-item" :class="{ disabled: currentArticlePage <= 1 }">
                    <a class="page-link" href="#" @click.prevent="changeArticlePage(currentArticlePage - 1)">
                      <i class="bi bi-chevron-left"></i>
                    </a>
                  </li>
                  <li 
                    v-for="page in visibleArticlePages" 
                    :key="page" 
                    class="page-item"
                    :class="{ active: page === currentArticlePage, disabled: page === '...' }"
                  >
                    <a class="page-link" href="#" @click.prevent="page !== '...' && changeArticlePage(page)">
                      {{ page }}
                    </a>
                  </li>
                  <li class="page-item" :class="{ disabled: currentArticlePage >= articleTotalPages }">
                    <a class="page-link" href="#" @click.prevent="changeArticlePage(currentArticlePage + 1)">
                      <i class="bi bi-chevron-right"></i>
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '@/utils/network'
import { cache } from '@/utils/network'
import utils from '@/utils/utils'
import defaultAvatar from '@/assets/img/avatar.png'
import defaultBanner from '@/assets/img/fm.avif'
import defaultCover from '@/assets/img/fm.avif'
import { useCommStore } from '@/store/comm'
import { formatters } from '@/utils/app'

const route = useRoute()
const router = useRouter()
const store = useCommStore()

const SITE_TITLE = import.meta.env.VITE_TITLE || '朱某的生活印记'

const getSiteTitle = () => {
  return store.siteInfo?.title || SITE_TITLE
}

const loading = ref(false)
const error = ref('')
const userInfo = ref(null)
const articles = ref([])
const articleCount = ref(0)
const currentArticlePage = ref(1)
const articleTotalPages = ref(1)
const isMobile = ref(false)

const userStats = ref({
  articleCount: 0,
  collectCount: 0,
  likeCount: 0
})
const statsLoading = ref(false)

const refreshInterval = ref(null)

const userId = computed(() => {
  return route.params.id || 1
})

const isAdmin = computed(() => {
  if (!userInfo.value || !userInfo.value.result?.auth) return false
  return userInfo.value.result.auth.all || 
    (userInfo.value.result.auth.group?.list && 
     userInfo.value.result.auth.group.list.some(group => group.key === 'admin'))
})

const userLevelInfo = computed(() => {
  return userInfo.value?.result?.level
})

const userAuthInfo = computed(() => {
  return userInfo.value?.result?.auth
})

const userGroups = computed(() => {
  if (!userAuthInfo.value) {
    return [{ name: '普通用户' }]
  }
  
  if (userAuthInfo.value.group?.list && userAuthInfo.value.group.list.length > 0) {
    return userAuthInfo.value.group.list
  }
  
  return [{ name: '普通用户' }]
})

const genderText = computed(() => {
  const gender = userInfo.value?.gender
  const genderMap = {
    'boy': '男',
    'girl': '女',
    1: '男',
    2: '女'
  }
  return genderMap[gender] || ''
})

const formatRegisterTime = (timestamp) => {
  return utils.timeToDate(timestamp, 'Y年m月d日')
}

const fetchUserInfo = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const cacheKey = `author_user_info_${userId.value}`
    const cacheExpire = 30
    
    const cachedUserInfo = cache.get(cacheKey)
    if (cachedUserInfo) {
      userInfo.value = cachedUserInfo
      loading.value = false
      return
    }
    
    const res = await request.get('/api/users/one', {
      id: userId.value
    })
    
    if (res.code === 200 && res.data) {
      userInfo.value = res.data
      cache.set(cacheKey, res.data, cacheExpire)
    } else {
      error.value = res.msg || '获取用户信息失败'
      userInfo.value = null
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
    userInfo.value = null
  } finally {
    loading.value = false
  }
}

const fetchUserArticles = async () => {
  try {
    if (!userId.value) return
    
    const currentUserId = userId.value
    
    const whereParam = JSON.stringify({ uid: currentUserId, audit: 1 })
    const countWhereParam = JSON.stringify({ uid: currentUserId, audit: 1 })
    
    const [articlesRes, countRes] = await Promise.all([
      request.get('/api/article/all', {
        where: whereParam,
        page: currentArticlePage.value,
        limit: 10,
        order: 'create_time desc'
      }),
      request.get('/api/article/count', {
        where: countWhereParam
      })
    ])
    
    if (articlesRes.code === 200) {
      if (articlesRes.data && articlesRes.data.data) {
        articles.value = articlesRes.data.data
        articleCount.value = articlesRes.data.count || 0
      } else if (articlesRes.data && Array.isArray(articlesRes.data)) {
        articles.value = articlesRes.data
        articleCount.value = articlesRes.count || 0
      } else {
        articles.value = []
        articleCount.value = 0
      }
    } else {
      articles.value = []
      articleCount.value = 0
    }
    
    if (countRes.code === 200) {
      const count = countRes.data?.count ?? countRes.count ?? countRes.data ?? 0
      articleCount.value = count
      articleTotalPages.value = Math.ceil(count / 10) || 1
    }
  } catch (err) {
    articles.value = []
    articleCount.value = 0
  }
}

const visibleArticlePages = computed(() => {
  const total = articleTotalPages.value
  const current = currentArticlePage.value
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const changeArticlePage = (page) => {
  if (page < 1 || page > articleTotalPages.value) return
  currentArticlePage.value = page
  fetchUserArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const getArticleCount = async (userId) => {
  try {
    const whereParam = JSON.stringify({ uid: userId })
    const response = await request.get('/api/article/count', {
      where: whereParam
    })
    if (response.code === 200) {
      return response.data
    }
    return 0
  } catch (error) {
    return 0
  }
}

const getCollectCount = async (userId) => {
  try {
    const whereParam = JSON.stringify({ uid: userId, type: 'collect', state: 1 })
    const response = await request.get('/api/exp/count', {
      where: whereParam
    })
    if (response.code === 200) {
      return response.data
    }
    return 0
  } catch (error) {
    return 0
  }
}

const getLikeCount = async (userId) => {
  try {
    const whereParam = JSON.stringify({ uid: userId, type: 'like', state: 1 })
    const response = await request.get('/api/exp/count', {
      where: whereParam
    })
    if (response.code === 200) {
      return response.data
    }
    return 0
  } catch (error) {
    return 0
  }
}

const initUserStats = async () => {
  if (!userId.value) return
  
  const cacheKey = `author_user_stats_${userId.value}`
  const cacheExpire = 10
  
  const cachedData = cache.get(cacheKey)
  if (cachedData) {
    userStats.value = cachedData
    return
  }
  
  statsLoading.value = true
  try {
    const [articleCountData, collectCount, likeCount] = await Promise.all([
      getArticleCount(userId.value),
      getCollectCount(userId.value),
      getLikeCount(userId.value)
    ])
    
    userStats.value = {
      articleCount: articleCountData,
      collectCount,
      likeCount
    }
    
    cache.set(cacheKey, userStats.value, cacheExpire)
  } catch (error) {
    userStats.value = {
      articleCount: 0,
      collectCount: 0,
      likeCount: 0
    }
  } finally {
    statsLoading.value = false
  }
}

const goToArticle = (articleId) => {
  const validArticleId = parseInt(articleId)
  if (!isNaN(validArticleId) && validArticleId > 0) {
    router.push(`/archives/${validArticleId}`)
  }
}

const handleAvatarError = (event) => {
  event.target.src = defaultAvatar
}

const setPageTitle = (nickname) => {
  if (nickname) {
    document.title = `${nickname} - ${getSiteTitle()}`
  } else {
    document.title = `用户主页 - ${getSiteTitle()}`
  }
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  fetchUserInfo()
  fetchUserArticles()
  initUserStats()
  
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
  
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  document.title = getSiteTitle()
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
  window.removeEventListener('resize', checkMobile)
})

watch(
  () => userInfo.value,
  (newUserInfo) => {
    if (newUserInfo) {
      setPageTitle(newUserInfo.nickname)
    } else {
      setPageTitle('')
    }
  },
  { immediate: true }
)

watch(
  () => route.params.id,
  (newUserId) => {
    if (newUserId) {
      currentArticlePage.value = 1
      fetchUserInfo()
      fetchUserArticles()
      initUserStats()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* 骨架加载器 */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-avatar {
  width: 120px;
  height: 120px;
  border-radius: 8px;
}

.skeleton-nickname {
  height: 1.5rem;
  width: 150px;
}

.skeleton-badge {
  height: 1.2rem;
  width: 80px;
  border-radius: 1rem;
}

.skeleton-website {
  height: 1rem;
  width: 200px;
}

.skeleton-info-item {
  height: 1rem;
  width: 120px;
}

.skeleton-description {
  height: 4rem;
  width: 100%;
}

.skeleton-tag {
  height: 1.5rem;
  width: 100px;
  border-radius: 1rem;
}

/* 横幅背景 */
.banner-bg {
  height: 200px;
  background-size: cover;
  background-position: center;
}

/* 头像样式 */
.avatar-container {
  position: relative;
  display: inline-block;
  margin-top: -60px;
}

.avatar-status {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ccc;
  border: 3px solid white;
  transition: all 0.3s ease;
}

.avatar-status.online {
  background-color: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
  }
}

/* 文章卡片 */
.article-item-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.article-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

/* 响应式 */
@media (max-width: 768px) {
  .banner-bg {
    height: 150px;
  }

  .avatar-container {
    margin-top: -50px;
  }

  .avatar-container img {
    width: 100px !important;
    height: 100px !important;
  }
}

@media (max-width: 576px) {
  .banner-bg {
    height: 120px;
  }

  .avatar-container {
    margin-top: -40px;
  }

  .avatar-container img {
    width: 80px !important;
    height: 80px !important;
  }
}

/* 暗黑模式 */
[data-bs-theme=dark] .skeleton {
  background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
}

[data-bs-theme=dark] .article-item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
