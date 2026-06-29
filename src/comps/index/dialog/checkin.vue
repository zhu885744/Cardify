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
                <button class="nav-link" :class="{ active: state.activeTab === 'rank' }" @click="switchTab('rank')">
                  <i class="bi bi-trophy me-1"></i>签到排行榜
                </button>
              </li>
            </ul>

            <div v-show="state.activeTab === 'checkin'" class="checkin-panel">
              <div class="checkin-status-card">
                <div class="checkin-status-icon" :class="{ checked: state.checkinStatus.checked }">
                  <i :class="state.checkinStatus.checked ? 'bi bi-check-circle-fill' : 'bi bi-calendar-check'"></i>
                </div>
                <div class="checkin-status-info">
                  <div class="checkin-status-title">
                    {{ state.checkinStatus.checked ? '今日已签到' : '今日未签到' }}
                  </div>
                  <div class="checkin-status-desc">
                    {{ state.checkinStatus.checked ? `已获得 ${state.checkinStatus.value} 经验值` : '每日签到获得10经验值' }}
                  </div>
                </div>
              </div>

              <div class="checkin-stats">
                <div class="checkin-stat-item">
                  <div class="checkin-stat-value">{{ state.checkinStatus.streak || 0 }}</div>
                  <div class="checkin-stat-label">连续签到[天]</div>
                </div>
                <div class="checkin-stat-item">
                  <div class="checkin-stat-value">{{ state.checkinStatus.value || 0 }}</div>
                  <div class="checkin-stat-label">今日获得[经验]</div>
                </div>
              </div>

              <button
                class="checkin-btn"
                :class="{ disabled: state.loading || state.checkinStatus.checked }"
                :disabled="state.loading || state.checkinStatus.checked"
                @click="performCheckin"
              >
                <span v-if="state.loading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-calendar-check"></i>
                <span v-if="state.loading">签到中...</span>
                <span v-else-if="state.checkinStatus.checked">今日已签到</span>
                <span v-else>立即签到</span>
              </button>
            </div>

            <div v-show="state.activeTab === 'rank'" class="rank-panel">
              <div class="rank-tabs">
                <button
                  v-for="item in timeRangeOptions"
                  :key="item.key"
                  class="rank-tab"
                  :class="{ active: state.timeRange === item.key }"
                  @click="switchTimeRange(item.key)"
                >{{ item.label }}</button>
              </div>

              <div v-if="state.rankLoading" class="rank-loading">
                <div class="spinner-border spinner-border-sm"></div>
                <span>加载中...</span>
              </div>
              <div v-else-if="state.rankList.length === 0" class="rank-empty">
                <i class="bi bi-trophy"></i>
                <p>暂无排行数据</p>
              </div>
              <div v-else class="rank-list">
                <div
                  v-for="(item, index) in state.rankList"
                  :key="item.id || index"
                  class="rank-item"
                  :class="{ top: index < 3 }"
                >
                  <div class="rank-num" :class="`rank-${item.rank}`">
                    <span v-if="item.rank <= 3">
                      <i class="bi" :class="getRankIcon(item.rank)"></i>
                    </span>
                    <span v-else>{{ item.rank }}</span>
                  </div>
                  <div class="rank-avatar">
                    <img :src="item.avatar || '/default-avatar.png'" :alt="item.nickname" />
                  </div>
                  <div class="rank-info">
                    <span class="rank-name">{{ item.nickname || '匿名用户' }}</span>
                    <span class="rank-stats">
                      <i class="bi bi-calendar-check"></i>{{ item.check_in_count || 0 }}次
                      <i class="bi bi-star ms-2"></i>{{ item.total_exp || 0 }}经验
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
  rankList: [],
  rankLoading: false,
  checkinStatus: {
    checked: false,
    value: 0,
    check_in_time: 0,
    streak: 0,
    today: 0
  }
})

const getRankIcon = (rank) => {
  const icons = {
    1: 'bi-trophy-fill',
    2: 'bi-award-fill',
    3: 'bi-award-fill',
  }
  return icons[rank] || 'bi-circle'
}

const show = () => {
  state.visible = true
  state.activeTab = 'checkin'
  state.rankList = []

  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'

  loadCheckinStatus()
}

const hide = () => {
  state.visible = false

  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
}

const switchTab = (tab) => {
  state.activeTab = tab

  if (tab === 'rank' && state.rankList.length === 0) {
    loadRankList()
  }
}

const switchTimeRange = (key) => {
  state.timeRange = key
  state.rankList = []
  loadRankList()
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

const loadCheckinStatus = async () => {
  try {
    const { code, data } = await request.get('/api/exp/check-in-status')
    if (code === 200 && data) {
      state.checkinStatus = {
        checked: data.checked || false,
        value: data.value || 0,
        check_in_time: data.check_in_time || 0,
        streak: data.streak || 0,
        today: data.today || 0
      }
    }
  } catch (error) {
    // 静默处理
  }
}

const performCheckin = async () => {
  if (state.loading || state.checkinStatus.checked) return

  try {
    state.loading = true
    const { code, data, msg } = await request.post('/api/exp/check-in')

    if (code === 200 && data) {
      toast.success(`签到成功！获得 ${data.value} 经验值`)
      state.checkinStatus.checked = true
      state.checkinStatus.value = data.value || 10
      state.checkinStatus.streak = (state.checkinStatus.streak || 0) + 1
    } else if (code === 202) {
      toast.info(msg || '今日已签到')
      state.checkinStatus.checked = true
    } else {
      toast.error(msg || '签到失败')
    }
  } catch (error) {
    toast.error('签到失败，请稍后重试')
  } finally {
    state.loading = false
  }
}

const loadRankList = async () => {
  try {
    state.rankLoading = true
    const { start, end } = getTimeRange()

    const params = {}
    if (start !== undefined) params.start = start
    if (end !== undefined) params.end = end

    const { code, data } = await request.get('/api/exp/check-in-rank', params)

    if (code === 200 && data) {
      state.rankList = Array.isArray(data) ? data : (data.data || [])
    }
  } catch (error) {
    // 静默处理
  } finally {
    state.rankLoading = false
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

.checkin-btn {
  width: 100%;
  padding: 14px 24px;
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

.checkin-status-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bs-tertiary-bg);
  border-radius: 12px;
  margin-bottom: 20px;
}

.checkin-status-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--bs-primary), #6c5ce7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
}

.checkin-status-icon.checked {
  background: linear-gradient(135deg, var(--bs-success), #00b894);
}

.checkin-status-info {
  flex: 1;
}

.checkin-status-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--bs-body-color);
  margin-bottom: 4px;
}

.checkin-status-desc {
  font-size: 0.875rem;
  color: var(--bs-secondary-color);
}

.checkin-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.checkin-stat-item {
  text-align: center;
  padding: 16px;
  background: var(--bs-tertiary-bg);
  border-radius: 10px;
}

.checkin-stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--bs-primary);
  margin-bottom: 4px;
}

.checkin-stat-label {
  font-size: 0.8rem;
  color: var(--bs-secondary-color);
}

.rank-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.rank-tab {
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

.rank-tab:hover {
  border-color: var(--bs-primary);
  color: var(--bs-primary);
}

.rank-tab.active {
  border-color: var(--bs-primary);
  background: var(--bs-primary);
  color: white;
}

.rank-loading,
.rank-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: var(--bs-secondary-color);
}

.rank-loading {
  flex-direction: row;
  gap: 8px;
}

.rank-empty i {
  font-size: 2rem;
  margin-bottom: 12px;
}

.rank-list {
  max-height: 400px;
  overflow-y: auto;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--bs-tertiary-bg);
  margin-bottom: 8px;
}

.rank-item.top {
  background: linear-gradient(135deg, rgba(var(--bs-warning-rgb), 0.1), rgba(var(--bs-primary-rgb), 0.05));
}

.rank-num {
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

.rank-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.rank-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rank-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.rank-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--bs-body-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-stats {
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.rank-stats i {
  font-size: 0.625rem;
}

[data-bs-theme="dark"] .checkin-btn:not(.disabled) {
  background: linear-gradient(135deg, var(--bs-primary), #8b5cf6);
}

[data-bs-theme="dark"] .rank-item.top {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(var(--bs-primary-rgb), 0.1));
}
</style>