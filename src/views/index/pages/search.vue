<!-- 搜索页面 -->
<template>
  <div class="card mt-2">
    <div class="card-header">
      <div class="search-header">
        <div class="search-header-content">
          <!-- 搜索范围选择 -->
          <div class="mt-2">
            <div class="btn-group w-100" role="group" aria-label="搜索范围">
              <button
                type="button"
                class="btn" 
                :class="searchScope === 'all' ? 'btn-primary' : 'btn-outline-primary'"
                @click="changeSearchScope('all')"
              >
                <i class="bi bi-search"></i> 全部
              </button>
              <button
                type="button"
                class="btn" 
                :class="searchScope === 'article' ? 'btn-primary' : 'btn-outline-primary'"
                @click="changeSearchScope('article')"
              >
                <i class="bi bi-file-earmark-text"></i> 文章
              </button>
              <button
                type="button"
                class="btn" 
                :class="searchScope === 'page' ? 'btn-primary' : 'btn-outline-primary'"
                @click="changeSearchScope('page')"
              >
                <i class="bi bi-file-earmark"></i> 页面
              </button>
              <button
                type="button"
                class="btn" 
                :class="searchScope === 'tag' ? 'btn-primary' : 'btn-outline-primary'"
                @click="changeSearchScope('tag')"
              >
                <i class="bi bi-tag"></i> 标签
              </button>
              <button
                type="button"
                class="btn" 
                :class="searchScope === 'links' ? 'btn-primary' : 'btn-outline-primary'"
                @click="changeSearchScope('links')"
              >
                <i class="bi bi-link"></i> 友链
              </button>
              <button
                type="button"
                class="btn" 
                :class="searchScope === 'users' ? 'btn-primary' : 'btn-outline-primary'"
                @click="changeSearchScope('users')"
              >
                <i class="bi bi-person"></i> 用户
              </button>
            </div>
          </div>
          <!-- 搜索输入框 -->
          <div class="input-group mt-2">
            <input
              ref="searchInput"
              type="text"
              v-model="searchQuery"
              class="form-control form-control-lg"
              :placeholder="getSearchPlaceholder()"
              @input="handleInput"
              @keyup.enter="performSearch"
              @keydown.up.prevent="handleKeyUp"
              @keydown.down.prevent="handleKeyDown"
              @keydown.enter.prevent="handleEnterKey"
            >
            <button
              class="btn btn-primary"
              type="button"
              @click="performSearch"
              :disabled="loading"
            >
              <i class="bi" :class="loading ? 'bi-arrow-clockwise spin' : 'bi-search'"></i>
              <span class="ms-2">搜索</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="card-body">
      <!-- 搜索内容区域 -->
      <div class="mt-2">
        <!-- 热门搜索 -->
        <div v-if="!loading && searchQuery === '' && searchHistory.length === 0">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="text-muted">
              <i class="bi bi-trending-up me-1"></i>热门搜索
            </h6>
          </div>
          <div class="search-history-tags d-flex flex-wrap gap-2">
            <div
              v-for="(item, index) in hotSearches"
              :key="index"
              class="search-history-tag position-relative d-inline-block"
              @click="useSearchHistory(item)"
              style="cursor: pointer;"
            >
              <span class="badge text-bg-light text-dark">{{ item }}</span>
            </div>
          </div>
        </div>

        <!-- 搜索历史 -->
        <div v-if="!loading && searchQuery === '' && searchHistory.length > 0">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="text-muted">
              <i class="bi bi-clock-history me-1"></i>搜索历史
            </h6>
            <button @click="clearSearchHistory" class="btn btn-sm btn-outline-secondary">
              清除历史
            </button>
          </div>
          <div class="search-history-tags d-flex flex-wrap gap-2">
            <div
              v-for="(item, index) in searchHistory"
              :key="index"
              class="search-history-tag position-relative d-inline-block"
              @click="useSearchHistory(item)"
              style="cursor: pointer;"
            >
              <span class="badge text-bg-light text-dark pe-6">{{ item }}</span>
              <button @click.stop="removeSearchHistory(index)" class="close-badge-btn">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-else-if="!loading && searchResults.length > 0">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="text-muted">
              <i class="bi bi-search me-1"></i>搜索结果 ({{ searchResults.length }})
            </h6>
          </div>
          <div class="result-list">
            <div
              v-for="(result, index) in searchResults"
              :key="result.id || result.key"
              @click="navigateToResult(result)"
              class="result-item mb-3"
              :class="`result-${result.type} ${selectedIndex === index ? 'result-selected' : ''}`"
            >
              <div class="card h-100 transition-all duration-300 hover:shadow-sm">
                <div class="card-body">
                  <div class="d-flex align-items-start">
                    <div class="result-icon-container me-3">
                      <i :class="[getResultIcon(result.type), 'result-icon']"></i>
                    </div>
                    <div class="flex-grow-1">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0 font-medium" v-html="highlightKeyword(getResultTitle(result))"></h5>
                        <span class="result-type-badge" :class="`badge-${result.type}`">
                          {{ getResultTypeName(result.type) }}
                        </span>
                      </div>
                      <!-- 用户类型显示 nickname 和 description -->
                      <template v-if="result.type === 'users'">
                        <p v-if="result.description" class="card-text text-muted text-sm">
                          {{ result.description }}
                        </p>
                      </template>
                      <!-- 友链类型显示 nickname、description、url -->
                      <template v-else-if="result.type === 'links'">
                        <p v-if="result.description" class="card-text text-muted text-sm mb-1">
                          {{ result.description }}
                        </p>
                        <div v-if="result.url" class="text-xs text-primary">
                          <i class="bi bi-link-45deg"></i> {{ result.url }}
                        </div>
                      </template>
                      <!-- 其他类型显示 abstract -->
                      <p v-else-if="result.abstract" class="card-text text-muted line-clamp-2 mb-2" v-html="highlightKeyword(result.abstract)"></p>
                      <div v-if="result.create_time && result.type !== 'users'" class="text-xs text-gray-400">
                        {{ formatDate(result.create_time) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无结果 -->
        <div v-else-if="!loading && searchQuery !== '' && searchResults.length === 0" class="text-center py-12">
          <div class="mb-4">
            <i class="bi bi-search text-5xl text-muted"></i>
          </div>
          <p class="text-muted">没有找到与 "{{ searchQuery }}" 相关的结果</p>
          <p class="text-muted text-sm mt-2">试试这些热门搜索：</p>
          <div class="d-flex flex-wrap justify-content-center gap-2 mt-3">
            <button
              v-for="(item, index) in hotSearches.slice(0, 3)"
              :key="index"
              class="btn btn-sm btn-outline-secondary"
              @click="useSearchHistory(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <!-- 加载中 -->
        <div v-else-if="loading" class="text-center py-12">
          <div class="spinner-border text-primary mb-4" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted">搜索中...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { request as axios } from '@/utils/network'
import { toast } from '@/utils/app'
import { cache } from '@/utils/network'
import { usePageTitle } from '@/utils/app'
import { STORAGE_KEYS } from '@/constants'

// Router
const router = useRouter()
const route = useRoute()

// 使用页面标题管理
const { setDynamicTitle } = usePageTitle();
setDynamicTitle('搜索');

// 响应式数据
const searchQuery = ref('')
const loading = ref(false)
const searchResults = ref([])
const searchHistory = ref([])
const debounceTimer = ref(null)
const searchInput = ref(null)
const searchScope = ref('all') // 搜索范围：all, article, page, tag
const selectedIndex = ref(-1) // 当前选中的搜索结果索引

// 热门搜索关键词
const hotSearches = [
  '随记',
  '旅行',
  'JavaScript',
  'TypeScript',
  'Node.js',
  '前端开发',
  '后端开发',
  '算法',
  '数据库',
  '架构'
]

// 初始化
onMounted(() => {
  loadSearchHistory()
  // 从路由参数中获取搜索关键词和范围
  if (route.query.q) {
    searchQuery.value = route.query.q
  }
  if (route.query.scope && ['all', 'article', 'page', 'tag', 'links', 'users'].includes(route.query.scope)) {
    searchScope.value = route.query.scope
  }
  // 如果有搜索关键词，执行搜索
  if (searchQuery.value) {
    performSearch()
  }
  // 聚焦输入框
  setTimeout(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  }, 100)
})

// 监听搜索范围变化
watch(searchScope, (newScope) => {
  if (searchQuery.value.trim()) {
    performSearch()
  }
})

// 加载搜索历史
const loadSearchHistory = () => {
  const history = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY)
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
}

const saveSearchHistory = (query) => {
  if (!query) return
  
  searchHistory.value = searchHistory.value.filter(item => item !== query)
  searchHistory.value.unshift(query)
  
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }
  
  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(searchHistory.value))
}

const clearSearchHistory = () => {
  searchHistory.value = []
  localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY)
}

const removeSearchHistory = (index) => {
  searchHistory.value.splice(index, 1)
  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(searchHistory.value))
}

// 使用搜索历史
const useSearchHistory = (query) => {
  searchQuery.value = query
  selectedIndex.value = -1
  performSearch()
}

// 改变搜索范围
const changeSearchScope = (scope) => {
  searchScope.value = scope
  selectedIndex.value = -1
  // 更新路由参数
  if (searchQuery.value) {
    router.push({
      query: {
        q: searchQuery.value,
        scope: scope
      }
    })
  }
}

// 关键词高亮
const highlightKeyword = (text) => {
  if (!text || !searchQuery.value) return text
  const keyword = searchQuery.value.trim()
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKeyword})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-0.5 rounded">$1</mark>')
}

// 上键选择
const handleKeyUp = () => {
  if (searchResults.value.length > 0) {
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    } else if (selectedIndex.value === -1) {
      selectedIndex.value = searchResults.value.length - 1
    }
    scrollToSelected()
  }
}

// 下键选择
const handleKeyDown = () => {
  if (searchResults.value.length > 0) {
    if (selectedIndex.value < searchResults.value.length - 1) {
      selectedIndex.value++
    } else {
      selectedIndex.value = -1
    }
    scrollToSelected()
  }
}

// 回车键确认选择
const handleEnterKey = () => {
  if (selectedIndex.value >= 0 && selectedIndex.value < searchResults.value.length) {
    navigateToResult(searchResults.value[selectedIndex.value])
  }
}

// 滚动到选中项
const scrollToSelected = () => {
  if (selectedIndex.value >= 0) {
    const element = document.querySelector(`.result-item:nth-child(${selectedIndex.value + 1})`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
}

// 输入处理（防抖）
const handleInput = () => {
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    if (searchQuery.value.trim()) {
      performSearch()
    } else {
      searchResults.value = []
    }
  }, 300)
}

// 执行搜索
const performSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query) return

  loading.value = true
  searchResults.value = []

  try {
    // 缓存键包含搜索关键词和搜索范围
    const cacheKey = `search_results_${searchScope.value}_${query}`
    const cacheExpire = 5 // 缓存5分钟

    // 尝试从缓存获取搜索结果
    const cachedResults = cache.get(cacheKey)
    if (cachedResults) {
      searchResults.value = cachedResults
      saveSearchHistory(query)
      loading.value = false
      return
    }

    let results = []

    // 根据搜索范围执行不同的搜索
    switch (searchScope.value) {
      case 'article':
        // 只搜索文章
        results = await searchArticles(query)
        break
      case 'page':
        // 只搜索页面
        results = await searchPages(query)
        break
      case 'tag':
        // 只搜索标签
        results = await searchTags(query)
        break
      case 'links':
        // 只搜索友链
        results = await searchLinks(query)
        break
      case 'users':
        // 只搜索用户
        results = await searchUsers(query)
        break
      default:
        // 全局搜索：搜索文章、页面、标签、友链和用户
        const [articleResults, pageResults, tagResults, linksResults, usersResults] = await Promise.all([
          searchArticles(query),
          searchPages(query),
          searchTags(query),
          searchLinks(query),
          searchUsers(query)
        ])

        // 合并并优化搜索结果
        const optimizedResults = []
        const seenIds = new Set() // 用于去重

        // 1. 首先添加文章结果，按相关性排序
        if (articleResults.length > 0) {
          const sortedArticles = articleResults.sort((a, b) => {
            return new Date(b.create_time || 0) - new Date(a.create_time || 0)
          })
          sortedArticles.forEach(article => {
            if (!seenIds.has(article.id)) {
              seenIds.add(article.id)
              optimizedResults.push(article)
            }
          })
        }

        // 2. 然后添加页面结果
        if (pageResults.length > 0) {
          const sortedPages = pageResults.sort((a, b) => {
            return new Date(b.create_time || 0) - new Date(a.create_time || 0)
          })
          sortedPages.forEach(page => {
            if (!seenIds.has(page.id)) {
              seenIds.add(page.id)
              optimizedResults.push(page)
            }
          })
        }

        // 3. 添加用户结果
        if (usersResults.length > 0) {
          usersResults.forEach(user => {
            if (!seenIds.has(user.id)) {
              seenIds.add(user.id)
              optimizedResults.push(user)
            }
          })
        }

        // 4. 添加友链结果
        if (linksResults.length > 0) {
          linksResults.forEach(link => {
            if (!seenIds.has(link.id)) {
              seenIds.add(link.id)
              optimizedResults.push(link)
            }
          })
        }

        // 5. 最后添加标签结果，限制数量
        if (tagResults.length > 0) {
          const relevantTags = tagResults.slice(0, 3)
          relevantTags.forEach(tag => {
            if (!seenIds.has(tag.id)) {
              seenIds.add(tag.id)
              optimizedResults.push(tag)
            }
          })
        }

        results = optimizedResults
        break
    }

    // 设置搜索结果
    searchResults.value = results

    // 缓存搜索结果
    cache.set(cacheKey, results, cacheExpire)

    // 保存搜索历史
    saveSearchHistory(query)
  } catch (error) {
    console.error('搜索失败:', error)
    toast.error('搜索失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索文章
const searchArticles = async (keyword) => {
  try {
    // 构建搜索URL
    const url = `/api/search/article?keyword=${encodeURIComponent(keyword)}&page=1&limit=50`
    const response = await axios.get(url)
    
    if (response.code === 200 && response.data) {
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.map(item => ({
          ...item,
          type: 'article'
        }))
      } else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data.map(item => ({
          ...item,
          type: 'article'
        }))
      }
    }
    return []
  } catch (error) {
    return []
  }
}

// 搜索页面
const searchPages = async (keyword) => {
  try {
    const url = `/api/search/pages?keyword=${encodeURIComponent(keyword)}&page=1&limit=50`
    const response = await axios.get(url)
    
    if (response.code === 200 && response.data) {
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.map(item => ({
          ...item,
          type: 'page'
        }))
      } else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data.map(item => ({
          ...item,
          type: 'page'
        }))
      }
    }
    return []
  } catch (error) {
    return []
  }
}

// 搜索标签
const searchTags = async (keyword) => {
  try {
    const url = `/api/search/tags?keyword=${encodeURIComponent(keyword)}&page=1&limit=50`
    const response = await axios.get(url)
    
    if (response.code === 200 && response.data) {
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.map(item => ({
          ...item,
          type: 'tag'
        }))
      } else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data.map(item => ({
          ...item,
          type: 'tag'
        }))
      }
    }
    return []
  } catch (error) {
    return []
  }
}

// 搜索友链
const searchLinks = async (keyword) => {
  try {
    const url = `/api/search/links?keyword=${encodeURIComponent(keyword)}&page=1&limit=50`
    const response = await axios.get(url)
    
    if (response.code === 200 && response.data) {
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.map(item => ({
          ...item,
          type: 'links'
        }))
      } else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data.map(item => ({
          ...item,
          type: 'links'
        }))
      }
    }
    return []
  } catch (error) {
    return []
  }
}

// 搜索用户
const searchUsers = async (keyword) => {
  try {
    const url = `/api/search/users?keyword=${encodeURIComponent(keyword)}&page=1&limit=50`
    const response = await axios.get(url)
    
    if (response.code === 200 && response.data) {
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.map(item => ({
          ...item,
          type: 'users'
        }))
      } else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data.map(item => ({
          ...item,
          type: 'users'
        }))
      }
    }
    return []
  } catch (error) {
    return []
  }
}

// 获取结果图标
const getResultIcon = (type) => {
  switch (type) {
    case 'article':
      return 'bi bi-file-earmark-text'
    case 'page':
      return 'bi bi-file-earmark'
    case 'tag':
      return 'bi bi-tag'
    case 'links':
      return 'bi bi-link'
    case 'users':
      return 'bi bi-person'
    default:
      return 'bi bi-search'
  }
}

// 获取结果类型的中文名称
const getResultTypeName = (type) => {
  switch (type) {
    case 'article':
      return '文章'
    case 'page':
      return '页面'
    case 'tag':
      return '标签'
    case 'links':
      return '友链'
    case 'users':
      return '用户'
    default:
      return '未知'
  }
}

// 获取结果标题（根据类型选择不同字段）
const getResultTitle = (result) => {
  if (result.type === 'users') {
    return result.nickname || result.name || result.title || '未知用户'
  }
  if (result.type === 'links') {
    return result.nickname || result.name || result.title || '未知友链'
  }
  return result.title || result.name || '未知'
}

// 获取搜索占位符
const getSearchPlaceholder = () => {
  switch (searchScope.value) {
    case 'article':
      return '搜索文章...'
    case 'page':
      return '搜索页面...'
    case 'tag':
      return '搜索标签...'
    case 'links':
      return '搜索友链...'
    case 'users':
      return '搜索用户...'
    default:
      return '搜索文章、页面、标签、友链或用户...'
  }
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  
  // 处理秒级时间戳（转换为毫秒级）
  const timestampMs = typeof timestamp === 'number' ? timestamp * 1000 : timestamp
  const date = new Date(timestampMs)
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) return ''
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 导航到结果
const navigateToResult = (result) => {
  switch (result.type) {
    case 'article':
      if (result.id) {
        router.push(`/archives/${result.id}`)
      }
      break
    case 'page':
      if (result.key) {
        router.push(`/${result.key}`)
      } else {
        toast.error('页面路径无效，无法跳转')
      }
      break
    case 'tag':
      if (result.id) {
        router.push(`/tag/${result.id}`)
      }
      break
    case 'links':
      // 友链跳转至外部网站
      if (result.url) {
        window.open(result.url, '_blank')
      } else {
        toast.error('友链链接无效')
      }
      break
    case 'users':
      // 用户跳转至用户主页
      if (result.id) {
        router.push(`/author/${result.id}`)
      }
      break
    default:
      break
  }
}

// 清理
const cleanup = () => {
  clearTimeout(debounceTimer.value)
}

// 生命周期钩子
onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.close-badge-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #999;
  border: none;
  color: white;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  z-index: 1;
}

.close-badge-btn:hover {
  background-color: #666;
}

.close-badge-btn i {
  margin: 0;
}

.result-selected .card {
  border-color: #0d6efd;
  background-color: rgba(13, 110, 253, 0.05);
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-item {
  cursor: pointer;
}

.result-item:hover .card {
  border-color: #0d6efd;
}

/* 友链结果样式 */
.result-links .card {
  border-left: 3px solid #10b981;
}

.result-links:hover .card {
  border-color: #059669;
  border-left-color: #10b981;
}

/* 用户结果样式 */
.result-users .card {
  border-left: 3px solid #8b5cf6;
}

.result-users:hover .card {
  border-color: #7c3aed;
  border-left-color: #8b5cf6;
}

/* 手机端响应式样式 */
@media (max-width: 767.98px) {
  .btn-group .btn {
    font-size: 0.75rem;
    padding: 0.375rem 0.5rem;
    flex-wrap: nowrap;
  }
  
  .btn-group .btn i {
    font-size: 0.75rem;
    margin-right: 0.25rem;
  }
  
  .btn-group .btn span {
    display: none;
  }
  
  .input-group .form-control {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
  
  .input-group .btn {
    padding: 0.5rem 0.75rem;
  }
  
  .search-header-content {
    gap: 0.5rem;
  }
}

/* 平板端响应式样式 */
@media (min-width: 768px) and (max-width: 991.98px) {
  .btn-group .btn {
    font-size: 0.8125rem;
    padding: 0.4375rem 0.625rem;
  }
  
  .btn-group .btn i {
    font-size: 0.8125rem;
  }
}

@media (prefers-color-scheme: dark) {
  .result-selected .card {
    border-color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.1);
    box-shadow: 0 0 0 0.25rem rgba(59, 130, 246, 0.3);
  }
  
  .result-item:hover .card {
    border-color: #3b82f6;
  }
  
  mark {
    background-color: rgba(250, 204, 21, 0.3);
    color: #fbbf24;
  }
}
</style>