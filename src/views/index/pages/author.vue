<template>
  <div class="author-page-wrapper mt-2">
    <div v-if="loading" class="row g-3">
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <div class="placeholder-glow">
              <div class="placeholder col-12 mb-3" style="height: 160px;"></div>
              <div class="d-flex gap-3 mb-3">
                <div class="placeholder rounded" style="width: 100px; height: 100px;"></div>
                <div class="flex-grow-1">
                  <div class="placeholder col-6 mb-2" style="height: 24px;"></div>
                  <div class="placeholder col-4 mb-2" style="height: 16px;"></div>
                  <div class="placeholder col-8" style="height: 16px;"></div>
                </div>
              </div>
              <div class="placeholder col-12" style="height: 80px;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="card border-0 shadow-sm">
      <div class="card-body text-center py-5">
        <i class="bi bi-exclamation-circle text-danger" style="font-size: 3rem;"></i>
        <p class="mt-3 text-body-secondary">{{ error }}</p>
        <button @click="fetchUserInfo" class="btn btn-outline-primary btn-sm">重试</button>
      </div>
    </div>

    <div v-else-if="!userInfo" class="card border-0 shadow-sm">
      <div class="card-body text-center py-5">
        <i class="bi bi-person-x text-body-secondary" style="font-size: 3rem;"></i>
        <p class="mt-3 text-body-secondary">用户不存在</p>
      </div>
    </div>

    <template v-else>
      <div class="row g-3 mb-3">
        <div class="col-12">
          <div class="card border-0 shadow-sm overflow-hidden">
            <div class="card-body">
              <div class="d-flex align-items-end gap-3">
                <div class="position-relative flex-shrink-0">
                  <img 
                    :src="userInfo.avatar || defaultAvatar" 
                    :alt="userInfo.nickname"
                    class="rounded-3 border border-4 border-white shadow-sm bg-white"
                    width="110"
                    height="110"
                    style="object-fit: cover;"
                    @error="handleAvatarError"
                  >
                </div>
                
                <div class="flex-grow-1 pb-1">
                  <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                    <h3 class="fw-bold mb-0">{{ userInfo.nickname }}</h3>
                    <span v-for="group in userGroups" :key="group.name" class="badge bg-success">
                      {{ group.name }}
                    </span>
                  </div>
                  <p class="text-body-secondary small mb-0">
                    {{ userInfo.description || '这个人很懒，什么都没有留下！' }}
                  </p>
                </div>
              </div>

              <div class="d-flex flex-wrap align-items-center gap-3 mt-3 pt-3 border-top">
                <span 
                  v-if="userLevelInfo" 
                  class="badge text-white px-2 py-1"
                  style="background: linear-gradient(135deg, #8b5cf6, #ec4899);"
                >
                  Lv.{{ userLevelInfo.current.value }}
                </span>
                <span v-if="genderText" class="d-inline-flex align-items-center text-body-secondary small">
                  <i class="bi bi-gender-ambiguous me-1"></i>{{ genderText }}
                </span>
                <span v-if="userInfo.title" class="d-inline-flex align-items-center text-body-secondary small">
                  <i class="bi bi-award me-1"></i>{{ userInfo.title }}
                </span>
                <span v-if="userInfo.create_time" class="d-inline-flex align-items-center text-body-secondary small">
                  <i class="bi bi-calendar me-1"></i>注册于 {{ formatRegisterTime(userInfo.create_time) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-body py-3">
              <div class="row text-center g-0">
                <div class="col">
                  <div class="fw-bold fs-4 text-body">{{ userStats.articleCount }}</div>
                  <div class="text-body-secondary small">文章</div>
                </div>
                <div class="col border-start">
                  <div class="fw-bold fs-4 text-body">{{ userStats.collectCount }}</div>
                  <div class="text-body-secondary small">收藏</div>
                </div>
                <div class="col border-start">
                  <div class="fw-bold fs-4 text-body">{{ userStats.likeCount }}</div>
                  <div class="text-body-secondary small">获赞</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <ul class="nav nav-pills card-header border-bottom px-3 py-2 gap-2">
              <li class="nav-item">
                <button 
                  class="nav-link d-flex align-items-center gap-2" 
                  :class="{ 'active': activeTab === 'articles' }"
                  @click="switchTab('articles')"
                >
                  <i class="bi bi-file-text"></i>
                  <span>文章</span>
                  <span class="badge bg-secondary">{{ userStats.articleCount }}</span>
                </button>
              </li>
              <li class="nav-item">
                <button 
                  class="nav-link d-flex align-items-center gap-2" 
                  :class="{ 'active': activeTab === 'collections' }"
                  @click="switchTab('collections')"
                >
                  <i class="bi bi-bookmark"></i>
                  <span>收藏</span>
                  <span class="badge bg-secondary">{{ userStats.collectCount }}</span>
                </button>
              </li>
              <li class="nav-item">
                <button 
                  class="nav-link d-flex align-items-center gap-2" 
                  :class="{ 'active': activeTab === 'likes' }"
                  @click="switchTab('likes')"
                >
                  <i class="bi bi-heart"></i>
                  <span>点赞</span>
                  <span class="badge bg-secondary">{{ likeArticles.length }}</span>
                </button>
              </li>
            </ul>

            <div class="card-body p-3">
              <div v-if="activeTab === 'articles'">
                <div v-if="articles.length === 0" class="text-center py-5">
                  <i class="bi bi-file-earmark-text text-body-secondary" style="font-size: 3rem;"></i>
                  <p class="text-body-secondary mt-2">暂无文章</p>
                </div>
                <div v-else class="row g-3">
                  <div 
                    v-for="article in articles" 
                    :key="article.id" 
                    class="col-12 col-sm-6 col-lg-4"
                  >
                    <div 
                      class="card h-100 border-0 shadow-sm overflow-hidden article-card"
                      @click="goToArticle(article.id)"
                    >
                      <div class="article-cover-wrapper">
                        <img 
                          :src="article.covers || defaultCover" 
                          :alt="article.title"
                          class="article-cover-img"
                          loading="lazy"
                        >
                      </div>
                      <div class="card-body">
                        <h6 class="card-title fw-bold text-truncate mb-2">{{ article.title }}</h6>
                        <p class="card-text text-body-secondary small line-clamp-2 mb-2">
                          {{ article.abstract || '暂无摘要' }}
                        </p>
                        <div class="d-flex justify-content-between align-items-center text-body-secondary small">
                          <span>{{ article?.result?.group?.[0]?.name || '未分类' }}</span>
                          <span>{{ formatters.formatDate(article.publish_time) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="articleTotalPages > 1" class="d-flex justify-content-center pt-4">
                  <nav>
                    <ul class="pagination mb-0">
                      <li class="page-item" :class="{ disabled: currentArticlePage <= 1 }">
                        <button class="page-link" @click.prevent="changeArticlePage(currentArticlePage - 1)">
                          <i class="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      <li 
                        v-for="page in visibleArticlePages" 
                        :key="page" 
                        class="page-item"
                        :class="{ active: page === currentArticlePage, disabled: page === '...' }"
                      >
                        <button class="page-link" @click.prevent="page !== '...' && changeArticlePage(page)">
                          {{ page }}
                        </button>
                      </li>
                      <li class="page-item" :class="{ disabled: currentArticlePage >= articleTotalPages }">
                        <button class="page-link" @click.prevent="changeArticlePage(currentArticlePage + 1)">
                          <i class="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>

              <div v-else-if="activeTab === 'collections'">
                <div v-if="collectionArticles.length === 0" class="text-center py-5">
                  <i class="bi bi-bookmark-x text-body-secondary" style="font-size: 3rem;"></i>
                  <p class="text-body-secondary mt-2">暂无收藏</p>
                </div>
                <div v-else class="row g-3">
                  <div 
                    v-for="article in collectionArticles" 
                    :key="article.id" 
                    class="col-12 col-sm-6 col-lg-4"
                  >
                    <div 
                      class="card h-100 border-0 shadow-sm overflow-hidden article-card"
                      @click="goToArticle(article.id)"
                    >
                      <div class="article-cover-wrapper">
                        <img 
                          :src="article.covers || defaultCover" 
                          :alt="article.title"
                          class="article-cover-img"
                          loading="lazy"
                        >
                      </div>
                      <div class="card-body">
                        <h6 class="card-title fw-bold text-truncate mb-2">{{ article.title }}</h6>
                        <p class="card-text text-body-secondary small line-clamp-2 mb-2">
                          {{ article.abstract || '暂无摘要' }}
                        </p>
                        <div class="d-flex justify-content-between align-items-center text-body-secondary small">
                          <span>{{ article?.result?.group?.[0]?.name || '未分类' }}</span>
                          <span>{{ formatters.formatDate(article.publish_time) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="activeTab === 'likes'">
                <div v-if="likeArticles.length === 0" class="text-center py-5">
                  <i class="bi bi-heart text-body-secondary" style="font-size: 3rem;"></i>
                  <p class="text-body-secondary mt-2">暂无点赞</p>
                </div>
                <div v-else class="row g-3">
                  <div 
                    v-for="article in likeArticles" 
                    :key="article.id" 
                    class="col-12 col-sm-6 col-lg-4"
                  >
                    <div 
                      class="card h-100 border-0 shadow-sm overflow-hidden article-card"
                      @click="goToArticle(article.id)"
                    >
                      <div class="article-cover-wrapper">
                        <img 
                          :src="article.covers || defaultCover" 
                          :alt="article.title"
                          class="article-cover-img"
                          loading="lazy"
                        >
                      </div>
                      <div class="card-body">
                        <h6 class="card-title fw-bold text-truncate mb-2">{{ article.title }}</h6>
                        <p class="card-text text-body-secondary small line-clamp-2 mb-2">
                          {{ article.abstract || '暂无摘要' }}
                        </p>
                        <div class="d-flex justify-content-between align-items-center text-body-secondary small">
                          <span>{{ article?.result?.group?.[0]?.name || '未分类' }}</span>
                          <span>{{ formatters.formatDate(article.publish_time) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
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

const SITE_TITLE = import.meta.env.VITE_TITLE || 'Xiao-INIS'

const getSiteTitle = () => {
  return store.siteInfo?.title || SITE_TITLE
}

const loading = ref(false)
const error = ref('')
const userInfo = ref(null)
const activeTab = ref('articles')

const articles = ref([])
const articleCount = ref(0)
const currentArticlePage = ref(1)
const articleTotalPages = ref(1)

const collectionArticles = ref([])
const likeArticles = ref([])

const userStats = ref({
  articleCount: 0,
  collectCount: 0,
  likeCount: 0
})

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
    return []
  }
  if (userAuthInfo.value.group?.list && userAuthInfo.value.group.list.length > 0) {
    return userAuthInfo.value.group.list
  }
  return []
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
        limit: 9,
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
      articleTotalPages.value = Math.ceil(count / 9) || 1
    }
  } catch (err) {
    articles.value = []
    articleCount.value = 0
  }
}

const fetchUserCollections = async () => {
  try {
    if (!userId.value) return
    
    const cacheKey = `author_collections_${userId.value}`
    const cacheExpire = 10
    const cached = cache.get(cacheKey)
    if (cached) {
      collectionArticles.value = cached
      return
    }
    
    const whereParam = JSON.stringify({ uid: userId.value, type: 'collect', bind_type: 'article', state: 1 })
    const res = await request.get('/api/exp/all', {
      where: whereParam,
      limit: 9
    })
    
    if (res.code === 200 && res.data) {
      const expList = Array.isArray(res.data) ? res.data : res.data.data || []
      const articleIds = expList.map(item => item.bind_id).filter(id => id)
      
      if (articleIds.length > 0) {
        const articleWhere = JSON.stringify({ id: { '$in': articleIds } })
        const articleRes = await request.get('/api/article/all', {
          where: articleWhere,
          limit: 9
        })
        
        if (articleRes.code === 200) {
          collectionArticles.value = articleRes.data?.data || articleRes.data || []
        }
      } else {
        collectionArticles.value = []
      }
      cache.set(cacheKey, collectionArticles.value, cacheExpire)
    } else {
      collectionArticles.value = []
    }
  } catch (err) {
    collectionArticles.value = []
  }
}

const fetchUserLikes = async () => {
  try {
    if (!userId.value) return
    
    const cacheKey = `author_likes_${userId.value}`
    const cacheExpire = 10
    const cached = cache.get(cacheKey)
    if (cached) {
      likeArticles.value = cached
      return
    }
    
    const whereParam = JSON.stringify({ uid: userId.value, type: 'like', bind_type: 'article', state: 1 })
    const res = await request.get('/api/exp/all', {
      where: whereParam,
      limit: 9
    })
    
    if (res.code === 200 && res.data) {
      const expList = Array.isArray(res.data) ? res.data : res.data.data || []
      const articleIds = expList.map(item => item.bind_id).filter(id => id)
      
      if (articleIds.length > 0) {
        const articleWhere = JSON.stringify({ id: { '$in': articleIds } })
        const articleRes = await request.get('/api/article/all', {
          where: articleWhere,
          limit: 9
        })
        
        if (articleRes.code === 200) {
          likeArticles.value = articleRes.data?.data || articleRes.data || []
        }
      } else {
        likeArticles.value = []
      }
      cache.set(cacheKey, likeArticles.value, cacheExpire)
    } else {
      likeArticles.value = []
    }
  } catch (err) {
    likeArticles.value = []
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

const switchTab = (tab) => {
  activeTab.value = tab
  if (tab === 'articles') {
    fetchUserArticles()
  } else if (tab === 'collections') {
    fetchUserCollections()
  } else if (tab === 'likes') {
    fetchUserLikes()
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

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

onMounted(() => {
  fetchUserInfo()
  fetchUserArticles()
  initUserStats()
})

onUnmounted(() => {
  document.title = getSiteTitle()
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
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-card {
  cursor: pointer;
  transition: all 0.25s ease;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12) !important;
}

.article-cover-wrapper {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background-color: #f3f4f6;
}

.article-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.article-card:hover .article-cover-img {
  transform: scale(1.05);
}

.nav-pills .nav-link {
  color: #6c757d;
  background: transparent;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.nav-pills .nav-link:hover {
  background-color: #f8f9fa;
}

.nav-pills .nav-link.active {
  background-color: #0d6efd;
  color: #fff;
}

.nav-pills .nav-link.active .badge {
  background-color: rgba(255, 255, 255, 0.25) !important;
}

[bs-theme=dark] .article-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4) !important;
}

[bs-theme=dark] .nav-pills .nav-link:hover {
  background-color: #2b2b2b;
}

[bs-theme=dark] .article-cover-wrapper {
  background-color: #1f1f1f;
}
</style>
