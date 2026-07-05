<template>
  <div class="tags-page-wrapper">
    <!-- 加载状态 -->
    <div v-if="loading">
      <!-- 标签列表页骨架屏 -->
      <div class="tags-list-page">
        <!-- 标签总数统计骨架 -->
        <div class="tags-count card shadow-sm mt-2">
          <div class="tags-count-header">
            <div class="skeleton skeleton-tags-count-title mb-3"></div>
          </div>
        </div>

        <!-- 标签卡片网格骨架 -->
        <div class="tags-grid card shadow-sm mt-2">
          <div class="tags-grid-container">
            <div
              v-for="i in 6"
              :key="`tag-skeleton-${i}`"
              class="tag-card"
            >
              <div class="tag-card-inner">
                <!-- 标签头像骨架 -->
                <div class="tag-avatar">
                  <div class="skeleton skeleton-tag-avatar"></div>
                </div>

                <!-- 标签信息骨架 -->
                <div class="tag-card-body">
                  <div class="skeleton skeleton-tag-card-title mb-2"></div>
                  <div class="skeleton skeleton-tag-card-description mb-3"></div>
                  <div class="tag-card-footer">
                    <div class="skeleton skeleton-tag-article-count"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 标签分页骨架 -->
        <div class="tag-pagination-container mt-4">
          <div class="skeleton skeleton-pagination"></div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="card shadow-sm mt-2">
      <p class="mb-0 fw-normal">{{ errorMsg }}</p>
    </div>

    <!-- 标签页面主体 -->
    <div v-else class="tags-main">
      <!-- 标签列表页结构 -->
      <div v-if="!currentTag" class="tags-list-page">
        <div class="card mt-2">
          <div class="card-body">
            <span class="tags-count-title">
              标签总数
              <span class="text-sm text-muted">({{ totalTags }})</span>
            </span>
          </div>
        </div>

        <!-- 标签卡片网格 -->
        <div class="tags-grid card shadow-sm mt-2 bg-body">
          <div class="tags-grid-container">
            <div
              v-for="tag in tags"
              :key="tag.id"
              class="tag-card card bg-body border border-light shadow-sm"
              @click="selectTag(tag.id)"
            >
              <div class="tag-card-inner p-4">
                <!-- 标签头像 -->
                <div class="tag-avatar mx-auto mb-4">
                  <img
                    :src="tag.avatar || defaultCover"
                    :alt="tag.name"
                    class="tag-avatar-img rounded-circle"
                    @error="handleImageError"
                  />
                </div>

                <!-- 标签信息 -->
                <div class="tag-card-body text-center">
                  <h3 class="tag-card-title h5 fw-bold mb-2">
                    {{ tag.name }}
                  </h3>
                  <p
                    v-if="tag.description"
                    class="tag-card-description text-muted mb-3"
                  >
                    {{ tag.description }}
                  </p>
                  <div class="tag-card-footer pt-3 border-top border-light">
                    <span
                      class="tag-article-count badge bg-secondary-subtle text-secondary px-3 py-1 rounded-pill"
                    >
                      {{ tag.articleCount || 0 }} 篇文章
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 标签分页 -->
        <div v-if="totalTags > 0" class="tag-pagination-container mt-4">
          <nav aria-label="Tag page navigation">
            <ul class="pagination justify-content-center">
              <li
                class="page-item"
                :class="{ disabled: tagCurrentPage === 1 }"
              >
                <button
                  class="page-link"
                  @click="changeTagPage(tagCurrentPage - 1)"
                >
                  <span aria-hidden="true">&laquo;</span>
                </button>
              </li>
              <li class="page-item active">
                <span class="page-link">
                  {{ tagCurrentPage }} / {{ tagPageCount }}
                </span>
              </li>
              <li
                class="page-item"
                :class="{ disabled: tagCurrentPage === tagPageCount }"
              >
                <button
                  class="page-link"
                  @click="changeTagPage(tagCurrentPage + 1)"
                >
                  <span aria-hidden="true">&raquo;</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <!-- 单个标签页结构 -->
      <div v-else class="single-tag-page">
        <!-- 标签详情 -->
        <div class="tag-info card shadow-sm mt-2">
          <div class="tag-info-inner">
            <!-- 标签头像 -->
            <div class="tag-info-avatar">
              <img
                :src="currentTag.avatar || defaultCover"
                :alt="currentTag.name"
                class="tag-info-avatar-img rounded-3"
                @error="handleImageError"
              />
            </div>

            <!-- 标签信息 -->
            <div class="tag-info-content">
              <h1 class="tag-title fw-bold mb-3">
                {{ currentTag.name }}
                <span class="text-sm text-muted">
                  ({{ currentTag.articleCount || 0 }})
                </span>
              </h1>
              <p
                v-if="currentTag.description"
                class="tag-description text-muted mb-4"
              >
                {{ currentTag.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 文章列表 -->
      <div
        v-if="currentTag"
        :class="[
          'article-list-container mt-2',
          hasImageMode ? 'grid-article-list' : 'list-article-list',
        ]"
      >
        <!-- 空状态 -->
        <div
          v-if="articles.length === 0"
          class="card shadow-sm p-4 text-center col-12"
        >
          <i class="bi bi-file-earmark-text text-muted fs-3 mb-2"></i>
          <p class="mb-0 text-muted">该标签下暂无文章</p>
        </div>

        <!-- 文章卡片 -->
        <div
          v-for="article in articles"
          :key="article.id"
          :class="[
            'card',
            hasImageMode
              ? 'article-item-card shadow-sm hover-shadow'
              : 'article-item-list shadow-sm hover-shadow mt-2',
          ]"
          @click="goToArticle(article.id)"
          style="cursor: pointer"
        >
          <!-- 有图模式 -->
          <div
            v-if="hasImageMode"
            class="card-body p-0 d-flex flex-column h-100"
          >
            <!-- 文章封面 -->
            <div class="article-cover flex-shrink-0">
              <img
                :src="getCoverImg(article)"
                :alt="article.title"
                class="article-cover-img w-100 h-100 object-cover"
                loading="lazy"
                decoding="async"
                @error="handleImageError"
              />
            </div>

            <!-- 文章内容 -->
            <div
              class="article-content p-2 flex-grow-1 d-flex flex-column"
            >
              <h3 class="article-title fw-bold mb-1 m-0">
                {{ article.title }}
              </h3>

              <p class="article-desc text-truncate-1 mt-auto mb-1">
                {{ article.abstract || "暂无摘要" }}
              </p>

              <!-- 元信息 -->
              <div
                class="article-meta d-flex align-items-center w-100 m-0"
              >
                <div class="meta-left d-flex align-items-center gap-0.5">
                  <span class="meta-item">
                    <i class="bi bi-folder-fill"></i>
                    {{ article?.result?.group?.[0]?.name || "未分类" }}
                  </span>
                </div>
                <div class="meta-right d-flex align-items-center gap-0.5 ms-auto">
                  <span class="meta-item">
                    <i class="bi bi-calendar-fill"></i>
                    {{ formatTime(article.publish_time) }}
                  </span>
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

      <!-- 文章分页 -->
      <div v-if="currentTag && total > 0" class="pagination-container mt-4">
        <nav aria-label="Page navigation">
          <ul class="pagination justify-content-center">
            <li
              class="page-item"
              :class="{ disabled: currentPage === 1 }"
            >
              <button class="page-link" @click="changePage(currentPage - 1)">
                <span aria-hidden="true">&laquo;</span>
              </button>
            </li>
            <li class="page-item active">
              <span class="page-link">
                {{ currentPage }} / {{ pageCount }}
              </span>
            </li>
            <li
              class="page-item"
              :class="{ disabled: currentPage === pageCount }"
            >
              <button class="page-link" @click="changePage(currentPage + 1)">
                <span aria-hidden="true">&raquo;</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { request } from '@/utils/network'
import { usePageTitle } from '@/utils/app'

// 组件属性定义
const props = defineProps({
  id: {
    type: [String, Number],
    default: null
  }
})

// 导入本地静态资源
import defaultCover from '@/assets/img/fm.avif'

import { useCommStore } from '@/store/comm'

// 全局状态管理
const store = {
  comm: useCommStore()
}

const router = useRouter()
const route = useRoute()

// 页面标题管理
const { setDynamicTitle } = usePageTitle()
setDynamicTitle('加载中...')

// 响应式状态
const loading = ref(true)                // 是否处于加载状态
const error = ref(false)                 // 是否发生错误
const errorMsg = ref('')                // 错误信息
const tags = ref([])                    // 标签列表
const tagsCount = ref(0)                 // 标签数量
const currentTag = ref(null)             // 当前选中的标签
const currentTagId = ref(null)           // 当前标签 ID
const articles = ref([])                // 文章列表
const currentPage = ref(1)              // 当前页码
const total = ref(0)                    // 文章总数
const limit = ref(10)                   // 每页条数

// 标签分页相关
const tagCurrentPage = ref(1)            // 当前标签页码
const tagPageSize = ref(10)              // 每页标签数量
const totalTags = ref(0)                 // 标签总数

// 显示模式：true = 有图模式，false = 列表模式
const hasImageMode = ref(true)

// 从后端API获取显示模式设置
const loadDisplayMode = async () => {
  try {
    // 优先从 store 读取（siteInfo 已经在应用初始化时缓存过了）
    if (store.comm.siteInfo?.display_mode !== undefined) {
      hasImageMode.value = store.comm.siteInfo.display_mode !== false
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

// 计算文章总页数
const pageCount = computed(() => {
  return Math.ceil(total.value / limit.value)
})

// 计算标签总页数
const tagPageCount = computed(() => {
  return Math.ceil(totalTags.value / tagPageSize.value)
})

/**
 * 格式化时间戳为中文日期
 */
const formatTime = (timestamp) => {
  if (!timestamp || timestamp === 0) return '未知时间'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * 跳转到文章详情页
 */
const goToArticle = (articleId) => {
  const validArticleId = parseInt(articleId)
  if (!isNaN(validArticleId) && validArticleId > 0) {
    router.push(`/archives/${validArticleId}`)
  }
}

/**
 * 获取文章封面图（响应式处理）
 */
const getCoverImg = (article) => {
  if (article.covers && typeof article.covers === 'string' && article.covers.trim()) {
    return article.covers.trim()
  }

  if (
    article.result &&
    article.result.covers &&
    typeof article.result.covers === 'string' &&
    article.result.covers.trim()
  ) {
    return article.result.covers.trim()
  }

  if (article.cover && typeof article.cover === 'string' && article.cover.trim()) {
    return article.cover.trim()
  }

  return defaultCover
}

/**
 * 图片加载失败回调
 */
const handleImageError = (event) => {
  const img = event.target
  if (img.src !== defaultCover) {
    img.src = defaultCover
  }
  img.onerror = null
}

/**
 * 获取标签列表
 */
const getTagsList = async () => {
  try {
    const apiUrl = `/api/tags/all?page=${tagCurrentPage.value}&limit=${tagPageSize.value}&order=create_time+desc&cache=false`
    const res = await request.get(apiUrl)

    if (res.code === 200 && res.data) {
      const tagsList = res.data.data || res.data || []
      totalTags.value = res.data.count || tagsList.length

      await Promise.all(
        tagsList.map(tag => getTagArticleCount(tag))
      )

      tags.value = tagsList
      tagsCount.value = tagsList.length
    }
  } catch (err) {
    tags.value = []
    tagsCount.value = 0
  }
}

/**
 * 获取标签下的文章数量
 */
const getTagArticleCount = async (tag) => {
  try {
    const like = `tags|%7C${tag.id}%7C`
    const apiUrl = `/api/article/count?like=${like}&where[audit]=1`
    const res = await request.get(apiUrl)

    tag.articleCount =
      res.code === 200 ? res.data?.count ?? res.data ?? 0 : 0
  } catch {
    tag.articleCount = 0
  }
}

/**
 * 获取标签下的文章列表
 */
const getTagArticles = async (tagId, page = 1) => {
  try {
    const like = `tags|%7C${tagId}%7C`
    const apiUrl = `/api/article/all?like=${like}&where[audit]=1&page=${page}&limit=${limit.value}&order=create_time+desc&cache=false`
    const res = await request.get(apiUrl)

    if (res.code === 200) {
      articles.value = res.data?.data || []
      total.value = res.data?.count || 0
    }
  } catch {
    articles.value = []
    total.value = 0
  }
}

/**
 * 选择标签并跳转
 */
const selectTag = (tagId) => {
  router.push(`/tag/${tagId}`)
}

/**
 * 切换文章分页
 */
const changePage = (page) => {
  if (page < 1 || page > pageCount.value) return
  currentPage.value = page
  getTagArticles(currentTagId.value, page)
}

/**
 * 切换标签分页
 */
const changeTagPage = (page) => {
  if (page < 1 || page > tagPageCount.value) return
  tagCurrentPage.value = page
  getTagsList()
}

/**
 * 根据路由参数加载单个标签
 */
const loadTagFromProps = async (tagId) => {
  if (!tagId) return

  try {
    const apiUrl = `/api/tags/all?where=${encodeURIComponent(JSON.stringify({ id: tagId }))}&cache=false`
    const res = await request.get(apiUrl)

    if (res.code === 200 && res.data) {
      const tag = Array.isArray(res.data)
        ? res.data[0]
        : res.data.data?.[0]

      if (tag) {
        currentTagId.value = tag.id
        currentTag.value = tag
        setDynamicTitle(tag.name)
        await getTagArticleCount(tag)
      } else {
        error.value = true
        errorMsg.value = '未找到该标签'
        setDynamicTitle('标签不存在')
      }
    }
  } catch {
    error.value = true
    errorMsg.value = '网络异常，请稍后重试'
    setDynamicTitle('网络异常')
  }
}

/**
 * 初始化页面
 */
const initPage = async () => {
  loading.value = true
  error.value = false

  loadDisplayMode()

  const tagIdFromRoute = route.params.id

  if (tagIdFromRoute) {
    await Promise.all([
      getTagsList(),
      loadTagFromProps(tagIdFromRoute),
      getTagArticles(tagIdFromRoute, 1)
    ])
  } else {
    await getTagsList()
    setDynamicTitle('标签')
  }

  loading.value = false
}

// 监听路由参数变化
watch(
  () => route.params.id,
  async () => {
    await initPage()
  }
)

// 页面挂载
onMounted(async () => {
  await initPage()
})
</script>

<style scoped>
/* 骨架屏加载动画样式 */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

/* 骨架屏各部分尺寸 */
.skeleton-tags-count-title {
  height: 2rem;
  width: 60%;
}

.skeleton-tag-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.skeleton-tag-card-title {
  height: 1.2rem;
  width: 70%;
  margin: 0 auto;
}

.skeleton-tag-card-description {
  height: 0.9rem;
  width: 90%;
  margin: 0 auto;
}

.skeleton-tag-article-count {
  height: 0.85rem;
  width: 60%;
  margin: 0 auto;
}

.skeleton-pagination {
  height: 2.5rem;
  width: 200px;
  margin: 0 auto;
  border-radius: 0.375rem;
}

/* 标签标题 */
.tag-title {
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  line-height: 1.3;
  font-weight: 700;
  margin-bottom: 0.75rem !important;
}

/* 标签描述 */
.tag-description {
  font-size: 1.1rem;
  line-height: 1.5;
  margin-bottom: 0 !important;
}

/* 标签总数统计 */
.tags-count {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.tags-count-header {
  padding: 1.5rem;
}

/* 标签卡片网格 */
.tags-grid {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.tags-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

/* 标签卡片 */
.tag-card {
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.tag-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  border-color: var(--bs-secondary);
}

/* 标签头像 */
.tag-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--bs-body-bg);
  border: 3px solid var(--bs-body-bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.tag-card:hover .tag-avatar {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.tag-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.tag-avatar-img:hover {
  transform: scale(1.1);
}

/* 标签卡片内容 */
.tag-card-body {
  text-align: center;
}

.tag-card-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  line-height: 1.3;
  color: var(--bs-heading-color);
  transition: all 0.3s ease;
}

.tag-card:hover .tag-card-title {
  color: var(--bs-secondary);
  transform: translateY(-2px);
}

.tag-card-description {
  font-size: 0.9rem;
  color: var(--bs-secondary-color);
  margin-bottom: 1rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
}

.tag-card:hover .tag-card-description {
  color: var(--bs-text-color);
}

.tag-card-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--bs-border-color);
  transition: all 0.3s ease;
}

.tag-card:hover .tag-card-footer {
  border-top-color: var(--bs-secondary);
}

.tag-article-count {
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.tag-card:hover .tag-article-count {
  transform: translateY(-1px);
}

/* 单个标签页结构 */
.tag-info {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.tag-info-inner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  padding: 1.5rem;
}

.tag-info-avatar {
  flex-shrink: 0;
  position: relative;
}

.tag-info-avatar-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: 3px solid white;
}

.tag-info-avatar-img:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

/* 标签信息内容 */
.tag-info-content {
  flex-grow: 1;
  min-width: 0;
}

/* 标签标题 */
.tag-title {
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  line-height: 1.3;
  font-weight: 700;
  margin-bottom: 0.75rem !important;
  color: var(--bs-heading-color);
  transition: all 0.3s ease;
}

.tag-title:hover {
  color: var(--bs-secondary);
}

.tag-title .text-muted {
  font-size: 0.8em;
  font-weight: 400;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.tag-title:hover .text-muted {
  opacity: 1;
  color: var(--bs-secondary);
}

/* 标签描述 */
.tag-description {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 0 !important;
  color: var(--bs-secondary-color);
  transition: all 0.3s ease;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .tag-info-inner {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .tag-info-avatar-img {
    width: 80px;
    height: 80px;
  }

  .tag-title {
    font-size: clamp(1.5rem, 5vw, 2rem);
  }

  .tag-description {
    font-size: 1rem;
  }
}

/* 文章列表 Grid 布局（有图模式） */
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

/* 封面容器 */
.article-cover {
  width: 100%;
  padding-top: 66.67%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 0.75rem 0.75rem 0 0;
}

/* 文章封面图片样式 */
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

/* 文章内容 */
.article-content {
  height: 100%;
  padding: 1.25rem !important;
}

/* 通用图片样式 */
img {
  transition: all 0.3s ease;
  max-width: 100%;
  height: auto;
}

.article-cover:hover .article-cover-img {
  transform: scale(1.08);
  filter: brightness(1.05);
}

/* 文章标题 */
.article-title {
  font-size: clamp(1.05rem, 1.5vw, 1.25rem);
  line-height: 1.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 700;
  color: #212529;
  transition: color 0.3s ease;
  margin-bottom: 0.75rem !important;
}

.article-item-card:hover .article-title {
  color: var(--bs-secondary);
}

/* 文章摘要 */
.article-desc {
  font-size: 0.8rem;
  color: #6c757d;
  line-height: 1.4;
  margin: 0 0 1rem 0;
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

/* 列表模式标题 */
.article-title-list {
  font-size: clamp(1.15rem, 2vw, 1.4rem);
  line-height: 1.5;
  font-weight: 700;
  color: #212529;
  transition: color 0.3s ease;
  margin-bottom: 0.5rem !important;
}

.article-item-list:hover .article-title-list {
  color: var(--bs-secondary);
}

/* 列表模式摘要 */
.article-desc-list {
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.6;
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 元信息 */
.article-meta {
  font-size: 0.75rem;
  color: #868e96;
  line-height: 1.3;
  margin-top: auto;
}

.meta-left,
.meta-right {
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
  color: #9ca3af;
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

/* 响应式调整 */
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

  .tags-grid-container {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }

  .tag-avatar {
    width: 60px;
    height: 60px;
  }

  .tag-info-avatar {
    width: 100px;
    height: 100px;
  }

  .tag-card-inner {
    padding: 1.2rem;
  }

  .tag-card-title {
    font-size: 1.1rem;
  }

  .tag-card-description {
    font-size: 0.85rem;
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

  .meta-item {
    font-size: 0.65rem;
  }

  .meta-item .bi {
    font-size: 0.8em;
  }

  .tags-grid-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .tag-avatar {
    width: 50px;
    height: 50px;
  }

  .tag-info-avatar {
    width: 80px;
    height: 80px;
  }

  .tag-card-inner {
    padding: 1rem;
  }

  .tag-card-title {
    font-size: 1rem;
  }

  .tag-card-description {
    font-size: 0.8rem;
  }

  .tag-article-count {
    font-size: 0.75rem;
  }
}

/* 暗黑模式适配 */
[data-bs-theme='dark'] {
  .tags-count {
    background: linear-gradient(135deg, var(--bs-tertiary-bg), var(--bs-body-bg));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .tags-grid {
    background: linear-gradient(135deg, var(--bs-tertiary-bg), var(--bs-body-bg));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .tag-title {
    color: var(--bs-heading-color);
  }

  .tag-description {
    color: var(--bs-secondary-color);
  }

  .tag-card {
    background-color: var(--bs-body-bg);
    border-color: var(--bs-border-color);
  }

  .tag-card-title {
    color: var(--bs-heading-color);
  }

  .tag-card-description {
    color: var(--bs-secondary-color);
  }

  .tag-article-count {
    background-color: rgba(var(--bs-primary-rgb), 0.2);
    color: var(--bs-primary);
  }

  .tag-avatar {
    background-color: var(--bs-body-bg);
    border-color: var(--bs-body-bg);
  }

  .tag-info {
    background: linear-gradient(135deg, var(--bs-tertiary-bg), var(--bs-body-bg));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .tag-info-avatar-img {
    border-color: var(--bs-secondary-bg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .tag-info-avatar-img:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }

  .article-item-card,
  .article-item-list {
    background-color: var(--bs-body-bg);
    border-color: var(--bs-border-color);
  }

  .article-title {
    color: var(--bs-heading-color);
  }

  .article-desc {
    color: var(--bs-secondary-color);
  }

  .article-title-list {
    color: var(--bs-heading-color);
  }

  .article-desc-list {
    color: var(--bs-secondary-color);
  }

  .article-meta {
    color: var(--bs-tertiary-color);
  }

  .meta-item .bi {
    color: var(--bs-tertiary-color);
  }

  .skeleton {
    background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
    background-size: 200% 100%;
  }

  .article-item-card:hover,
  .article-item-list:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .tag-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

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
}
</style>