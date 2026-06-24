<!-- 签到弹窗组件 -->
<template>
  <transition name="modal-fade" mode="out-in">
    <div
      v-if="state.visible"
      class="modal fade show"
      style="display: block;"
      tabindex="-1"
      aria-labelledby="checkinModalLabel"
      aria-hidden="false"
      aria-modal="true"
      id="checkinModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 480px; margin: 1.75rem auto;">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="checkinModalLabel">
              <i class="bi bi-calendar-check me-2"></i>每日签到
            </h5>
            <button type="button" class="btn-close" @click="hide()" aria-label="Close"></button>
          </div>

          <div class="modal-body">
            <ul class="nav nav-tabs nav-fill mb-3">
              <li class="nav-item">
                <button class="nav-link" :class="{ active: state.activeTab === 'checkin' }" @click="switchTab('checkin')">
                  <i class="bi bi-calendar-check me-1"></i>签到
                </button>
              </li>
              <li class="nav-item">
                <button class="nav-link" :class="{ active: state.activeTab === 'active' }" @click="switchTab('active')">
                  <i class="bi bi-trophy me-1"></i>活跃榜
                </button>
              </li>
            </ul>

            <div v-show="state.activeTab === 'checkin'" class="checkin-panel">
              <div class="checkin-wrapper">
                <div class="checkin-icon">
                  <i class="bi bi-calendar-check"></i>
                </div>
                <p class="checkin-tip">每日签到，获得经验奖励</p>
                <button
                  class="checkin-btn"
                  :class="{ disabled: state.loading }"
                  :disabled="state.loading"
                  @click="performCheckin"
                >
                  <span v-if="state.loading" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-calendar-check"></i>
                  <span v-if="state.loading">签到中...</span>
                  <span v-else>立即签到</span>
                </button>
              </div>
            </div>

            <div v-show="state.activeTab === 'active'" class="active-panel">
              <div class="active-tabs">
                <button
                  v-for="item in timeRangeOptions"
                  :key="item.key"
                  class="active-tab"
                  :class="{ active: state.timeRange === item.key }"
                  @click="switchTimeRange(item.key)"
                >{{ item.label }}</button>
              </div>

              <div v-if="state.activeLoading" class="active-loading">
                <div class="spinner-border spinner-border-sm"></div>
                <span>加载中...</span>
              </div>
              <div v-else-if="state.activeList.length === 0" class="active-empty">
                <i class="bi bi-trophy"></i>
                <p>暂无排行数据</p>
              </div>
              <div v-else class="active-list">
                <div
                  v-for="(item, index) in state.activeList"
                  :key="item.id || index"
                  class="active-item"
                  :class="{ top: index < 3 }"
                >
                  <div class="active-rank" :class="`rank-${index + 1}`">
                    <span v-if="index < 3">
                      <i class="bi" :class="getRankIcon(index + 1)"></i>
                    </span>
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <div class="active-avatar">
                    <img :src="item.avatar || '/default-avatar.png'" :alt="item.nickname" />
                  </div>
                  <div class="active-info">
                    <span class="active-name">{{ item.nickname || '匿名用户' }}</span>
                    <span class="active-stats">
                      <i class="bi bi-lightning-charge"></i>{{ item.count || 0 }}次
                      <i class="bi bi-star ms-2"></i>{{ item.exp || 0 }}经验
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <transition name="backdrop-fade">
    <div
      v-if="state.visible"
      class="modal-backdrop fade show"
      @click="hide()"
    ></div>
  </transition>
</template>

<script setup>
import { reactive, onUnmounted } from 'vue'
import { request } from '@/utils/network'
import { toast } from '@/utils/app'

const timeRangeOptions = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
]

const state = reactive({
  visible: false,
  activeTab: 'checkin',
  loading: false,
  timeRange: 'month',
  activeList: [],
  activeLoading: false,
})

const getRankIcon = (rank) => {
  const icons = {
    1: 'bi-trophy-fill',
    2: 'bi-medal-fill',
    3: 'bi-award-fill',
  }
  return icons[rank] || 'bi-circle'
}

const show = () => {
  state.visible = true
  state.activeTab = 'checkin'
  state.activeList = []

  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
}

const hide = () => {
  state.visible = false

  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
}

const switchTab = (tab) => {
  state.activeTab = tab

  if (tab === 'active' && state.activeList.length === 0) {
    loadActiveList()
  }
}

const switchTimeRange = (key) => {
  state.timeRange = key
  state.activeList = []
  loadActiveList()
}

const getTimeRange = () => {
  const now = new Date()
  let start, end

  switch (state.timeRange) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case 'week':
      const day = now.getDay() || 7
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 7, 23, 59, 59)
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      break
    case 'all':
    default:
      start = null
      end = null
      break
  }

  return {
    start: start ? Math.floor(start.getTime() / 1000) : undefined,
    end: end ? Math.floor(end.getTime() / 1000) : undefined,
  }
}

const performCheckin = async () => {
  if (state.loading) return

  try {
    state.loading = true
    const { code, data, msg } = await request.post('/api/exp/check-in')

    if (code === 200 && data) {
      toast.success(`签到成功！获得 ${data.exp} 经验值`)
    } else if (code === 202) {
      toast.info(msg || '今日已签到')
    } else {
      toast.error(msg || '签到失败')
    }
  } catch (error) {
    toast.error('签到失败，请稍后重试')
  } finally {
    state.loading = false
  }
}

const loadActiveList = async () => {
  try {
    state.activeLoading = true
    const { start, end } = getTimeRange()

    const params = {}
    if (start !== undefined) params.start = start
    if (end !== undefined) params.end = end

    const { code, data } = await request.get('/api/exp/active', params)

    if (code === 200 && data) {
      state.activeList = Array.isArray(data) ? data : (data.data || [])
    }
  } catch (error) {
    // 静默处理
  } finally {
    state.activeLoading = false
  }
}

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
})

defineExpose({ show, hide })
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

.nav-tabs {
  border-bottom: 1px solid var(--bs-border-color);
}

.nav-tabs .nav-link {
  border: none;
  color: var(--bs-secondary-color);
  font-size: 0.875rem;
  padding: 8px 12px;
  transition: all 0.2s;
}

.nav-tabs .nav-link:hover {
  color: var(--bs-primary);
}

.nav-tabs .nav-link.active {
  color: var(--bs-primary);
  border-bottom: 2px solid var(--bs-primary);
}

.checkin-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.checkin-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--bs-primary), #6c5ce7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.checkin-tip {
  font-size: 1rem;
  color: var(--bs-secondary-color);
  margin-bottom: 24px;
}

.checkin-btn {
  width: 200px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--bs-primary), #6c5ce7);
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.checkin-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--bs-primary-rgb), 0.3);
}

.checkin-btn.disabled {
  background: var(--bs-border-color);
  color: var(--bs-secondary-color);
  cursor: not-allowed;
}

.active-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.active-tab {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--bs-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--bs-secondary-color);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.active-tab:hover {
  border-color: var(--bs-primary);
  color: var(--bs-primary);
}

.active-tab.active {
  border-color: var(--bs-primary);
  background: var(--bs-primary);
  color: white;
}

.active-loading,
.active-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: var(--bs-secondary-color);
}

.active-loading {
  flex-direction: row;
  gap: 8px;
}

.active-empty i {
  font-size: 2rem;
  margin-bottom: 12px;
}

.active-list {
  max-height: 400px;
  overflow-y: auto;
}

.active-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--bs-tertiary-bg);
  margin-bottom: 8px;
}

.active-item.top {
  background: linear-gradient(135deg, rgba(var(--bs-warning-rgb), 0.1), rgba(var(--bs-primary-rgb), 0.05));
}

.active-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.rank-1 {
  color: #ffd700;
}

.rank-2 {
  color: #c0c0c0;
}

.rank-3 {
  color: #cd7f32;
}

.active-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.active-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.active-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.active-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--bs-body-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active-stats {
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.active-stats i {
  font-size: 0.625rem;
}

[data-bs-theme="dark"] .checkin-btn:not(.disabled),
[data-bs-theme="dark"] .checkin-icon {
  background: linear-gradient(135deg, var(--bs-primary), #8b5cf6);
}

[data-bs-theme="dark"] .active-item.top {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(var(--bs-primary-rgb), 0.1));
}
</style>