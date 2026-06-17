<!-- 账号安全设置组件 -->
<template>
  <div class="account-security-settings">
    <div v-if="loading" class="space-y-4">
      <!-- 密码设置骨架 -->
      <div class="card">
        <div class="card-body">
          <div class="skeleton-loader" style="height: 20px; width: 60%; margin-bottom: 1.5rem;"></div>
          <div class="space-y-4">
            <div class="space-y-2">
              <div class="skeleton-loader" style="height: 16px; width: 30%;"></div>
              <div class="skeleton-loader" style="height: 40px; width: 100%;"></div>
            </div>
            <div class="space-y-2">
              <div class="skeleton-loader" style="height: 16px; width: 30%;"></div>
              <div class="skeleton-loader" style="height: 40px; width: 100%;"></div>
            </div>
            <div class="space-y-2">
              <div class="skeleton-loader" style="height: 16px; width: 30%;"></div>
              <div class="skeleton-loader" style="height: 40px; width: 100%;"></div>
            </div>
            <div class="space-y-2">
              <div class="skeleton-loader" style="height: 16px; width: 30%;"></div>
              <div class="skeleton-loader" style="height: 40px; width: 100%;"></div>
            </div>
            <div class="skeleton-loader" style="height: 40px; width: 30%;"></div>
          </div>
        </div>
      </div>

      <!-- 安全提示骨架 -->
      <div class="card">
        <div class="card-body">
          <div class="skeleton-loader" style="height: 20px; width: 60%; margin-bottom: 1.5rem;"></div>
          <div class="space-y-3">
            <div class="skeleton-loader" style="height: 40px; width: 100%;"></div>
            <div class="skeleton-loader" style="height: 40px; width: 100%;"></div>
            <div class="skeleton-loader" style="height: 40px; width: 100%;"></div>
            <div class="skeleton-loader" style="height: 40px; width: 100%;"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="row">
      <!-- 账号设置 -->
      <div class="col-md-12">
        <div class="card mb-4">
          <div class="card-body">
            <h6 class="card-title mb-3">账号设置</h6>
            <form @submit.prevent="handleAccountSubmit">
              <!-- 当前账号显示 -->
              <div class="mb-3">
                <label class="form-label">当前账号</label>
                <div class="input-group">
                  <input 
                    type="text" 
                    class="form-control"
                    :value="currentAccount"
                    disabled
                  >
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary"
                    @click="toggleAccountEdit"
                    :disabled="accountLoading"
                  >
                    <i class="bi bi-pencil me-1"></i>{{ showAccountEdit ? '取消' : '修改' }}
                  </button>
                </div>
              </div>

              <!-- 修改账号表单 -->
              <div v-if="showAccountEdit" class="mt-3 p-3 border rounded bg-body-secondary">
                <h6 class="mb-3 text-danger">
                  <i class="bi bi-exclamation-triangle me-2"></i>修改账号后将影响登录，请谨慎操作
                </h6>
                
                <!-- 新账号 -->
                <div class="mb-3 mt-1">
                  <label for="newAccount" class="form-label">新账号</label>
                  <input 
                    type="text" 
                    id="newAccount" 
                    v-model="accountForm.newAccount" 
                    class="form-control"
                    placeholder="请输入新账号（字母、数字、下划线，4-20位）"
                    maxlength="20"
                    @input="validateNewAccount"
                  >
                  <div v-if="accountErrors.newAccount" class="text-danger small mt-1">{{ accountErrors.newAccount }}</div>
                </div>

                <!-- 提交按钮 -->
                <div class="d-flex gap-2">
                  <button 
                    type="submit" 
                    class="btn btn-danger"
                    :disabled="accountLoading"
                  >
                    <span v-if="accountLoading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-check-circle me-2"></i>
                    {{ accountLoading ? '修改中...' : '确认修改账号' }}
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary"
                    @click="cancelAccountEdit"
                    :disabled="accountLoading"
                  >
                    取消
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- 重置密码 -->
      <div class="col-md-12">
        <div class="card mb-4">
          <div class="card-body">
            <h6 class="card-title mb-3">重置密码</h6>
            <form @submit.prevent="resetPassword">
              <!-- 邮箱/手机号 -->
              <div class="mb-3">
                <label for="contactInput" class="form-label">邮箱/手机号</label>
                <input 
                  type="text" 
                  id="contactInput" 
                  v-model="resetForm.social" 
                  class="form-control"
                  placeholder="请输入您的邮箱或手机号"
                  @input="validateSocial"
                >
                <div v-if="errors.social" class="text-danger small mt-1">{{ errors.social }}</div>
              </div>

              <!-- 验证码 -->
              <div class="mb-3">
                <label for="codeInput" class="form-label">验证码</label>
                <div class="input-group">
                  <input 
                    type="text" 
                    id="codeInput" 
                    v-model="resetForm.code" 
                    class="form-control"
                    placeholder="请输入验证码"
                    @input="validateCode"
                  >
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary"
                    :disabled="countdown > 0 || loading"
                    @click="sendCode"
                  >
                    {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
                  </button>
                </div>
                <div v-if="errors.code" class="text-danger small mt-1">{{ errors.code }}</div>
              </div>

              <!-- 新密码 -->
              <div class="mb-3">
                <label for="newPassword" class="form-label">新密码</label>
                <input 
                  type="password" 
                  id="newPassword" 
                  v-model="resetForm.password" 
                  class="form-control"
                  placeholder="请输入新密码"
                  minlength="6"
                  maxlength="20"
                  @input="validatePassword"
                >
                <div v-if="errors.password" class="text-danger small mt-1">{{ errors.password }}</div>
              </div>

              <!-- 确认新密码 -->
              <div class="mb-3">
                <label for="confirmPassword" class="form-label">确认新密码</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  v-model="resetForm.verify" 
                  class="form-control"
                  placeholder="请再次输入新密码"
                  @input="validateVerify"
                >
                <div v-if="errors.verify" class="text-danger small mt-1">{{ errors.verify }}</div>
              </div>

              <!-- 密码强度提示 -->
              <div v-if="resetForm.password" class="mb-3">
                <div class="password-strength">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted small">密码强度</span>
                    <span :class="passwordStrengthClass" class="small font-medium">
                      {{ passwordStrengthText }}
                    </span>
                  </div>
                  <div class="progress" style="height: 6px;">
                    <div 
                      class="progress-bar" 
                      :class="passwordStrengthClass"
                      :style="{ width: passwordStrengthWidth }"
                      role="progressbar"
                      :aria-valuenow="passwordStrengthValue"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- 提交按钮 -->
              <button 
                type="submit" 
                class="btn btn-secondary"
                :disabled="resetLoading"
              >
                <span v-if="resetLoading" class="spinner-border spinner-border-sm me-2"></span>
                {{ resetLoading ? '重置中...' : '重置密码' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- 安全提示 -->
    <div v-if="!loading" class="card">
      <div class="card-body">
        <h6 class="card-title mb-3">安全提示</h6>
        <ul class="list-group list-group-flush">
          <li class="list-group-item">
            <i class="bi bi-shield-check text-secondary me-2"></i>
            建议使用字母、数字和特殊字符组合的密码
          </li>
          <li class="list-group-item">
            <i class="bi bi-clock-history text-secondary me-2"></i>
            定期更换密码，建议每3个月更换一次
          </li>
          <li class="list-group-item">
            <i class="bi bi-exclamation-triangle text-secondary me-2"></i>
            不要在多个网站使用相同的密码
          </li>
          <li class="list-group-item">
            <i class="bi bi-lock text-secondary me-2"></i>
            不要将密码告诉他人，包括网站客服
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { request } from '@/utils/network'
import { toast } from '@/utils/app'
import { useCommStore } from '@/store/comm'

const store = useCommStore()

// 加载状态
const loading = ref(true)
const resetLoading = ref(false)
const accountLoading = ref(false)

// 账号修改相关状态
const showAccountEdit = ref(false)
const currentAccount = ref('')

// 账号修改表单数据
const accountForm = reactive({
  newAccount: ''
})

// 账号修改错误信息
const accountErrors = reactive({
  newAccount: ''
})

// 重置密码表单数据
const resetForm = reactive({
  social: '',
  code: '',
  password: '',
  verify: ''
})

// 错误信息
const errors = reactive({
  social: '',
  code: '',
  password: '',
  verify: ''
})

// 验证状态
const valid = reactive({
  social: false,
  code: false,
  password: false,
  verify: false
})

// 倒计时
const countdown = ref(0)
let countdownTimer = null

// 验证码防刷缓存
const getCacheKey = (type, contact) => {
  return `verify-code-${type}-${contact}`
}

const getDailyLimitKey = (type, contact) => {
  return `verify-code-daily-${type}-${contact}`
}

// 检查是否可以发送验证码
const canSendCode = (type, contact) => {
  // 检查时间间隔
  const cacheKey = getCacheKey(type, contact)
  const lastSendTime = localStorage.getItem(cacheKey)
  if (lastSendTime) {
    const timeDiff = Date.now() - parseInt(lastSendTime)
    if (timeDiff < 60 * 1000) {
      return false
    }
  }
  
  // 检查每日发送上限
  const dailyLimitKey = getDailyLimitKey(type, contact)
  const dailyCount = localStorage.getItem(dailyLimitKey)
  if (dailyCount && parseInt(dailyCount) >= 10) {
    return false
  }
  
  return true
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  
  // 清除之前的定时器
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

// 记录发送验证码
const recordSendCode = (type, contact) => {
  // 记录发送时间
  const cacheKey = getCacheKey(type, contact)
  localStorage.setItem(cacheKey, Date.now().toString())
  
  // 记录每日发送次数
  const dailyLimitKey = getDailyLimitKey(type, contact)
  const currentCount = localStorage.getItem(dailyLimitKey) || '0'
  const newCount = parseInt(currentCount) + 1
  localStorage.setItem(dailyLimitKey, newCount.toString())
  
  // 设置每日计数过期时间（24小时后）
  setTimeout(() => {
    localStorage.removeItem(dailyLimitKey)
  }, 24 * 60 * 60 * 1000)
}

// 验证邮箱/手机号
const validateSocial = () => {
  const social = resetForm.social
  if (!social) {
    errors.social = '请输入邮箱或手机号'
    valid.social = false
    return
  }
  
  const isPhone = /^1[3-9]\d{9}$/.test(social)
  const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(social)
  
  if (!isPhone && !isEmail) {
    errors.social = '请输入正确的邮箱或手机号'
    valid.social = false
    return
  }
  
  errors.social = ''
  valid.social = true
}

// 验证验证码
const validateCode = () => {
  const code = resetForm.code
  if (!code) {
    errors.code = '请输入验证码'
    valid.code = false
    return
  }
  
  if (code.length < 4) {
    errors.code = '验证码长度不足'
    valid.code = false
    return
  }
  
  errors.code = ''
  valid.code = true
}

// 验证密码
const validatePassword = () => {
  const password = resetForm.password
  if (!password) {
    errors.password = '请输入新密码'
    valid.password = false
    return
  }
  
  if (password.length < 6) {
    errors.password = '密码长度不能少于6位'
    valid.password = false
    return
  }
  
  errors.password = ''
  valid.password = true
  validateVerify()
}

// 验证确认密码
const validateVerify = () => {
  const verify = resetForm.verify
  if (!verify) {
    errors.verify = '请确认新密码'
    valid.verify = false
    return
  }
  
  if (verify !== resetForm.password) {
    errors.verify = '两次输入的密码不一致'
    valid.verify = false
    return
  }
  
  errors.verify = ''
  valid.verify = true
}

// 密码强度计算
const calculatePasswordStrength = (password) => {
  if (!password) return 0
  
  let strength = 0
  
  // 长度检查
  if (password.length >= 8) strength += 25
  else if (password.length >= 6) strength += 15
  
  // 包含数字
  if (/\d/.test(password)) strength += 25
  
  // 包含小写字母
  if (/[a-z]/.test(password)) strength += 25
  
  // 包含大写字母或特殊字符
  if (/[A-Z]/.test(password) || /[^a-zA-Z0-9]/.test(password)) strength += 25
  
  return Math.min(strength, 100)
}

// 密码强度值
const passwordStrengthValue = computed(() => {
  return calculatePasswordStrength(resetForm.password)
})

// 密码强度宽度
const passwordStrengthWidth = computed(() => {
  return `${passwordStrengthValue.value}%`
})

// 密码强度文本
const passwordStrengthText = computed(() => {
  const strength = passwordStrengthValue.value
  if (strength < 25) return '弱'
  if (strength < 50) return '一般'
  if (strength < 75) return '良好'
  return '强'
})

// 密码强度样式类
const passwordStrengthClass = computed(() => {
  const strength = passwordStrengthValue.value
  if (strength < 25) return 'bg-danger'
  if (strength < 50) return 'bg-warning'
  if (strength < 75) return 'bg-info'
  return 'bg-success'
})

// ========== 账号修改相关函数 ==========

// 切换账号编辑状态
const toggleAccountEdit = () => {
  showAccountEdit.value = !showAccountEdit.value
  if (!showAccountEdit.value) {
    // 取消时清空表单
    resetAccountForm()
  }
}

// 取消账号编辑
const cancelAccountEdit = () => {
  showAccountEdit.value = false
  resetAccountForm()
}

// 重置账号表单
const resetAccountForm = () => {
  accountForm.newAccount = ''
  accountErrors.newAccount = ''
}

// 验证新账号
const validateNewAccount = () => {
  const account = accountForm.newAccount.trim()
  
  if (!account) {
    accountErrors.newAccount = '请输入新账号'
    return false
  }
  
  if (account.length < 4) {
    accountErrors.newAccount = '账号长度不能少于4位'
    return false
  }
  
  if (account.length > 20) {
    accountErrors.newAccount = '账号长度不能超过20位'
    return false
  }
  
  // 只允许字母、数字、下划线
  if (!/^[a-zA-Z0-9_]+$/.test(account)) {
    accountErrors.newAccount = '账号只能包含字母、数字和下划线'
    return false
  }
  
  // 不能与当前账号相同
  if (account === currentAccount.value) {
    accountErrors.newAccount = '新账号不能与当前账号相同'
    return false
  }
  
  accountErrors.newAccount = ''
  return true
}

// 处理账号修改提交
const handleAccountSubmit = async () => {
  // 验证新账号
  if (!validateNewAccount()) {
    return
  }
  
  accountLoading.value = true
  try {
    // 获取用户 ID
    const userInfo = store.getLogin.user
    if (!userInfo || !userInfo.id) {
      toast.error('用户信息获取失败，请刷新页面重试')
      return
    }
    
    // 构造请求数据
    const requestData = {
      id: userInfo.id,
      account: accountForm.newAccount.trim()
    }
    
    // 发送请求
    const { code: resCode, msg } = await request.put('/api/users/update', requestData)
    
    if (resCode === 200) {
      toast.success('账号修改成功')
      // 同步用户信息
      await syncUserInfo()
      // 关闭编辑状态并清空表单
      showAccountEdit.value = false
      resetAccountForm()
      // 更新当前账号显示
      const newUserInfo = store.getLogin.user
      currentAccount.value = newUserInfo?.account || ''
    } else {
      toast.error(msg || '账号修改失败')
    }
  } catch (error) {
    console.error('修改账号失败:', error)
    toast.error('网络异常，请稍后再试！')
  } finally {
    accountLoading.value = false
  }
}

// 同步用户信息
const syncUserInfo = async () => {
  try {
    await store.checkLoginState()
  } catch (error) {
    console.error('同步用户信息失败:', error)
  }
}

// ========== 密码重置相关函数 ==========

// 发送验证码
const sendCode = async () => {
  validateSocial()
  if (!valid.social) {
    return
  }
  
  const social = resetForm.social
  
  // 检查防刷
  if (!canSendCode('reset', social)) {
    toast.error('发送过于频繁，请60秒后再试')
    return
  }
  
  try {
    loading.value = true
    const { code: resCode, msg } = await request.post('/api/comm/reset-password', {
      social
    })
    
    if (resCode === 200 || resCode === 201) {
      toast.success(msg || '验证码发送成功！')
      recordSendCode('reset', social)
      startCountdown()
    } else {
      toast.error(msg || '发送验证码失败！')
    }
  } catch (error) {
    toast.error('网络异常，验证码发送失败！')
  } finally {
    loading.value = false
  }
}

// 重置密码
const resetPassword = async () => {
  // 手动触发验证
  validateSocial()
  validateCode()
  validatePassword()
  validateVerify()
  
  if (!valid.social || !valid.code || !valid.password || !valid.verify) {
    toast.warning('请检查表单填写是否正确')
    return
  }

  try {
    resetLoading.value = true
    const { code: resCode, msg } = await request.post('/api/comm/reset-password', {
      social: resetForm.social,
      code: resetForm.code,
      password: resetForm.password
    })

    if (resCode !== 200) {
      throw new Error(msg || '重置密码失败！')
    }

    toast.success('密码修改成功，请重新登录')
    // 清空表单
    resetForm.social = ''
    resetForm.code = ''
    resetForm.password = ''
    resetForm.verify = ''
    // 可以选择跳转到登录页重新登录
    // setTimeout(() => {
    //   store.commit('auth/LOGOUT')
    //   window.location.href = '/#/login'
    // }, 2000)

  } catch (error) {
    toast.error(error.message || '网络异常，请稍后再试！')
  } finally {
    resetLoading.value = false
  }
}

// 获取用户信息
const fetchUserInfo = () => {
  const loginState = store.getLogin
  if (loginState.user) {
    // 获取当前账号
    currentAccount.value = loginState.user.account || ''
  }
  loading.value = false
}

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo()
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>

<style scoped>
/* 自定义样式 */
.card {
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-control {
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
}

.form-control:focus {
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  border-color: var(--bs-primary);
}

.btn {
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
}

/* 表单标签 */
.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
}

/* 安全提示列表 */
.list-group-item {
  border-left: 0;
  border-right: 0;
  border-radius: 0 !important;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

.list-group-item:first-child {
  border-top: 0;
}

.list-group-item:last-child {
  border-bottom: 0;
}

/* 骨架加载器样式 */
.skeleton-loader {
  background: linear-gradient(90deg, var(--bs-tertiary-bg) 25%, rgba(255, 255, 255, 0.1) 50%, var(--bs-tertiary-bg) 75%);
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
.dark .skeleton-loader {
  background: linear-gradient(90deg, var(--bs-tertiary-bg) 25%, rgba(255, 255, 255, 0.05) 50%, var(--bs-tertiary-bg) 75%);
  background-size: 200% 100%;
}

.dark .card {
  background-color: var(--bs-dark);
  border-color: var(--bs-border-color);
}

.dark .card-title {
  color: var(--bs-light);
}

.dark .form-control {
  background-color: var(--bs-gray-800);
  border-color: var(--bs-gray-700);
  color: var(--bs-light);
}

.dark .form-control:focus {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.dark .form-control:disabled {
  background-color: var(--bs-gray-800);
  color: var(--bs-gray-400);
}

.dark .form-label {
  color: var(--bs-gray-300);
}

.dark .input-group-text {
  background-color: var(--bs-gray-700);
  border-color: var(--bs-gray-600);
  color: var(--bs-light);
}

.dark .list-group-item {
  background-color: transparent;
  border-color: var(--bs-gray-700);
  color: var(--bs-gray-300);
}

.dark .list-group-item:last-child {
  border-color: transparent;
}

.dark .text-muted {
  color: var(--bs-gray-400) !important;
}

.dark .btn-outline-secondary {
  border-color: var(--bs-gray-600);
  color: var(--bs-gray-300);
}

.dark .btn-outline-secondary:hover {
  background-color: var(--bs-gray-700);
  border-color: var(--bs-gray-500);
}

.dark .border {
  border-color: var(--bs-gray-700) !important;
}

.dark .bg-body-secondary {
  background-color: var(--bs-gray-800) !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .card-body {
    padding: 1rem;
  }
  
  .mb-4 {
    margin-bottom: 1rem !important;
  }
  
  .mb-3 {
    margin-bottom: 0.75rem !important;
  }
  
  .card-title {
    font-size: 0.9375rem;
    margin-bottom: 0.75rem !important;
  }
  
  .form-control {
    padding: 0.5rem 0.625rem;
    font-size: 0.8125rem;
  }
  
  .btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    width: 100%;
    margin-top: 0.25rem;
  }
  
  .btn + .btn {
    margin-top: 0.5rem;
  }
  
  .input-group .btn {
    margin-top: 0;
  }
  
  .list-group-item {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
  }
  
  .list-group-item i {
    font-size: 0.9em;
  }
}
</style>