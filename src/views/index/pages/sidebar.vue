<template>
  <div class="sidebar-container position-sticky top-0" :class="{ 'dark-mode': isDarkMode }">
    <!-- 个人信息卡片 -->
    <div class="card mt-2">
      <div class="card-header border-bottom">
        <h6 class="mb-0 fw-semibold">
          <i class="bi bi-person-circle me-2 text-secondary"></i>
          <span>个人信息</span>
        </h6>
      </div>
      <div class="card-body text-center">
        <!-- 已登录用户信息 -->
        <div v-if="store.comm.login.finish && store.comm.login.user" class="user-info-container">
          <div class="position-relative d-inline-block mb-3">
            <div class="avatar-container position-relative">
              <img
                :src="defaultAvatar"
                :data-src="store.comm.login.user.avatar || defaultAvatar"
                :alt="store.comm.login.user.nickname || '用户头像'"
                class="rounded-3 user-avatar lazy-img"
                @load="onImageLoad"
                @error="handleImageError"
              >
              <div class="avatar-overlay rounded-3">
                <div class="avatar-status" :class="{ 'online': store.comm.login.user.login_time && (Date.now() / 1000 - store.comm.login.user.login_time < 86400) }"></div>
              </div>
            </div>
          </div>
          
          <h6 class="fw-bold mb-1 user-nickname">{{ store.comm.login.user.nickname || store.comm.login.user.account }}</h6>
          <p v-if="store.comm.login.user.bio" class="text-muted mb-3 user-bio">{{ store.comm.login.user.bio }}</p>
          <p v-else class="text-muted mb-3 user-bio">欢迎回来！</p>
          
          <div class="d-grid gap-2 mb-3">
            <router-link :to="`/author/${store.comm.login.user.id}`" class="btn btn-outline-secondary btn-sm rounded-3 fw-medium py-2 text-decoration-none sidebar-btn">
              <i class="bi bi-person-circle me-1"></i>
              用户中心
            </router-link>
            <button v-if="store.comm.login.user.role === 'admin'" class="btn btn-outline-secondary btn-sm rounded-3 fw-medium py-2 sidebar-btn">
              <i class="bi bi-gear me-1"></i>
              后台管理
            </button>
          </div>
          
          <div class="mt-3 pt-3 border-top border-secondary-subtle user-stats">
            <div class="row g-2">
              <div class="col-4 text-center">
                <div class="fw-bold fs-6 user-stat-value">{{ userStats.articleCount }}</div>
                <div class="text-muted fs-7 user-stat-label">文章</div>
              </div>
              <div class="col-4 text-center">
                <div class="fw-bold fs-6 user-stat-value">{{ userStats.collectCount }}</div>
                <div class="text-muted fs-7 user-stat-label">收藏</div>
              </div>
              <div class="col-4 text-center">
                <div class="fw-bold fs-6 user-stat-value">{{ userStats.likeCount }}</div>
                <div class="text-muted fs-7 user-stat-label">点赞</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 未登录用户信息 -->
        <div v-else class="user-info-container">
          <div class="position-relative d-inline-block mb-3">
            <img
              :src="defaultAvatar"
              :data-src="defaultAvatar"
              alt="头像"
              class="rounded-3 user-avatar lazy-img"
              @load="onImageLoad"
              @error="handleImageError"
            >
          </div>
          
          <h6 class="fw-bold mb-1">HI！请登录</h6>
          <p class="text-muted mb-3 user-bio">登录后解锁更多功能</p>
          
          <div class="d-grid gap-2 mb-3">
            <button class="btn btn-outline-secondary btn-sm rounded-3 fw-medium py-2 sidebar-btn" @click="$emit('showLogin')">
              <i class="bi bi-box-arrow-in-right me-1"></i>
              立即登录
            </button>
            <button class="btn btn-outline-secondary btn-sm rounded-3 fw-medium py-2 sidebar-btn" @click="$emit('showRegister')">
              <i class="bi bi-person-plus me-1"></i>
              注册账号
            </button>
          </div>
          
          <div class="mt-3 pt-3 border-top border-secondary-subtle user-stats">
            <div class="row g-2">
              <div class="col-4 text-center">
                <div class="fw-bold fs-6 user-stat-value">0</div>
                <div class="text-muted fs-7 user-stat-label">文章</div>
              </div>
              <div class="col-4 text-center">
                <div class="fw-bold fs-6 user-stat-value">0</div>
                <div class="text-muted fs-7 user-stat-label">收藏</div>
              </div>
              <div class="col-4 text-center">
                <div class="fw-bold fs-6 user-stat-value">0</div>
                <div class="text-muted fs-7 user-stat-label">点赞</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 等级排行卡片 -->
    <div class="card mt-2">
      <div class="card-header border-bottom d-flex justify-content-between align-items-center">
        <h6 class="mb-0 fw-semibold">
          <i class="bi bi-trophy me-2 text-secondary"></i>
          <span>等级排行</span>
        </h6>
        <button 
          class="btn sidebar-btn-icon"
          @click="getLevelRank"
          :disabled="levelLoading"
          title="刷新"
        >
          <i class="bi bi-arrow-clockwise" :class="{ 'spin': levelLoading }"></i>
        </button>
      </div>
      <div class="card-body">
        <div class="d-grid mb-3">
          <button 
            class="btn btn-outline-secondary btn-sm rounded-3 fw-medium py-2 sidebar-btn sign-btn"
            @click="doSign"
            :disabled="signLoading || hasSigned"
          >
            <i v-if="!signLoading" :class="hasSigned ? 'bi bi-check-circle' : 'bi bi-calendar-check'" class="me-1"></i>
            <i v-else class="bi bi-arrow-clockwise spin me-1"></i>
            {{ hasSigned ? '今日已签到' : '每日签到' }}
          </button>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="levelLoading" class="py-4">
          <div class="skeleton-loader mb-3" style="height: 40px; border-radius: 0.375rem;"></div>
          <div class="space-y-2">
            <div v-for="i in 3" :key="i" class="d-flex align-items-center gap-3">
              <div class="skeleton-loader" style="width: 48px; height: 48px; border-radius: 50%;"></div>
              <div class="flex-grow-1 space-y-2">
                <div class="skeleton-loader" style="height: 16px; width: 70%;"></div>
                <div class="skeleton-loader" style="height: 5px; width: 100%;"></div>
                <div class="d-flex justify-content-between">
                  <div class="skeleton-loader" style="height: 14px; width: 40%;"></div>
                  <div class="skeleton-loader" style="height: 14px; width: 30%;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无数据 -->
        <div v-else-if="levelRankList.length === 0" class="text-center py-4 empty-state">
          <i class="bi bi-emoji-frown fs-5 text-muted mb-2 d-block"></i>
          <p class="text-muted mb-0">暂无等级数据</p>
        </div>

        <!-- 等级排行列表 -->
        <div v-else class="sidebar-list">
          <div
            class="sidebar-list-item d-flex align-items-center gap-3 mb-2"
            v-for="(user, index) in levelRankList"
            :key="user.id"
            @click="goToAuthor(user.id)"
            :class="{
              'sidebar-list-item-top': index < 3,
              'sidebar-list-item-hover': true
            }"
          >
            <!-- 排名徽章 -->
            <div class="position-relative flex-shrink-0">
              <div class="rank-badge" :class="{ 'rank-badge-top': index < 3 }">
                {{ index + 1 }}
              </div>
              <!-- 头像 -->
              <img
                :src="defaultAvatar"
                :data-src="user.avatar || defaultAvatar"
                alt="用户头像"
                class="rank-avatar lazy-img"
                @load="onImageLoad"
                @error="handleImageError"
              >
            </div>

            <!-- 用户信息 -->
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex align-items-center gap-1 mb-1">
                <h6 class="mb-0 fw-semibold text-truncate">{{ user.nickname }}</h6>
              </div>
              <div class="progress sidebar-progress" style="height: 5px;">
                <div 
                  class="progress-bar bg-primary" 
                  :style="{ width: Math.min(((user.exp || 0) % 100) / 100 * 100, 100) + '%' }"
                ></div>
              </div>
              <div class="d-flex justify-content-between align-items-center mt-1">
                <span class=" fs-7 fw-medium">
                  Lv.{{ user.result?.level?.current?.value || calculateLevel(user.exp || 0) }}
                </span>
                <span class="text-muted fs-7">
                  {{ user.exp || 0 }} 经验
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 热门文章卡片 -->
    <div class="card mt-2">
      <div class="card-header border-bottom">
        <h6 class="mb-0 fw-semibold">
          <i class="bi bi-fire me-2 text-secondary"></i>
          <span>热门文章</span>
        </h6>
      </div>
      <div class="card-body">
        <!-- 加载状态 -->
        <div v-if="loading" class="py-4">
          <div class="space-y-3">
            <div v-for="i in 5" :key="i" class="d-flex align-items-start gap-3">
              <div class="skeleton-loader" style="width: 28px; height: 28px; border-radius: 50%;"></div>
              <div class="flex-grow-1 space-y-2">
                <div class="skeleton-loader" style="height: 16px; width: 80%;"></div>
                <div class="d-flex align-items-center gap-2">
                  <div class="skeleton-loader" style="height: 14px; width: 40%;"></div>
                  <div class="skeleton-loader" style="height: 14px; width: 30%;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无数据 -->
        <div v-else-if="hotArticles.length === 0" class="text-center py-4 empty-state">
          <i class="bi bi-newspaper fs-5 text-muted mb-2 d-block"></i>
          <p class="text-muted mb-0">暂无热门文章</p>
        </div>

        <!-- 文章列表 -->
        <div v-else class="sidebar-list">
          <div
            class="sidebar-list-item sidebar-article-item"
            v-for="(article, index) in hotArticles"
            :key="article.id"
            @click="goToArticle(article.id)"
          >
            <div class="d-flex align-items-start gap-3">
              <!-- 排名徽章 -->
              <div class="flex-shrink-0">
                <div 
                  class="article-rank-badge"
                  :class="{
                    'article-rank-badge-top': index < 3,
                    'article-rank-badge-other': index >= 3
                  }"
                >
                  {{ index + 1 }}
                </div>
              </div>
              
              <!-- 文章信息 -->
              <div class="flex-grow-1 min-w-0">
                <h6 class="fw-semibold mb-1 text-truncate article-title">{{ article.title }}</h6>
                <div class="d-flex align-items-center gap-2 text-muted fs-7 article-meta">
                  <span class="d-flex align-items-center gap-1">
                    <i class="bi bi-eye"></i>
                    {{ article.views || 0 }}
                  </span>
                  <span>
                    {{ formatTime(article.publish_time) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新评论卡片 -->
    <div class="card mt-2">
      <div class="card-header border-bottom">
        <h6 class="mb-0 fw-semibold">
          <i class="bi bi-chat-dots me-2 text-secondary"></i>
          <span>最新评论</span>
        </h6>
      </div>
      <div class="card-body">
        <!-- 加载状态 -->
        <div v-if="commentLoading" class="py-4">
          <div class="space-y-4">
            <div v-for="i in 3" :key="i" class="space-y-2">
              <div class="d-flex align-items-center gap-2">
                <div class="skeleton-loader" style="width: 36px; height: 36px; border-radius: 50%;"></div>
                <div class="flex-grow-1 space-y-1">
                  <div class="skeleton-loader" style="height: 14px; width: 60%;"></div>
                  <div class="skeleton-loader" style="height: 12px; width: 40%;"></div>
                </div>
              </div>
              <div class="skeleton-loader" style="height: 16px; width: 100%;"></div>
              <div class="skeleton-loader" style="height: 16px; width: 90%;"></div>
              <div class="skeleton-loader" style="height: 32px; width: 100%; border-radius: 0.375rem;"></div>
            </div>
          </div>
        </div>

        <!-- 无数据 -->
        <div v-else-if="commentList.length === 0" class="text-center py-4 empty-state">
          <i class="bi bi-chat-square fs-5 text-muted mb-2 d-block"></i>
          <p class="text-muted mb-0">暂无评论内容</p>
        </div>

        <!-- 评论列表 -->
        <div v-else class="sidebar-list">
          <div
            class="sidebar-list-item sidebar-comment-item"
            v-for="comment in commentList"
            :key="comment.id"
            @click="goToArticle(comment.articleId, comment.commentType)"
          >
            <!-- 评论头部 -->
            <div class="d-flex align-items-center gap-2 mb-2">
              <img
                :src="defaultAvatar"
                :data-src="comment.avatar || defaultAvatar"
                alt="用户头像"
                class="comment-avatar lazy-img"
                @load="onImageLoad"
                @error="handleImageError"
              >
              <div class="flex-grow-1 min-w-0">
                <div class="d-flex justify-content-between align-items-center">
                  <h6 class="mb-0 fw-semibold text-truncate">{{ comment.author }}</h6>
                  <span class="text-muted fs-7">{{ comment.time }}</span>
                </div>
              </div>
            </div>

            <!-- 评论内容 -->
            <p class="mb-2 comment-content">
              {{ comment.content }}
            </p>

            <!-- 关联文章 -->
            <div class="d-flex align-items-center justify-content-between border-top border-secondary-subtle pt-2 mt-1">
              <a
                href="#"
                class="text-decoration-none fs-7 fw-medium d-flex align-items-center gap-1 comment-article-link"
                @click.stop="goToArticle(comment.articleId, comment.commentType)"
              >
                <i class="bi bi-link-45deg"></i>
                {{ comment.commentType === 'article' ? '查看文章' : comment.commentType === 'page' ? '查看页面' : '查看原文' }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 人生倒计时卡片 -->
    <div class="card mt-2">
      <div class="card-header border-bottom">
        <h6 class="mb-0 fw-semibold">
          <i class="bi bi-clock-history me-2 text-secondary"></i>
          <span>人生倒计时</span>
        </h6>
      </div>
      <div class="card-body">
        <div class="countdown-container">
          <!-- 今日已过去 -->
          <div class="countdown-item mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="countdown-label">
                <i class="bi bi-sun me-1"></i>今日
              </span>
              <span class="countdown-value fw-semibold">{{ countdownData.todayHours }} 小时</span>
            </div>
            <div class="progress sidebar-progress" style="height: 8px;">
              <div 
                class="progress-bar bg-gradient bg-primary" 
                :style="{ width: countdownData.todayPercent + '%' }"
              ></div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <span class="countdown-percent fs-7 text-muted">{{ countdownData.todayPercent.toFixed(1) }}%</span>
              <span class="countdown-percent fs-7 text-muted">24小时</span>
            </div>
          </div>

          <!-- 本周已过去 -->
          <div class="countdown-item mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="countdown-label">
                <i class="bi bi-calendar-week me-1"></i>本周
              </span>
              <span class="countdown-value fw-semibold">{{ countdownData.weekDays }} 天</span>
            </div>
            <div class="progress sidebar-progress" style="height: 8px;">
              <div 
                class="progress-bar bg-gradient bg-success" 
                :style="{ width: countdownData.weekPercent + '%' }"
              ></div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <span class="countdown-percent fs-7 text-muted">{{ countdownData.weekPercent.toFixed(1) }}%</span>
              <span class="countdown-percent fs-7 text-muted">7天</span>
            </div>
          </div>

          <!-- 本月已过去 -->
          <div class="countdown-item mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="countdown-label">
                <i class="bi bi-calendar-month me-1"></i>本月
              </span>
              <span class="countdown-value fw-semibold">{{ countdownData.monthDays }} 天</span>
            </div>
            <div class="progress sidebar-progress" style="height: 8px;">
              <div 
                class="progress-bar bg-gradient bg-warning" 
                :style="{ width: countdownData.monthPercent + '%' }"
              ></div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <span class="countdown-percent fs-7 text-muted">{{ countdownData.monthPercent.toFixed(1) }}%</span>
              <span class="countdown-percent fs-7 text-muted">{{ countdownData.monthTotalDays }}天</span>
            </div>
          </div>

          <!-- 本年已过去 -->
          <div class="countdown-item">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="countdown-label">
                <i class="bi bi-calendar3 me-1"></i>本年
              </span>
              <span class="countdown-value fw-semibold">{{ countdownData.yearMonths }} 月</span>
            </div>
            <div class="progress sidebar-progress" style="height: 8px;">
              <div 
                class="progress-bar bg-gradient bg-danger" 
                :style="{ width: countdownData.yearPercent + '%' }"
              ></div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <span class="countdown-percent fs-7 text-muted">{{ countdownData.yearPercent.toFixed(1) }}%</span>
              <span class="countdown-percent fs-7 text-muted">12月</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 标签云卡片 -->
    <div class="card mt-2">
      <div class="card-header border-bottom">
        <h6 class="mb-0 fw-semibold">
          <i class="bi bi-tags me-2 text-secondary"></i>
          <span>标签云</span>
        </h6>
      </div>
      <div class="card-body">
        <!-- 加载状态 -->
        <div v-if="tagLoading" class="py-4">
          <div class="d-flex flex-wrap gap-2">
            <div v-for="i in 10" :key="i" class="skeleton-loader" style="height: 32px; padding: 0 16px; border-radius: 0.375rem;"></div>
          </div>
        </div>

        <!-- 无数据 -->
        <div v-else-if="tagList.length === 0" class="text-center py-4 empty-state">
          <i class="bi bi-tag fs-5 text-muted mb-2 d-block"></i>
          <p class="text-muted mb-0">暂无标签</p>
        </div>

        <!-- 标签云 -->
        <div v-else class="d-flex flex-wrap gap-2">
          <router-link
            class="badge text-bg-light text-dark text-decoration-none"
            v-for="tag in tagList"
            :key="tag.id"
            :to="`/tag/${tag.id}`"
          >
            {{ tag.name }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- 快捷导航 -->
    <div class="card mt-2">
      <div class="card-header border-bottom">
        <h6 class="mb-0 fw-semibold">
          <i class="bi bi-compass me-2 text-secondary"></i>
          <span>快捷导航</span>
        </h6>
      </div>
      <div class="card-body">
        <div class="row g-2">
          <div class="col-6" v-for="nav in quickNavs" :key="nav.id">
            <div 
              @click="router.push(nav.url)"
              class="nav-item cursor-pointer"
            >
              <i :class="nav.icon" class="nav-item-icon"></i>
              <span class="nav-item-name">{{ nav.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCommStore } from '@/store/comm'
import { request } from '@/utils/network'
import utils from '@/utils/utils'
import { toast } from '@/utils/app'
import { cache } from '@/utils/network'
import defaultAvatar from '@/assets/img/avatar.png'

const router = useRouter()

// 存储
const store = {
  comm: useCommStore()
}

// 响应式数据
const loading = ref(false)
const hotArticles = ref([])
const tagList = ref([])
const isDarkMode = ref(false)
const commentList = ref([])
const commentLoading = ref(false)
const levelLoading = ref(false)
const levelRankList = ref([])
const tagLoading = ref(false)
const signLoading = ref(false)
const hasSigned = ref(false)
const signDays = ref(0)

// 用户统计数据
const userStats = ref({
  articleCount: 0,
  collectCount: 0,
  likeCount: 0
})
const statsLoading = ref(false)

// 快速导航数据（从配置中读取）
const quickNavs = computed(() => {
  return store.comm.siteInfo.quick_navs || [
    { id: 1, name: '归档', icon: 'bi bi-archive', url: '/archive' },
    { id: 2, name: '分类', icon: 'bi bi-folder', url: '/category/travel' },
    { id: 3, name: '标签', icon: 'bi bi-tags', url: '/tags' },
    { id: 4, name: '友链', icon: 'bi bi-link-45deg', url: '/links' },
    { id: 5, name: '关于', icon: 'bi bi-info-circle', url: '/about' },
    { id: 6, name: '留言', icon: 'bi bi-chat-left-dots', url: '/message' }
  ]
})

// 人生倒计时数据计算
const countdownData = computed(() => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const currentDayOfMonth = now.getDate()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  // 获取本月总天数
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate()
  
  // 今日已过去小时数
  const todayHours = currentHour
  const todayPercent = (todayHours / 24) * 100
  
  // 本周已过去天数 (周一为第一天)
  const weekDays = currentDayOfWeek - 1
  const weekPercent = (weekDays / 7) * 100
  
  // 本月已过去天数
  const monthDays = currentDayOfMonth - 1
  const monthPercent = (monthDays / lastDayOfMonth) * 100
  
  // 本年已过去月数
  const yearMonths = currentMonth - 1
  const yearPercent = (yearMonths / 12) * 100
  
  return {
    todayHours,
    todayPercent,
    weekDays,
    weekPercent,
    monthDays,
    monthPercent,
    monthTotalDays: lastDayOfMonth,
    yearMonths,
    yearPercent
  }
})

// 图片缓存
const imageCache = new Set()

// Intersection Observer 用于图片懒加载
let observer = null

// 初始化Intersection Observer
const initIntersectionObserver = () => {
  if (!('IntersectionObserver' in window)) {
    // 浏览器不支持 IntersectionObserver，回退到立即加载
    loadAllImages()
    return
  }

  // 根据屏幕尺寸动态调整rootMargin
  const screenHeight = window.innerHeight
  const rootMarginValue = `${Math.min(screenHeight * 0.3, 200)}px 0px ${Math.min(screenHeight * 0.3, 200)}px 0px`

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
    
    // 限制同时加载的图片数量，避免网络拥塞
    const batchSize = 3
    for (let i = 0; i < Math.min(imagesToLoad.length, batchSize); i++) {
      const img = imagesToLoad[i]
      // 开始加载实际图片
      img.src = img.dataset.src
      img.classList.add('lazy-loading')
      observer.unobserve(img)
    }
    
    // 剩余图片延迟加载
    if (imagesToLoad.length > batchSize) {
      setTimeout(() => {
        for (let i = batchSize; i < imagesToLoad.length; i++) {
          const img = imagesToLoad[i]
          img.src = img.dataset.src
          img.classList.add('lazy-loading')
          observer.unobserve(img)
        }
      }, 100)
    }
  }, {
    rootMargin: rootMarginValue, // 动态调整预加载区域
    threshold: 0.01, // 只要有1%的区域可见就开始加载
    root: null // 使用默认根元素（视口）
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
        return rect.top < window.innerHeight + 200 && rect.bottom > -100
      })
      
      // 先观察可视区域内的图片
      visibleImages.forEach(img => {
        if (observer) {
          observer.observe(img)
          img.dataset.observed = 'true'
        }
      })
      
      // 延迟观察其他图片，减少初始加载压力
      setTimeout(() => {
        const remainingImages = Array.from(lazyImages).filter(img => !img.dataset.observed)
        remainingImages.forEach(img => {
          if (observer) {
            observer.observe(img)
            img.dataset.observed = 'true'
          }
        })
      }, 200)
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

// 图片加载成功处理
const onImageLoad = (event) => {
  const img = event.target
  const src = img.src
  
  // 添加到缓存
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
    if (img.src !== defaultAvatar) {
      img.src = defaultAvatar
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

// 检测深色模式
const detectDarkMode = () => {
  const pageDark = document.documentElement.classList.contains('dark')
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDarkMode.value = pageDark || systemDark
}

// 等级数据
const levelInfo = ref(null)

// 等级计算缓存
const levelCache = new Map()

// 根据经验值计算等级
// 现在使用后端返回的等级数据来动态计算
const calculateLevel = (exp) => {
  // 检查缓存
  if (levelCache.has(exp)) {
    return levelCache.get(exp)
  }
  
  // 如果没有等级数据，使用默认逻辑
  if (!levelInfo.value || !levelInfo.value.data || !levelInfo.value.data.data) {
    // 默认每100经验值一级
    const level = Math.floor(exp / 100)
    levelCache.set(exp, level)
    return level
  }
  
  // 从后端返回的等级数据中获取等级阈值
  const levelData = levelInfo.value.data.data
  
  // 检查levelData是否是数组
  if (!Array.isArray(levelData)) {
    // 如果不是数组，使用默认逻辑
    const level = Math.floor(exp / 100)
    levelCache.set(exp, level)
    return level
  }
  
  // 按经验值阈值从高到低排序
  const sortedLevels = [...levelData].sort((a, b) => b.exp - a.exp)
  
  // 找到用户当前经验值对应的最高等级
  for (const level of sortedLevels) {
    if (exp >= level.exp) {
      levelCache.set(exp, level.value)
      return level.value
    }
  }
  
  // 如果没有找到匹配的等级，使用默认逻辑计算等级
  // 这样即使后端返回的数据不完整，也能够正确计算等级
  const level = Math.floor(exp / 100)
  levelCache.set(exp, level)
  return level
}

// 导航方法
const goToArticle = (articleId, commentType = 'unknown') => {
  // 根据评论类型决定跳转路径
  if (commentType === 'article') {
    // 文章评论：跳转到文章详情页
    router.push(`/archives/${articleId}`);
  } else if (commentType === 'page') {
    // 页面评论：跳转到页面
    router.push(`/${articleId}`);
  } else {
    // 未知类型：使用原有逻辑
    // 检查 articleId 是否为正整数
    const numArticleId = Number(articleId);
    const isPositiveNumber = !isNaN(numArticleId) && numArticleId > 0;
    
    if (isPositiveNumber) {
      // 如果是正整数，跳转到文章详情页
      router.push(`/archives/${articleId}`);
    } else if (articleId && articleId !== '0') {
      // 如果是字符串或 0，跳转到独立页面
      router.push(`/${articleId}`);
    }
  }
}
const goToAuthor = (authorId) => router.push(`/author/${authorId}`)

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const timestamp = typeof time === 'number' && time.toString().length === 10 
    ? time 
    : Math.floor(new Date(time).getTime() / 1000)
  const now = new Date()
  const diff = now - new Date(timestamp * 1000)
  const dayDiff = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (dayDiff === 0) {
    const hourDiff = Math.floor(diff / (1000 * 60 * 60))
    if (hourDiff > 0) return `${hourDiff}小时前`
    const minDiff = Math.floor(diff / (1000 * 60))
    return minDiff > 0 ? `${minDiff}分钟前` : '刚刚'
  } else if (dayDiff <= 7) return `${dayDiff}天前`
  else return utils.timeToDate(timestamp, 'Y-m-d')
}

// 获取等级数据
const getLevelInfo = async () => {
  try {
    // 缓存键
    const cacheKey = 'sidebar_level_info'
    const cacheExpire = 60 * 60 // 缓存1小时

    // 尝试从缓存获取
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      levelInfo.value = cachedData
      return
    }

    const res = await request.get('/api/level/all', {
      page: 1,
      limit: 20
    })
    if (res.code === 200) {
      levelInfo.value = res
      // 缓存数据
      cache.set(cacheKey, res, cacheExpire)
    }
  } catch (error) {
    // console.error('获取等级数据失败:', error)
  }
}

// 接口请求方法
const getHotArticles = async () => {
  try {
    const cacheKey = 'sidebar_hot_articles'
    const cacheExpire = 30 // 缓存30分钟
    
    // 尝试从缓存获取
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      hotArticles.value = cachedData
      return
    }
    
    loading.value = true
    // 只获取已审核的文章
    const response = await request.get('/api/article/all', { 
      page: 1, 
      limit: 5, 
      order: 'views desc', 
      cache: true,
      where: { audit: 1 }
    })
    if (response.code === 200) {
      hotArticles.value = response.data.data || []
      // 缓存数据
      cache.set(cacheKey, hotArticles.value, cacheExpire)
    }
  } catch (error) {
    // console.error('获取热门文章失败：', error)
    hotArticles.value = []
  } finally {
    loading.value = false
  }
}

const getLevelRank = async () => {
  try {
    const cacheKey = 'sidebar_level_rank'
    const cacheExpire = 15 // 缓存15分钟
    
    // 尝试从缓存获取
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      levelRankList.value = cachedData
      return
    }
    
    levelLoading.value = true
    // 优先获取有经验值的用户，按经验值降序排序
    const response = await request.get('/api/users/all', { 
      page: 1, 
      limit: 20, // 减少获取的数据量，提高性能
      order: 'exp desc', // 优先按经验值排序，确保获取有经验值的用户
      cache: true 
    })
    if (response.code === 200) {
      // 按等级值排序，等级值基于用户当前经验值计算
      const users = response.data.data || []
      levelRankList.value = users
        // 过滤掉经验值为0或null的用户，优先显示有经验值的用户
        .filter(user => (user.exp || 0) > 0)
        .sort((a, b) => {
          // 根据用户当前经验值计算等级
          const levelA = calculateLevel(a.exp || 0)
          const levelB = calculateLevel(b.exp || 0)
          
          // 先按等级值排序
          if (levelB !== levelA) {
            return levelB - levelA // 降序排序
          }
          // 等级相同则按经验值排序
          return (b.exp || 0) - (a.exp || 0)
        })
        .slice(0, 5) // 取前5名
      
      // 缓存数据
      cache.set(cacheKey, levelRankList.value, cacheExpire)
    }
  } catch (error) {
    // console.error('获取等级排行失败：', error)
    levelRankList.value = []
  } finally {
    levelLoading.value = false
  }
}

const getTagList = async () => {
  try {
    const cacheKey = 'sidebar_tag_list'
    const cacheExpire = 60 // 缓存60分钟
    
    // 尝试从缓存获取
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      tagList.value = cachedData
      return
    }
    
    tagLoading.value = true
    const response = await request.get('/api/tags/all', {
      page: 1,
      limit: 40,
      order: 'create_time desc',
      cache: true
    })
    if (response.code === 200) {
      tagList.value = response.data.data || []
      // 缓存数据
      cache.set(cacheKey, tagList.value, cacheExpire)
    }
  } catch (error) {
    // console.error('获取标签云失败：', error)
    tagList.value = []
  } finally {
    tagLoading.value = false
  }
}

const getLatestComments = async () => {
  try {
    const cacheKey = 'sidebar_latest_comments'
    const cacheExpire = 10 // 缓存10分钟
    
    // 尝试从缓存获取
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      commentList.value = cachedData
      return
    }
    
    commentLoading.value = true
    const response = await request.get('/api/comment/all', {
      page: 1,
      limit: 5,
      order: 'create_time desc',
      cache: true
    })

    if (response.code === 200) {
      commentList.value = (response.data.data || []).map(item => {
        // 检查评论类型（文章还是页面）
        const isArticle = item.result?.article || false
        const isPage = item.result?.page || false
        
        // 确定评论类型
        let commentType = 'unknown'
        if (isArticle) {
          commentType = 'article'
        } else if (isPage) {
          commentType = 'page'
        }
        
        // 确定文章标题
        let title = '未知文章'
        if (isArticle && item.result.article.title) {
          title = item.result.article.title
        } else if (isPage && item.result.page.title) {
          title = item.result.page.title
        }
        
        // 确定跳转ID
        let jumpId = item.bind_id
        // 对于页面评论，使用页面的 key 而不是 id
        if (isPage && item.result.page.key) {
          jumpId = item.result.page.key
        }
        
        return {
          id: item.id,
          avatar: item.result?.author?.avatar || '',
          author: item.result?.author?.nickname || '匿名用户',
          content: item.content || '',
          time: formatTime(item.create_time),
          articleId: jumpId, // 使用正确的跳转ID
          articleTitle: title,
          commentType: commentType // 添加评论类型
        }
      })
      
      // 缓存数据
      cache.set(cacheKey, commentList.value, cacheExpire)
    }
  } catch (error) {
    // console.error('获取最新评论失败：', error)
    commentList.value = []
  } finally {
    commentLoading.value = false
  }
}

// 获取用户文章数量
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
    // console.error('获取文章数量失败:', error)
    return 0
  }
}

// 获取用户收藏数量
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
    // console.error('获取收藏数量失败:', error)
    return 0
  }
}

// 获取用户点赞数量
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
    // console.error('获取点赞数量失败:', error)
    return 0
  }
}

// 初始化用户统计数据
const initUserStats = async () => {
  if (!store.comm.login.finish || !store.comm.login.user) return
  
  const userId = store.comm.login.user.id
  const cacheKey = `user_stats_${userId}`
  const cacheExpire = 10 // 缓存10分钟
  
  // 尝试从缓存获取
  const cachedData = cache.get(cacheKey)
  if (cachedData) {
    userStats.value = cachedData
    return
  }
  
  statsLoading.value = true
  try {
    const [articleCount, collectCount, likeCount] = await Promise.all([
      getArticleCount(userId),
      getCollectCount(userId),
      getLikeCount(userId)
    ])
    
    userStats.value = {
      articleCount,
      collectCount,
      likeCount
    }
    
    // 缓存数据
    cache.set(cacheKey, userStats.value, cacheExpire)
    
    // console.log('用户统计数据:', userStats.value)
  } catch (error) {
    // console.error('初始化用户统计数据失败:', error)
  } finally {
    statsLoading.value = false
  }
}

const doSign = async () => {
  if (!store.comm.login.finish || !store.comm.login.user) {
    toast.warning('请先登录')
    return
  }
  
  if (hasSigned.value) {
    toast.info('今日已签到')
    return
  }
  
  try {
    signLoading.value = true
    const response = await request.post('/api/exp/check-in')
    
    if (response.code === 200) {
      hasSigned.value = true
      signDays.value += 1
      toast.success(`签到成功！获得 ${response.data?.exp || 10} 点经验`)
      // 刷新等级排行
      getLevelRank()
    } else {
      toast.error(response.msg || '签到失败')
    }
  } catch (error) {
    // console.error('签到失败：', error)
    toast.error('网络异常，签到失败')
  } finally {
    signLoading.value = false
  }
}

// 监听深色模式变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectDarkMode)

// 组件挂载
onMounted(() => {
  detectDarkMode()
  // 初始化Intersection Observer
  initIntersectionObserver()
  
  Promise.all([
    getHotArticles(),
    getLevelRank(),
    getTagList(),
    getLatestComments(),
    initUserStats(),
    getLevelInfo()
  ]).then(() => {
    // 数据加载完成后观察图片
    setTimeout(observeLazyImages, 100)
  }).catch(err => console.error('数据加载失败：', err))
})
</script>

<style scoped>
/* 卡片基础样式增强 */
.card {
  border: 1px solid var(--bs-border-color);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  background-color: var(--bs-card-bg);
}

.card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  border-bottom: 1px solid var(--bs-border-color);
  background-color: var(--bs-card-header-bg);
  border-radius: calc(0.5rem - 1px) calc(0.5rem - 1px) 0 0;
  padding: 0.75rem 1rem;
}

.card-body {
  padding: 1rem;
  background-color: var(--bs-card-bg);
  border-radius: 0 0 calc(0.5rem - 1px) calc(0.5rem - 1px);
}

/* 卡片标题样式 */
.card-header h6 {
  display: flex;
  align-items: center;
  margin: 0;
  font-weight: 600;
  color: var(--bs-heading-color);
}

.card-header h6 i {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.card-header h6 span {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--bs-heading-color);
}

/* 按钮样式 */
.sidebar-btn {
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.sidebar-btn:hover {
  background-color: var(--bs-secondary-bg);
}

.sidebar-btn:active {
  transform: translateY(0);
}

.sidebar-btn-icon {
  width: 2rem;
  height: 2rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  color: var(--bs-secondary);
}

.sidebar-btn-icon:hover {
  background-color: var(--bs-secondary-bg);
}

.user-avatar {
  width: 80px;
  height: 80px;
  border: 3px solid var(--bs-white);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.user-nickname {
  font-size: 1rem;
  font-weight: 600;
}

.user-bio {
  font-size: 0.875rem;
  line-height: 1.4;
  max-height: 3rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  display: box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  box-orient: vertical;
}

.user-stats {
  margin-top: 1rem;
}

.user-stat-label {
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  margin-top: 0.25rem;
}

/* 签到按钮样式 */
.sign-btn {
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.sign-btn:hover:not(:disabled) {
  background-color: var(--bs-secondary-bg);
}

.sign-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.sign-days {
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

/* 活跃度排行样式 */
.rank-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background-color: var(--bs-secondary);
  color: var(--bs-white);
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.rank-badge-top {
  background-color: var(--bs-dark);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.rank-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--bs-white);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.sidebar-progress {
  border-radius: 0.25rem;
  background-color: var(--bs-tertiary-bg);
}

.sidebar-progress .progress-bar {
  border-radius: 0.25rem;
}

/* 热门文章样式 */
.article-rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--bs-white);
}

.article-rank-badge-top {
  background-color: var(--bs-dark);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.article-rank-badge-other {
  background-color: var(--bs-secondary);
}

.article-title {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: block;
}

.article-meta {
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
}

/* 最新评论样式 */
.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--bs-white);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.comment-content {
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--bs-body-color);
  max-height: 3.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  display: box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  box-orient: vertical;
}

.comment-article-link {
  font-size: 0.75rem;
}

/* 标签云样式 */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0;
  align-items: center;
  justify-content: flex-start;
}

.tag-item {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background-color: var(--bs-secondary-bg);
  color: var(--bs-body-color);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 1.5rem;
  text-decoration: none;
  border: 1px solid var(--bs-border-color);
  transition: all 0.2s ease;
}

.tag-item:hover {
  background-color: var(--bs-dark);
  color: var(--bs-white);
  border-color: var(--bs-dark);
}

/* 人生倒计时样式 */
.countdown-container {
  display: flex;
  flex-direction: column;
}

.countdown-item {
  position: relative;
}

.countdown-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--bs-body-color);
  display: flex;
  align-items: center;
}

.countdown-label i {
  font-size: 1rem;
  margin-right: 0.25rem;
}

.countdown-value {
  font-size: 0.875rem;
  color: var(--bs-emphasis-color);
}

.countdown-percent {
  font-size: 0.75rem;
}

.sidebar-progress {
  border-radius: 0.25rem;
  background-color: var(--bs-tertiary-bg);
  overflow: hidden;
}

.sidebar-progress .progress-bar {
  border-radius: 0.25rem;
  transition: width 0.3s ease;
}

.bg-gradient {
  background-image: linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
}

/* 倒计时颜色 */
.bg-primary {
  background-color: #0d6efd;
}

.bg-success {
  background-color: #198754;
}

.bg-warning {
  background-color: #ffc107;
  color: #000;
}

.bg-danger {
  background-color: #dc3545;
}

/* 深色模式倒计时适配 */
.dark-mode .bg-warning {
  background-color: #f0a500;
  color: #000;
}

/* 快捷导航样式 */
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--bs-border-color);
  text-decoration: none;
  color: var(--bs-body-color);
  min-height: 80px;
  transition: all 0.2s ease;
  background-color: var(--bs-card-bg);
}

.cursor-pointer {
  cursor: pointer;
}

.nav-item:hover {
  background-color: var(--bs-secondary-bg);
  border-color: var(--bs-secondary);
}

.nav-item-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--bs-secondary);
  transition: all 0.2s ease;
}

.nav-item:hover .nav-item-icon {
  color: var(--bs-dark);
}

.nav-item-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--bs-body-color);
  transition: all 0.2s ease;
}

.nav-item:hover .nav-item-name {
  color: var(--bs-dark);
  font-weight: 600;
}

/* 列表样式 */
.sidebar-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-list-item {
  padding: 0.75rem;
  border-radius: 0.375rem;
  background-color: var(--bs-secondary-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.sidebar-list-item:hover {
  background-color: var(--bs-secondary-bg);
  border-color: var(--bs-border-color);
}

.sidebar-list-item-top {
  background-color: var(--bs-secondary-bg);
  border-left: 3px solid var(--bs-dark);
}

.sidebar-article-item {
  padding: 0.75rem;
  border-radius: 0.375rem;
  background-color: var(--bs-secondary-bg);
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.sidebar-article-item:hover {
  background-color: var(--bs-secondary-bg);
  border-color: var(--bs-border-color);
}

.sidebar-article-item .flex-grow-1 {
  min-width: 0;
  width: 100%;
}

.sidebar-article-item h6.article-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: block;
  transition: color 0.2s ease;
}

.sidebar-article-item:hover h6.article-title {
  color: var(--bs-dark);
}

.sidebar-comment-item {
  padding: 0.75rem;
  border-radius: 0.375rem;
  background-color: var(--bs-secondary-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.sidebar-comment-item:hover {
  background-color: var(--bs-secondary-bg);
  border-color: var(--bs-border-color);
}

.sidebar-comment-item:hover .comment-content {
  color: var(--bs-dark);
  transition: color 0.2s ease;
}

/* 加载和空状态样式 */
.spinner-sm {
  width: 1.25rem;
  height: 1.25rem;
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--bs-secondary-color);
}



/* 头像容器样式 */
.avatar-container {
  position: relative;
  display: inline-block;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0.75rem;
  pointer-events: none;
}

.avatar-status {
  position: absolute;
  bottom: -4px;
  right: -4px;
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

/* 深色模式动画 */
@keyframes pulse-dark {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.7);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.9);
  }
}

/* 懒加载图片样式 */
.lazy-img {
  transition: all 0.3s ease;
}

.lazy-loading {
  filter: blur(8px);
  opacity: 0.6;
  transform: scale(0.95);
}

.lazy-loaded {
  filter: blur(0);
  opacity: 1;
  transform: scale(1);
  animation: fadeIn 0.6s ease-out;
}

.lazy-error {
  background: linear-gradient(135deg, #e9ecef, #dee2e6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #868e96;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sidebar-container {
    padding: 0.5rem 0;
  }
  
  /* 卡片样式调整 */
  .card {
    margin-bottom: 0.75rem;
  }
  
  .card-header h6 {
    font-size: 0.875rem;
    padding: 0.375rem 0;
  }
  
  .card-header h6 i {
    font-size: 1rem;
    margin-right: 0.5rem;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  /* 头像大小调整 */
  .user-avatar {
    width: 64px;
    height: 64px;
  }
  
  .rank-avatar {
    width: 40px;
    height: 40px;
  }
  
  .comment-avatar {
    width: 32px;
    height: 32px;
  }
  
  /* 字体大小调整 */
  .user-nickname {
    font-size: 0.9rem;
  }
  
  .user-bio {
    font-size: 0.8rem;
  }
  
  .article-title {
    font-size: 0.8rem;
  }
  
  .comment-content {
    font-size: 0.8rem;
  }
  
  /* 按钮调整 */
  .sidebar-btn {
    font-size: 0.8rem;
    padding: 0.5rem;
  }
  
  .sign-btn {
    font-size: 0.8rem;
  }
  
  /* 快捷导航调整 */
  .nav-item {
    min-height: 70px;
    padding: 0.5rem;
  }
  
  .nav-item-icon {
    font-size: 1.25rem;
  }
  
  .nav-item-name {
    font-size: 0.7rem;
  }
  
  /* 列表项调整 */
  .sidebar-list-item {
    padding: 0.625rem;
  }
  
  .sidebar-article-item {
    padding: 0.625rem;
  }
  
  .sidebar-comment-item {
    padding: 0.625rem;
  }
  
  /* 标签云调整 */
  .tag-item {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
  }
  
  /* 响应式头像状态指示器 */
  .avatar-status {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }
  
  /* 等级排行调整 */
  .rank-badge {
    width: 1rem;
    height: 1rem;
    font-size: 0.65rem;
  }
  
  /* 热门文章排行调整 */
  .article-rank-badge {
    width: 24px;
    height: 24px;
    font-size: 0.65rem;
  }
  
  /* 触摸目标优化 */
  .sidebar-btn, .nav-item, .sidebar-list-item, .tag-item {
    min-height: 44px;
    display: flex;
    align-items: center;
  }
}

/* 骨架加载器样式 */
.skeleton-loader {
  background: linear-gradient(90deg, var(--bs-secondary-bg) 25%, var(--bs-tertiary-bg) 50%, var(--bs-secondary-bg) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 0.25rem;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 深色模式适配 */
.dark-mode {
  border-color: var(--bs-border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.dark-mode .sidebar-list-item {
  background-color: var(--bs-secondary-bg);
}

.dark-mode .sidebar-list-item-top {
  background-color: var(--bs-secondary-bg);
  border-left-color: var(--bs-light);
}

.dark-mode .sidebar-article-item,
.dark-mode .sidebar-comment-item {
  background-color: var(--bs-secondary-bg);
}

.dark-mode .tag-item {
  background-color: var(--bs-secondary-bg);
  border-color: var(--bs-border-color);
}

.dark-mode .nav-item {
  border-color: var(--bs-border-color);
}

.dark-mode .nav-item:hover {
  background-color: var(--bs-tertiary-bg);
}

.dark-mode .skeleton-loader {
  background: linear-gradient(90deg, var(--bs-secondary-bg) 25%, var(--bs-tertiary-bg) 50%, var(--bs-secondary-bg) 75%);
  background-size: 200% 100%;
}

/* 深色模式下的头像状态指示器 */
.dark-mode .avatar-status {
  border-color: var(--bs-secondary-bg) !important;
}

.dark-mode .avatar-status.online {
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.7);
  animation: pulse-dark 2s infinite;
}
</style>