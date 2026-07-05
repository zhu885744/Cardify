<template>
  <!-- 快速发文章模块 -->
  <div v-if="isLogin" class="mt-2 card shadow-sm">
    <div class="card-body p-2">
      <div 
        @click="toggleQuickEditor" 
        class="w-full d-flex align-items-center justify-content-between py-2 px-3 rounded-lg hover-bg-secondary transition-colors"
      >
        <span class="d-flex align-items-center gap-2">
          <i class="bi bi-pencil-square text-secondary"></i>
          <span class="text-sm text-body">快速发布文章</span>
        </span>
        <i class="bi bi-chevron-down transition-transform" :class="{ 'rotate-180': showQuickEditor }"></i>
      </div>
      <div v-if="showQuickEditor" class="mt-3 pt-3 border-t">
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>温馨提示：</strong> <br>
          由于一些合规原因，通过快速发布文章功能发布的文章发布后无法立即显示，待系统审核后将自动显示。
        </div>
        <input 
          v-model="formData.title" 
          type="text" 
          placeholder="请输入文章标题"
          class="form-control form-control-sm mb-2"
          maxlength="100"
        />
        <i-md-editor 
          v-model="formData.content"
          placeholder="写点什么吧..."
          @update:model-value="handleEditorInput"
        />
        <!-- 文章设置行：分类 / 标签 / 发布时间 -->
        <div class="row g-2 mt-2">
          <div class="col-md-4">
            <select v-model="formData.group" class="form-select form-select-sm">
              <option value="">选择分类</option>
              <option v-for="g in articleGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div class="col-md-5">
            <div class="d-flex align-items-center gap-1 position-relative">
              <input
                v-model="newTag"
                type="text"
                class="form-control form-control-sm"
                placeholder="输入标签名选择或新建"
                @keyup.enter="addTag"
                @focus="showTagDropdown = true"
                @blur="hideTagDropdown"
              />
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="addTag">
                <i class="bi bi-plus"></i>
              </button>
              <!-- 已有标签下拉 -->
              <div v-show="showTagDropdown && filteredExistingTags.length > 0" class="tag-suggest-dropdown">
                <div 
                  v-for="tag in filteredExistingTags" 
                  :key="tag"
                  class="tag-suggest-item"
                  @mousedown.prevent="selectExistingTag(tag)"
                >
                  {{ tag.name }}
                </div>
              </div>
            </div>
            <div v-if="formData.tags.length > 0" class="d-flex flex-wrap gap-1 mt-1">
              <span
                v-for="(tag, index) in formData.tags"
                :key="index"
                class="badge bg-secondary-subtle text-secondary d-flex align-items-center gap-1"
              >
                {{ tag.name }}
                <i class="bi bi-x cursor-pointer" @click="removeTag(index)"></i>
              </span>
            </div>
          </div>
          <div class="col-md-3">
            <input 
              v-model="quickArticlePublishTime" 
              type="datetime-local" 
              class="form-control form-control-sm"
            />
          </div>
        </div>
        <div class="mt-2 d-flex justify-end gap-2">
          <button 
            @click="toggleQuickEditor" 
            class="btn btn-secondary btn-sm"
          >
            取消
          </button>
          <button 
            type="button"
            class="btn btn-outline-primary btn-sm"
            @click="saveDraft"
            :disabled="isPublishing"
          >
            <i class="bi bi-save me-1"></i>
            {{ isPublishing ? '保存中...' : '保存草稿' }}
          </button>
          <button 
            @click="publishQuickArticle" 
            class="btn btn-primary btn-sm"
            :disabled="isPublishing"
          >
            <i class="bi bi-send me-1"></i>
            {{ isPublishing ? '发布中...' : '发布' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 轮播图 -->
  <div v-if="banners.length > 0 || bannersLoading" class="mt-2">
    <!-- 轮播图加载中 -->
    <div v-if="bannersLoading" class="carousel-loading card shadow-sm">
      <div class="skeleton skeleton-carousel"></div>
    </div>
    <!-- 轮播图内容 -->
    <div v-else id="carouselExampleControls" class="carousel slide position-relative">
      <div class="carousel-inner">
        <div 
          v-for="(banner, index) in banners" 
          :key="banner.id"
          class="carousel-item" 
          :class="{ active: index === 0 }"
        >
          <a :href="banner.url" :target="banner.target" class="d-block w-100">
            <img 
              :src="banner.image" 
              :alt="banner.title" 
              class="d-block w-100 carousel-img"
            >
          </a>
        </div>
      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleControls" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleControls" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>
  </div>

  <!-- 加载状态 -->
  <div v-if="loading && articleList.length === 0" class="article-list-container mt-2">
    <!-- 骨架加载 -->
    <div v-for="i in 6" :key="`skeleton-${i}`" :class="['card', hasImageMode ? 'article-item-card shadow-sm' : 'article-item-list shadow-sm mt-2']">
      <!-- 有图模式骨架 -->
      <div v-if="hasImageMode" class="card-body p-0 d-flex flex-column h-100">
        <!-- 封面骨架 -->
        <div class="article-cover flex-shrink-0">
          <div class="skeleton skeleton-cover"></div>
        </div>
        <!-- 内容骨架 -->
        <div class="article-content p-2 flex-grow-1 d-flex flex-column">
          <!-- 标题骨架 -->
          <div class="skeleton skeleton-title mb-1"></div>
          <!-- 摘要骨架 -->
          <div class="skeleton skeleton-desc mt-auto mb-1"></div>
          <!-- 元信息骨架 -->
          <div class="d-flex justify-content-between mt-2">
            <div class="skeleton skeleton-meta-left"></div>
            <div class="skeleton skeleton-meta-right"></div>
          </div>
        </div>
      </div>
      <!-- 列表模式骨架 -->
      <div v-else class="card-body p-4">
        <div class="d-flex align-items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 bg-secondary-subtle rounded-lg"></div>
          <div class="flex-grow-1 min-width-0">
            <div class="skeleton skeleton-title-list mb-2"></div>
            <div class="skeleton skeleton-desc-list mb-2"></div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <div class="skeleton skeleton-meta-left"></div>
              <div class="skeleton skeleton-meta-right"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 空数据状态 -->
  <div v-else-if="articleList.length === 0 && !loading" class="alert alert-light text-center py-4 mt-2">
    <p class="mb-0 text-muted fs-7">暂无文章数据</p>
  </div>

  <!-- 文章列表 -->
  <div v-else :class="['article-list-container mt-2', hasImageMode ? 'grid-article-list' : 'list-article-list']">
    <div 
      v-for="article in sortedArticleList" 
      :key="article.id"
      :class="[
        'card', 
        hasImageMode ? 'article-item-card shadow-sm hover-shadow' : 'article-item-list shadow-sm hover-shadow mt-2',
        {'sticky-article': article.top === 1}
      ]"
      @click="toArticleDetail(article.id)" 
      style="cursor: pointer;"
    >
      <!-- 置顶标识 -->
      <div class="sticky-badge" v-if="article.top === 1">
        <i class="bi bi-pin-angle-fill"></i> 置顶
      </div>
      
      <!-- 有图模式布局 -->
      <div v-if="hasImageMode" class="card-body p-0 d-flex flex-column h-100">
        <!-- 文章封面 -->
        <div class="article-cover flex-shrink-0">
          <img 
            :src="loadingGif" 
            :data-src="getCoverImg(article)" 
            :alt="article.title" 
            class="article-cover-img w-100 h-100 object-cover lazy-img"
            @load="onImageLoad"
            @error="handleImageError"
          >
        </div>
        <!-- 内容 -->
        <div class="article-content p-2 flex-grow-1 d-flex flex-column">
          <!-- 文章标题 -->
          <h3 class="article-title fw-bold mb-1 m-0">
            {{ article.title }}
          </h3>

          <!-- 文章摘要 -->
          <p class="article-desc text-truncate-1 mt-auto mb-1">
            {{ article.abstract || '暂无摘要' }}
          </p>

          <!-- 元信息 -->
          <div class="article-meta d-flex align-items-center w-100 m-0">
            <div class="meta-left d-flex align-items-center gap-0.5">
              <span class="meta-item"><i class="bi bi-folder-fill"></i>{{ article?.result?.group?.[0]?.name || '未分类' }}</span>
            </div>
            <div class="meta-right d-flex align-items-center gap-0.5 ms-auto">
              <span class="meta-item"><i class="bi bi-calendar-fill"></i>{{ formatTime(article.publish_time) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 列表模式布局 -->
      <div v-else class="card-body p-4">
        <div class="d-flex align-items-start gap-4">
          <div class="flex-grow-1 min-width-0">
            <div class="d-flex align-items-center gap-2 mb-2">
              <span class="badge bg-secondary-subtle text-secondary text-xs">{{ article?.result?.group?.[0]?.name || "未分类" }}</span>
              <span class="text-xs text-muted">{{ formatTime(article.publish_time) }}</span>
            </div>
            <h3 class="article-title-list h5 fw-bold mb-2">
              {{ article.title }}
            </h3>
            <p class="article-desc-list text-muted mb-3">
              {{ article.abstract || "暂无摘要" }}
            </p>
            <div class="d-flex align-items-center gap-4 article-meta-info">
              <span><i class="bi bi-person-fill me-1"></i>{{ article?.result?.author?.nickname || '匿名' }}</span>
              <span><i class="bi bi-eye-fill me-1"></i>{{ article.views || 0 }}</span>
              <span><i class="bi bi-heart-fill me-1"></i>{{ article?.result?.like?.length || 0 }}</span>
              <span><i class="bi bi-chat-fill me-1"></i>{{ article?.result?.comment?.count || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 分页 -->
  <div v-if="total > 0" class="pagination-container mt-4">
    <nav aria-label="Page navigation">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="changePage(currentPage - 1)">
            <span aria-hidden="true">&laquo;</span>
          </button>
        </li>
        <li class="page-item active">
          <span class="page-link">{{ currentPage }} / {{ pageCount }}</span>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === pageCount }">
          <button class="page-link" @click="changePage(currentPage + 1)">
            <span aria-hidden="true">&raquo;</span>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { request } from '@/utils/network'
import { usePageTitle, toast } from '@/utils/app'
import { cache } from '@/utils/network'
import { useCommStore } from '@/store/comm'
import { useBannerStore } from '@/store/banner'
import iMdEditor from '@/comps/custom/i-md-editor.vue'

// 使用页面标题管理
const { setDynamicTitle } = usePageTitle();
setDynamicTitle('首页');

// 导入本地图片
import defaultCover from '@/assets/img/fm.avif'
import loadingGif from '@/assets/img/ljz.gif'

const router = useRouter()
const commStore = useCommStore()
const bannerStore = useBannerStore()

// 图片缓存
const imageCache = new Set()

// 下拉刷新相关
const isRefreshing = ref(false)
const showRefreshHint = ref(false)

const articleList = ref([])
  const loading = ref(false)
  const currentPage = ref(1)
  const limit = ref(10)
  const total = ref(0)
  const order = ref('top desc, create_time desc')

  // 快速发文章相关
  const showQuickEditor = ref(false)
  const quickArticlePublishTime = ref('')
  const isPublishing = ref(false)
  const articleGroups = ref([])
  const newTag = ref('')
  const showTagDropdown = ref(false)
  const allTags = ref([])

  const formData = reactive({
    title: '',
    content: '',
    group: '',
    tags: [],
    publish_time: ''
  })

  // 过滤已有标签：排除已选的、匹配输入的
  const filteredExistingTags = computed(() => {
    const search = newTag.value.trim().toLowerCase()
    const selectedIds = new Set(formData.tags.map(t => t.id))
    return allTags.value.filter(t => 
      !selectedIds.has(t.id) && t.name.toLowerCase().includes(search)
    )
  })

const isLogin = computed(() => commStore.login.finish && Object.keys(commStore.login.user).length > 0)

// 显示模式：true为有图模式（网格布局），false为列表模式（列表布局）
const hasImageMode = ref(true)
// 轮播图数据
const banners = ref([])
const bannersLoading = ref(false)

// 从后端API获取显示模式设置
const loadDisplayMode = async () => {
  try {
    // 优先从 store 读取（siteInfo 已经在应用初始化时缓存过了）
    if (commStore.siteInfo?.display_mode !== undefined) {
      hasImageMode.value = commStore.siteInfo.display_mode !== false
      return
    }
    // 如果 store 没有，再请求 API（兜底）
    const response = await request.get('/api/config/one', { key: 'cardify_functions' })
    if (response.code === 200 && response.data) {
      const config = response.data.json || {}
      hasImageMode.value = config.display_mode !== false
    }
  } catch (error) {
    console.error('读取显示模式设置失败:', error)
    hasImageMode.value = true
  }
}

// 保存显示模式设置到后端API
const saveDisplayMode = async (mode) => {
  try {
    await request.post('/api/config/save', {
      key: 'cardify_functions',
      json: { display_mode: mode }
    })
  } catch (error) {
    console.error('保存显示模式设置失败:', error)
  }
}

// 监听显示模式变化
const changeDisplayMode = async (mode) => {
  hasImageMode.value = mode
  await saveDisplayMode(mode)
}

// 计算总页数
const pageCount = computed(() => {
  return Math.ceil(total.value / limit.value)
})

// 计算排序后的文章列表：置顶文章在前面
const sortedArticleList = computed(() => {
  return [...articleList.value].sort((a, b) => {
    if (a.top !== b.top) {
      return b.top - a.top // 置顶的在前面
    }
    return new Date(b.create_time * 1000) - new Date(a.create_time * 1000)
  })
})

// 切换分页
const changePage = (page) => {
  if (page < 1 || page > pageCount.value) return
  currentPage.value = page
  getArticleList(page, false)
}

// 处理排序变化
const handleSortChange = () => {
  currentPage.value = 1
  getArticleList(1)
}

const formatTime = (timestamp) => {
  if (!timestamp || timestamp === 0) return '未知时间'
  const date = new Date(timestamp * 1000)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取封面图片 - 响应式处理
const getCoverImg = (article) => {
  // 1. 优先使用文章自身封面
  if (article.covers && article.covers.trim() !== '') {
    // 响应式图片处理
    const screenWidth = window.innerWidth
    const devicePixelRatio = window.devicePixelRatio || 1
    
    // 根据屏幕宽度和像素密度确定图片尺寸
    let imageSize = 'medium' // 默认中等尺寸
    
    if (screenWidth < 768) {
      // 移动设备
      imageSize = 'small'
    } else if (screenWidth < 1200) {
      // 平板设备
      imageSize = 'medium'
    } else {
      // 桌面设备
      imageSize = 'large'
    }
    
    // 如果像素密度高，使用更大的图片
    // 避免在低像素密度设备上显示模糊的图片
    if (devicePixelRatio > 1.5) {
      if (imageSize === 'small') imageSize = 'medium'
      else if (imageSize === 'medium') imageSize = 'large'
    }
    
    // 这里假设图片URL支持通过参数调整尺寸
    // 如果后端支持，可以在这里修改URL来获取不同尺寸的图片
    // 例如: article.covers + '?size=' + imageSize
    // 目前暂时返回原始URL
    return article.covers
  }
  
  // 2. 使用导入的本地默认封面图片
  return defaultCover
}

// 图片加载成功处理
const onImageLoad = (event) => {
  const img = event.target
  const src = img.src
  
  // 添加到缓存
  // 避免重复加载
  // 仅在图片加载成功后添加到缓存
  if (src && !imageCache.has(src)) {
    imageCache.add(src)
  }
  
  // 使用requestAnimationFrame优化DOM操作，减少重绘
  requestAnimationFrame(() => {
    // 移除loading样式
    img.classList.remove('lazy-loading')
    img.classList.add('lazy-loaded')
    // 清理data-observed属性，释放内存
    delete img.dataset.observed
  })
}

// 图片加载失败处理
const handleImageError = (event) => {
  const img = event.target
  // 使用requestAnimationFrame优化DOM操作，减少重绘
  requestAnimationFrame(() => {
    // 移除loading样式
    img.classList.remove('lazy-loading')
    
    // 尝试加载默认图片
    if (img.src !== defaultCover) {
      img.src = defaultCover
    } else {
      // 如果默认图片也加载失败，显示错误状态
      img.classList.add('lazy-error')
    }
    
    // 防止无限错误循环
    img.onerror = null
    // 清理data-observed属性，释放内存
    delete img.dataset.observed
  })
}

// Intersection Observer 用于懒加载图片
let observer = null

// 初始化观察者
// 用于懒加载图片
// 优化配置
const initIntersectionObserver = () => {
  if (!('IntersectionObserver' in window)) {
    // 浏览器不支持 IntersectionObserver，回退到立即加载所有图片
    loadAllImages()
    return
  }

  // 优化Intersection Observer配置
  // 根据屏幕尺寸动态调整rootMargin
  const screenHeight = window.innerHeight
  const rootMarginValue = `${Math.min(screenHeight * 0.5, 300)}px 0px ${Math.min(screenHeight * 0.3, 200)}px 0px`

  observer = new IntersectionObserver((entries) => {
    // 批量处理观察到的图片
    const imagesToLoad = []
    
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        const dataSrc = img.dataset.src
        
        if (dataSrc) {
          imagesToLoad.push(img)
        }
      }
    })
    
    // 根据网络状况调整批量加载大小
    let batchSize = 3
    if (navigator.connection) {
      const effectiveType = navigator.connection.effectiveType
      if (effectiveType === '4g') {
        batchSize = 5
      } else if (effectiveType === '3g') {
        batchSize = 3
      } else {
        batchSize = 2
      }
    }
    
    // 限制同时加载的图片数量，避免网络拥塞
    for (let i = 0; i < Math.min(imagesToLoad.length, batchSize); i++) {
      const img = imagesToLoad[i]
      // 开始加载实际图片
      img.src = img.dataset.src
      img.classList.add('lazy-loading')
      observer.unobserve(img)
    }
    
    // 剩余图片延迟加载，根据网络状况调整延迟时间
    if (imagesToLoad.length > batchSize) {
      let delay = 200
      if (navigator.connection) {
        const effectiveType = navigator.connection.effectiveType
        if (effectiveType === '4g') {
          delay = 100
        } else if (effectiveType === '3g') {
          delay = 200
        } else {
          delay = 300
        }
      }
      
      setTimeout(() => {
        for (let i = batchSize; i < imagesToLoad.length; i++) {
          const img = imagesToLoad[i]
          img.src = img.dataset.src
          img.classList.add('lazy-loading')
          observer.unobserve(img)
        }
      }, delay)
    }
  }, {
    rootMargin: rootMarginValue, // 动态调整预加载区域
    threshold: 0.01, // 只要1%的区域可见就开始加载，提高响应速度
    root: null // 使用默认根元素（视口）
  })
}

// 预加载图片
const preloadImage = (src) => {
  if (!src) return
  
  // 检查缓存是否已加载
  if (imageCache.has(src)) {
    return Promise.resolve()
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      // 添加到缓存
      // 避免重复加载
      imageCache.add(src)
      resolve()
    }
    img.onerror = reject
  })
}

// 观察所有懒加载图片
const observeLazyImages = () => {
  nextTick(() => {
    const lazyImages = document.querySelectorAll('.lazy-img:not([data-observed])')
    if (lazyImages.length > 0) {
      // 优先观察可视区域内的图片
      const visibleImages = Array.from(lazyImages).filter(img => {
        const rect = img.getBoundingClientRect()
        return rect.top < window.innerHeight + 300 && rect.bottom > -100
      })
      
      // 先观察可视区域内的图片
      visibleImages.forEach(img => {
        if (observer) {
          observer.observe(img)
          img.dataset.observed = 'true'
        }
      })
      
      // 预加载下一批图片（预加载策略）
      if (visibleImages.length > 0) {
        const nextImages = Array.from(lazyImages)
          .filter(img => !img.dataset.observed)
          .slice(0, 3) // 预加载接下来3张图片
        
        nextImages.forEach(img => {
          const dataSrc = img.dataset.src
          if (dataSrc) {
            preloadImage(dataSrc).catch(() => {
              // 预加载失败不影响主线程执行
            })
          }
        })
      }
      
      // 延迟观察其他图片，减少初始加载压力
      setTimeout(() => {
        const remainingImages = Array.from(lazyImages).filter(img => !img.dataset.observed)
        remainingImages.forEach(img => {
          if (observer) {
            observer.observe(img)
            img.dataset.observed = 'true'
          }
        })
      }, 300) // 减少延迟时间，提高响应速度
    }
  })
}

// 加载所有图片（回退方案）
const loadAllImages = () => {
  const lazyImages = document.querySelectorAll('.lazy-img')
  lazyImages.forEach(img => {
    const dataSrc = img.dataset.src
    if (dataSrc) {
      img.src = dataSrc
    }
  })
}

const getArticleList = async (page = 1, isRefresh = true) => {
  // 缓存键（包含分页信息）
  const cacheKey = `index_articles_page_${page}_limit_${limit.value}`
  const cacheExpire = 10 // 缓存10分钟
  
  // 尝试从缓存获取数据
  const cachedData = cache.get(cacheKey)
  
  // 有缓存时：立即使用缓存显示，后台静默刷新（仅第一页且是刷新操作）
  if (cachedData) {
    articleList.value = cachedData.data || []
    total.value = cachedData.total || 0
    currentPage.value = page
    
    nextTick(() => {
      observeLazyImages()
    })
    
    // 后台静默刷新（仅针对第一页的刷新操作）
    if (isRefresh && page === 1) {
      fetchArticleListAPI(page, cacheKey, cacheExpire)
    }
    return
  }
  
  // 无缓存：显示骨架屏并请求API
  if (page === 1) {
    loading.value = true
    articleList.value = []
  }
  
  await fetchArticleListAPI(page, cacheKey, cacheExpire)
  
  if (page === 1) {
    loading.value = false
  }
}

const fetchArticleListAPI = async (page, cacheKey, cacheExpire) => {
  try {
    const params = { 
      page, 
      limit: limit.value, 
      order: order.value,
      where: { audit: 1 }
    }
    const res = await request.get('/api/article/all', params)
    
    if (res.code === 200) {
      const newData = res.data.data || []
      const totalCount = res.data.count || 0
      
      articleList.value = newData
      total.value = totalCount
      currentPage.value = page
      
      cache.set(cacheKey, { data: newData, total: totalCount }, cacheExpire)
      
      nextTick(() => {
        observeLazyImages()
      })
    } else {
      if (page === 1) articleList.value = []
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    if (page === 1) articleList.value = []
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}

// 下拉刷新
const handleRefresh = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  showRefreshHint.value = true
  
  // 清除首页缓存
  for (let i = 1; i <= 5; i++) {
    cache.del(`index_articles_page_${i}_limit_${limit.value}`)
  }
  
  await getArticleList(1, true)
  
  setTimeout(() => {
    showRefreshHint.value = false
  }, 1500)
}

const toArticleDetail = (id) => {
  router.push(`/archives/${id}`) 
}

const toggleQuickEditor = () => {
  showQuickEditor.value = !showQuickEditor.value
  if (!showQuickEditor.value) {
    formData.title = ''
    formData.content = ''
    formData.group = ''
    formData.tags = []
    formData.publish_time = ''
    quickArticlePublishTime.value = ''
  } else {
    loadArticleGroups()
    loadTags()
  }
}

const handleEditorInput = (value) => {
  formData.content = value
}

const addTag = async () => {
  const name = newTag.value.trim()
  if (!name) return

  if (formData.tags.length >= 5) {
    toast.warning('最多添加 5 个标签')
    return
  }

  // 检查是否已存在同名标签
  if (formData.tags.find(t => t.name.toLowerCase() === name.toLowerCase())) {
    newTag.value = ''
    return
  }

  // 先查已有标签
  const existing = allTags.value.find(t => t.name.toLowerCase() === name.toLowerCase())
  if (existing) {
    formData.tags.push({ id: existing.id, name: existing.name })
    newTag.value = ''
    showTagDropdown.value = false
    return
  }

  // 创建新标签
  try {
    const res = await request.post('/api/tags/create', { name })
    if (res.code === 200 || res.code === 201) {
      const newId = res.data?.id || res.data
      const tagObj = { id: newId, name }
      allTags.value.push(tagObj)
      formData.tags.push(tagObj)
      newTag.value = ''
      showTagDropdown.value = false
    } else {
      toast.warning('标签创建失败')
    }
  } catch (e) {
    console.error('创建标签失败:', e)
    toast.warning('标签创建失败')
  }
}

const selectExistingTag = (tag) => {
  if (formData.tags.length >= 5) {
    toast.warning('最多添加 5 个标签')
    return
  }
  if (!formData.tags.find(t => t.id === tag.id)) {
    formData.tags.push({ id: tag.id, name: tag.name })
  }
  newTag.value = ''
  showTagDropdown.value = false
}

const hideTagDropdown = () => {
  // 延迟关闭，让 mousedown 事件先触发
  setTimeout(() => { showTagDropdown.value = false }, 150)
}

const removeTag = (index) => {
  formData.tags.splice(index, 1)
}

const loadArticleGroups = async () => {
  if (articleGroups.value.length > 0) return
  try {
    const res = await request.get('/api/article-group/all', { page: 1, limit: 50 })
    if (res.code === 200) {
      articleGroups.value = res.data.data || []
    }
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

const loadTags = async () => {
  if (allTags.value.length > 0) return
  try {
    const res = await request.get('/api/tags/all', { limit: 200 })
    if (res.code === 200 && res.data?.data) {
      allTags.value = res.data.data.map(t => ({ id: t.id, name: t.name }))
    }
  } catch (e) {
    console.error('加载标签失败:', e)
  }
}

const publishQuickArticle = async () => {
  if (!isLogin.value) {
    toast.warning('请先登录')
    commStore.switchAuth('login', true)
    return
  }
  
  const title = formData.title.trim()
  const content = formData.content.trim()
  
  if (!title) {
    toast.warning('请输入文章标题')
    return
  }
  
  if (!content) {
    toast.warning('请输入文章内容')
    return
  }

  if (!formData.group) {
    toast.warning('请选择分类')
    return
  }
  
  isPublishing.value = true
  
  try {
    const payload = {
      title,
      content,
      abstract: content.substring(0, 200),
      group: parseInt(formData.group),
      tags: formData.tags.length > 0 ? '|' + formData.tags.map(t => t.id).join('|') + '|' : '',
      status: 1
    }

    // 发布时间
    if (quickArticlePublishTime.value) {
      payload.publish_time = Math.floor(new Date(quickArticlePublishTime.value).getTime() / 1000)
    }
    
    const res = await request.post('/api/article/create', payload)
    
    if (res.code === 200) {
      toast.success('发布成功')
      toggleQuickEditor()
      handleRefresh()
    } else {
      toast.error(res.msg || '发布失败')
    }
  } catch (error) {
    toast.error('发布失败，请稍后重试')
    console.error('发布文章失败:', error)
  } finally {
    isPublishing.value = false
  }
}

const saveDraft = async () => {
  if (!formData.title.trim() && !formData.content.trim()) {
    toast.warning('请至少输入标题或内容')
    return
  }

  isPublishing.value = true

  try {
    const payload = {
      title: formData.title.trim() || '未命名草稿',
      content: formData.content.trim(),
      abstract: formData.content.trim().substring(0, 200),
      group: formData.group ? parseInt(formData.group) : null,
      tags: formData.tags.length > 0 ? '|' + formData.tags.map(t => t.id).join('|') + '|' : '',
      status: 0
    }

    if (quickArticlePublishTime.value) {
      payload.publish_time = Math.floor(new Date(quickArticlePublishTime.value).getTime() / 1000)
    }

    const res = await request.post('/api/article/create', payload)

    if (res.code === 200) {
      toast.success('草稿保存成功！')
      toggleQuickEditor()
    } else {
      toast.error(res.msg || '保存失败')
    }
  } catch (error) {
    console.error('保存草稿失败:', error)
    toast.error('网络异常，保存失败')
  } finally {
    isPublishing.value = false
  }
}

// 获取轮播图数据（带缓存）
const getBanners = async () => {
  bannersLoading.value = true
  
  try {
    const { code, data } = await bannerStore.setCurrent()
    
    if (code === 200) {
      banners.value = data || []
    } else {
      banners.value = []
    }
  } catch (error) {
    console.error('获取轮播图数据失败', error)
    banners.value = []
  } finally {
    bannersLoading.value = false
  }
}

// 下拉刷新相关变量
let touchStartY = 0
let touchCurrentY = 0
const maxPullDistance = 100

// 触摸开始事件
const handleTouchStart = (e) => {
  if (window.scrollY === 0) {
    touchStartY = e.touches[0].clientY
  }
}

// 触摸移动事件
const handleTouchMove = (e) => {
  if (touchStartY === 0 || isRefreshing.value) return
  
  touchCurrentY = e.touches[0].clientY
  const distance = touchCurrentY - touchStartY
  
  if (distance > 0 && window.scrollY === 0) {
    const pullDistance = Math.min(distance, maxPullDistance)
    showRefreshHint.value = pullDistance > 30
  }
}

// 触摸结束事件
const handleTouchEnd = () => {
  if (touchStartY === 0 || isRefreshing.value) return
  
  const distance = touchCurrentY - touchStartY
  
  if (distance > 50 && window.scrollY === 0) {
    handleRefresh()
  }
  
  touchStartY = 0
  touchCurrentY = 0
}

onMounted(async () => {
  // 立即显示骨架屏
  loading.value = true
  
  // 并行加载所有数据，提高首屏速度
  try {
    // 同时加载轮播图和文章列表
    await Promise.all([
      loadDisplayMode(),
      getBanners(),
      getArticleList(1)
    ])
  } catch (error) {
    console.error('初始化加载失败', error)
  } finally {
    // 初始化Intersection Observer
    initIntersectionObserver()
  }
  
  // 添加触摸事件监听（下拉刷新）
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchmove', handleTouchMove, { passive: true })
  document.addEventListener('touchend', handleTouchEnd, { passive: true })
})

onUnmounted(() => {
  // 清理观察者
  if (observer) {
    observer.disconnect()
    observer = null
  }
  
  // 移除触摸事件监听
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style scoped>
/* 文章列表Grid布局 - 有图模式 */
.grid-article-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 0 auto;
}

/* 文章卡片基础样式 */
.article-item-card,
.article-item-list {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
}

/* 文章卡片悬停效果 */
.article-item-card:hover,
.article-item-list:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 置顶徽章 */
.sticky-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, var(--bs-secondary), var(--bs-dark));
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 16px;
  z-index: 10;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 3px;
  animation: pulse 2s infinite;
}

.sticky-badge .bi {
  font-size: 0.8rem;
}

/* 标题内的置顶图标 */
.sticky-icon-inline {
  display: inline-flex;
  align-items: center;
  animation: bounce 1s infinite;
}

/* 封面容器 */
.article-cover {
  width: 100%;
  padding-top: 66.67%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--bs-light), var(--bs-secondary-bg)); /* 加载时的背景 */
  border-radius: 0.75rem 0.75rem 0 0;
}

/* 懒加载图片样式 */
.article-cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.5s ease;
  border-radius: 0.75rem 0.75rem 0 0;
}

/* 加载中的图片样式 */
.article-cover-img.lazy-loading {
  filter: blur(8px);
  opacity: 0.6;
  transform: scale(1.05);
}

/* 加载完成的图片样式 */
.article-cover-img.lazy-loaded {
  filter: blur(0);
  opacity: 1;
  animation: fadeIn 0.6s ease-out;
}

/* 加载失败的图片样式 */
.article-cover-img.lazy-error {
  background: linear-gradient(135deg, #e9ecef, #dee2e6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #868e96;
  font-size: 1.5rem;
}

.article-cover-img.lazy-error::after {
  content: '📷';
  font-size: 2rem;
}

/* 内容 */
.article-content {
  height: 100%;
  padding: 1.25rem !important;
}

/* 图片样式 */
img {
  transition: all 0.3s ease;
  max-width: 100%;
  height: auto;
}

.article-cover:hover .article-cover-img {
  transform: scale(1.08);
  filter: brightness(1.05);
}

/* 标题 */
.article-title {
  font-size: clamp(1.05rem, 1.5vw, 1.25rem);
  line-height: 1.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 700;
  color: var(--bs-body-color);
  transition: color 0.3s ease;
  margin-bottom: 0.75rem !important;
}

.article-item-card:hover .article-title {
  color: var(--bs-secondary);
}

/* 摘要 */
.article-desc {
  font-size: 0.8rem;
  color: var(--bs-secondary-color);
  line-height: 1.4;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 列表模式标题 */
.article-title-list {
  font-size: clamp(1.15rem, 2vw, 1.4rem);
  line-height: 1.5;
  font-weight: 700;
  color: var(--bs-body-color);
  transition: color 0.3s ease;
  margin-bottom: 0.5rem !important;
}

.article-item-list:hover .article-title-list {
  color: var(--bs-secondary);
}

/* 列表模式摘要 */
.article-desc-list {
  font-size: 0.9rem;
  color: var(--bs-secondary-color);
  line-height: 1.6;
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-truncate-1 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 元信 */
.article-meta {
  font-size: 0.75rem;
  color: var(--bs-tertiary-color);
  line-height: 1.3;
  margin-top: auto;
}

.meta-left, .meta-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.meta-item {
  position: relative;
  display: flex;
  align-items: center;
  white-space: nowrap;
  padding-left: 0 !important;
  transition: color 0.3s ease;
}

.meta-item:hover {
  color: var(--bs-secondary);
}

.meta-item .bi {
  font-size: 0.9em;
  margin-right: 0.3rem;
  line-height: 1;
  vertical-align: middle;
  color: var(--bs-tertiary-color);
  transition: color 0.3s ease;
}

.meta-item:hover .bi {
  color: var(--bs-secondary);
}

/* 列表模式元信息 */
.article-meta-info {
  font-size: 0.85rem;
  color: var(--bs-tertiary-color);
  transition: color 0.3s ease;
}

.article-meta-info .bi {
  font-size: 0.9em;
  color: var(--bs-tertiary-color);
  transition: color 0.3s ease;
}

.article-item-list:hover .article-meta-info {
  color: var(--bs-secondary);
}

.article-item-list:hover .article-meta-info .bi {
  color: var(--bs-secondary);
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-2px);
  }
  60% {
    transform: translateY(-1px);
  }
}

/* 响应式网格布局 */
@media (max-width: 992px) {
  .grid-article-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

@media (max-width: 768px) {
  .grid-article-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .article-item-card {
    min-width: 160px;
  }
  
  .article-content {
    padding: 1rem !important;
  }
  
  .sticky-badge {
    font-size: 0.7rem;
    padding: 3px 8px;
    top: 8px;
    right: 8px;
  }
  
  .article-title {
    font-size: 1rem;
    margin-bottom: 0.5rem !important;
  }
  
  .article-desc {
    font-size: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .article-meta {
    font-size: 0.7rem;
  }
}

@media (max-width: 576px) {
  .grid-article-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .article-item-card:hover {
    transform: translateY(-3px);
  }
  
  .article-title {
    font-size: 0.95rem;
    line-height: 1.4;
    margin-bottom: 0.5rem !important;
  }
  
  .article-desc {
    font-size: 0.75rem;
    line-height: 1.3;
    margin-bottom: 0.5rem;
  }
  
  .article-meta {
    font-size: 0.65rem;
    line-height: 1.2;
  }
  
  .article-content {
    padding: 1rem !important;
  }
  
  .sticky-badge {
    font-size: 0.65rem;
    padding: 3px 8px;
    top: 6px;
    right: 6px;
  }
  
  .meta-item {
    font-size: 0.65rem;
  }
  
  .meta-item .bi {
    font-size: 0.8em;
  }
}

/* 轮播图样式 */
.carousel-img {
  height: 300px;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  width: 100%;
}

/* 响应式轮播图高度 */
@media (max-width: 992px) {
  .carousel-img {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .carousel-img {
    height: 250px;
  }
}

@media (max-width: 576px) {
  .carousel-img {
    height: 200px;
  }
}

@media (max-width: 400px) {
  .carousel-img {
    height: 180px;
  }
}

.carousel-item {
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-radius: 0.25rem;
  overflow: hidden;
}

.carousel-item:hover .carousel-img {
  transform: scale(1.03);
}

.carousel-caption {
  position: absolute;
  bottom: 1.5rem;
  left: 10%;
  right: 10%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.3));
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  transition: all 0.4s ease;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 5;
  display: block !important;
  visibility: visible !important;
  max-width: 80%;
  margin: 0 auto;
}

.carousel-item:hover .carousel-caption {
  transform: translateY(-3px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
}

.carousel-caption h5 {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.3px;
  color: white;
  z-index: 6;
  position: relative;
  line-height: 1.4;
}

/* 轮播图控制按钮 */
#carouselExampleControls .carousel-control-prev,
#carouselExampleControls .carousel-control-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  opacity: 0.8 !important;
  transition: all 0.3s ease;
  display: flex !important;
  align-items: center;
  justify-content: center;
  visibility: visible !important;
  z-index: 10;
  border-radius: 50%;
}

#carouselExampleControls .carousel-control-prev {
  left: 10px;
}

#carouselExampleControls .carousel-control-next {
  right: 10px;
}

#carouselExampleControls .carousel-control-prev:hover,
#carouselExampleControls .carousel-control-next:hover {
  opacity: 1 !important;
  transform: translateY(-50%) scale(1.1);
}

/* 轮播图控制按钮图标 */
#carouselExampleControls .carousel-control-prev-icon,
#carouselExampleControls .carousel-control-next-icon {
  width: 1.5rem;
  height: 1.5rem;
  background-size: 100% 100%;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 1.25rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: block !important;
  visibility: visible !important;
  border-radius: 0.25rem;
}

#carouselExampleControls .carousel-control-prev:hover .carousel-control-prev-icon,
#carouselExampleControls .carousel-control-next:hover .carousel-control-next-icon {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 轮播图指示器样式 */
.carousel-indicators {
  bottom: 2rem;
  gap: 0.75rem;
}

.carousel-indicators button {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin: 0;
  background-color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.carousel-indicators button:hover {
  background-color: rgba(255, 255, 255, 0.9);
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.carousel-indicators button.active {
  background-color: white;
  width: 28px;
  border-radius: 7px;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.8);
}

/* 轮播图加载动画 */
.carousel-item {
  position: relative;
}

.carousel-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.carousel-item.loading::before {
  opacity: 1;
  animation: pulse 1.5s infinite;
}

.carousel-item img {
  position: relative;
  z-index: 2;
}

/* 分页样式 */
.pagination-container {
  margin-top: 3rem;
  margin-bottom: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pagination {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.page-item {
  margin: 0;
}

.page-link {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 0.75rem;
  background: transparent;
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 2.5rem;
  text-align: center;
}

.page-link:hover:not(.disabled) {
  background: rgba(108, 117, 125, 0.1);
  color: var(--bs-secondary);
  transform: translateY(-1px);
}

.page-item.active .page-link {
  background: linear-gradient(135deg, var(--bs-secondary), var(--bs-dark));
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.4);
}

.page-item.disabled .page-link {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 分页响应式设置 */
@media (max-width: 992px) {
  /* 轮播图响应式 */
  .carousel-caption {
    padding: 1.5rem;
    bottom: 2rem;
  }
  
  .carousel-caption h5 {
    font-size: clamp(1.1rem, 3vw, 1.6rem);
  }
  
  .carousel-control-prev-icon,
  .carousel-control-next-icon {
    width: 3rem;
    height: 3rem;
    padding: 1rem;
  }
  
  .carousel-indicators {
    bottom: 1.5rem;
  }
}

@media (max-width: 768px) {
  .pagination-container {
    margin-top: 2rem;
    margin-bottom: 2rem;
  }
  
  .pagination {
    padding: 0.25rem;
  }
  
  .page-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    min-width: 2rem;
  }
  
  /* 轮播图响应式 */
  .carousel-caption {
    padding: 1.25rem;
    bottom: 1.5rem;
  }
  
  .carousel-caption h5 {
    font-size: clamp(1rem, 2.5vw, 1.4rem);
  }
  
  .carousel-control-prev-icon,
  .carousel-control-next-icon {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0.75rem;
  }
  
  .carousel-indicators {
    bottom: 1.5rem;
  }
  
  .carousel-indicators button {
    width: 12px;
    height: 12px;
  }
  
  .carousel-indicators button.active {
    width: 24px;
  }
}

@media (max-width: 576px) {
  /* 轮播图响应式 */
  .carousel-caption {
    padding: 1rem;
    bottom: 1rem;
  }
  
  .carousel-caption h5 {
    font-size: clamp(0.9rem, 2vw, 1.2rem);
    margin-bottom: 0.5rem;
  }
  
  .carousel-control-prev-icon,
  .carousel-control-next-icon {
    width: 2rem;
    height: 2rem;
    padding: 0.5rem;
  }
  
  .carousel-indicators {
    bottom: 1rem;
    gap: 0.5rem;
  }
  
  .carousel-indicators button {
    width: 10px;
    height: 10px;
  }
  
  .carousel-indicators button.active {
    width: 20px;
  }
  
  /* 排序Tab响应式 */
  .sort-tab-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }
  
  @media (max-width: 360px) {
    .sort-tab-btn {
      padding: 0.3rem 0.5rem;
      font-size: 0.7rem;
    }
  }
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0.7;
    filter: blur(5px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 如果gif路径不对，可以使用纯CSS加载动画 */
.article-cover-img:not([src]) {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

/* 骨架加载器样式 */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

/* 骨架加载器各部分尺寸 */
.skeleton-cover {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 0;
}

.skeleton-title {
  height: 1.2rem;
  width: 80%;
}

.skeleton-desc {
  height: 0.6rem;
  width: 100%;
}

.skeleton-meta-left {
  height: 0.7rem;
  width: 40%;
}

.skeleton-meta-right {
  height: 0.7rem;
  width: 30%;
}

.skeleton-title-list {
  height: 1.5rem;
  width: 90%;
}

.skeleton-desc-list {
  height: 0.9rem;
  width: 100%;
  margin-bottom: 0.5rem;
}

/* 轮播图骨架屏 */
.carousel-loading {
  width: 100%;
  padding-top: 40%;
  position: relative;
  overflow: hidden;
}

.skeleton-carousel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
}

/* 暗黑模式适配 */
[data-bs-theme=dark] {
  /* 文章卡片 */
  .article-item-card,
  .article-item-list {
    background-color: var(--bs-body-bg);
    border-color: var(--bs-border-color);
  }
  
  /* 标题 */
  .article-title {
    color: var(--bs-heading-color);
  }
  
  .article-item-card:hover .article-title {
    color: var(--bs-secondary);
  }
  
  /* 摘要 */
  .article-desc {
    color: var(--bs-secondary-color);
  }
  
  /* 列表模式标题 */
  .article-title-list {
    color: var(--bs-heading-color);
  }
  
  .article-item-list:hover .article-title-list {
    color: var(--bs-secondary);
  }
  
  /* 列表模式摘要 */
  .article-desc-list {
    color: var(--bs-secondary-color);
  }
  
  /* 元信息 */
  .article-meta {
    color: var(--bs-tertiary-color);
  }
  
  .meta-item:hover {
    color: var(--bs-secondary);
  }
  
  .meta-item .bi {
    color: var(--bs-tertiary-color);
  }
  
  .meta-item:hover .bi {
    color: var(--bs-secondary);
  }
  
  /* 列表模式元信息 */
  .article-item-list:hover .text-xs.text-muted {
    color: var(--bs-secondary);
  }
  
  .article-item-list:hover .text-xs.text-muted .bi {
    color: var(--bs-secondary);
  }
  
  /* 加载动画 */
  .article-cover-img:not([src]) {
    background: linear-gradient(90deg, var(--bs-body-bg) 25%, var(--bs-secondary-bg) 50%, var(--bs-body-bg) 75%);
  }
  
  /* 骨架加载器暗黑模式 */
  .skeleton {
    background: linear-gradient(90deg, var(--bs-body-bg) 25%, var(--bs-secondary-bg) 50%, var(--bs-body-bg) 75%);
    background-size: 200% 100%;
  }
  
  /* 排序Tab暗黑模式 */
  .sort-tabs {
    border-color: var(--bs-border-color);
    background-color: var(--bs-body-bg);
  }
  
  .sort-tab-btn {
    color: var(--bs-secondary-color);
  }
  
  .sort-tab-btn:hover {
    background-color: rgba(108, 117, 125, 0.2);
    color: var(--bs-secondary);
  }
  
  .sort-tab-btn.active {
    background: linear-gradient(135deg, var(--bs-secondary), var(--bs-dark));
    color: white;
  }
  
  /* 轮播图暗黑模式 */
  .carousel-caption {
    background: linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.7));
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  }
  
  .carousel-item:hover .carousel-caption {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8);
  }
  
  .carousel-control-prev-icon,
  .carousel-control-next-icon {
    background-color: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .carousel-control-prev:hover .carousel-control-prev-icon,
  .carousel-control-next:hover .carousel-control-next-icon {
    background-color: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  .carousel-indicators button {
    background-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }
  
  .carousel-indicators button:hover {
    background-color: rgba(255, 255, 255, 0.7);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  }
  
  .carousel-indicators button.active {
    background-color: white;
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.7);
  }
  
  /* 轮播图加载动画暗黑模式 */
  .carousel-item::before {
    background: linear-gradient(135deg, var(--bs-body-bg) 0%, var(--bs-secondary-bg) 100%);
  }
  
  /* 分页暗黑模式 */
  .pagination {
    background: var(--bs-body-bg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .page-link {
    color: var(--bs-secondary-color);
  }
  
  .page-link:hover:not(.disabled) {
    background: rgba(108, 117, 125, 0.2);
    color: var(--bs-secondary);
  }
  
  .page-item.active .page-link {
    background: linear-gradient(135deg, var(--bs-secondary), var(--bs-dark));
    color: white;
  }
  
  /* 悬停效果 */
  .article-item-card:hover,
  .article-item-list:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  /* 置顶徽章 */
  .sticky-badge {
    background: linear-gradient(135deg, var(--bs-secondary), var(--bs-dark));
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  }
  
  /* 封面容器 */
  .article-cover {
    background: linear-gradient(135deg, var(--bs-body-bg), var(--bs-secondary-bg));
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 标签建议下拉 */
.tag-suggest-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1050;
  margin-top: 4px;
  max-height: 180px;
  overflow-y: auto;
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.tag-suggest-item {
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--bs-body-color);
  transition: background 0.15s;
}

.tag-suggest-item:hover {
  background: var(--bs-primary-bg-subtle);
  color: var(--bs-primary);
}
</style>