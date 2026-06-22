import * as bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { useTitle as useVueUseTitle } from '@vueuse/core'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import utils from '@/utils/utils'
import router from '@/router/index.js'
import { request, cache, uploadImage } from '@/utils/network'
import { useCommStore } from '@/store/comm'

const DEV = import.meta.env.DEV

let cachedConfig = null

const getConfigSync = (key, defaultValue = null) => {
  const localKey = `inis_theme_config_${key}`
  const localValue = localStorage.getItem(localKey)
  if (localValue !== null) {
    try {
      return JSON.parse(localValue)
    } catch {
      return localValue
    }
  }
  
  const envKey = `VITE_${key.toUpperCase()}`
  if (import.meta.env[envKey] !== undefined) {
    return import.meta.env[envKey]
  }

  if (cachedConfig && cachedConfig[key] !== undefined) {
    return cachedConfig[key]
  }

  return defaultValue
}

const getConfig = async (key, defaultValue = null) => {
  const localKey = `inis_theme_config_${key}`
  const localValue = localStorage.getItem(localKey)
  if (localValue !== null) {
    try {
      return JSON.parse(localValue)
    } catch {
      return localValue
    }
  }
  
  const envKey = `VITE_${key.toUpperCase()}`
  if (import.meta.env[envKey] !== undefined) {
    return import.meta.env[envKey]
  }

  if (cachedConfig && cachedConfig[key] !== undefined) {
    return cachedConfig[key]
  }

  return defaultValue
}

const setConfig = (key, value) => {
  const localKey = `inis_theme_config_${key}`
  if (value === null || value === undefined) {
    localStorage.removeItem(localKey)
  } else {
    localStorage.setItem(localKey, JSON.stringify(value))
  }
  if (cachedConfig) {
    cachedConfig[key] = value
  }
}

const initConfig = () => {
  cachedConfig = {
    title: import.meta.env.VITE_TITLE || '',
    api_uri: import.meta.env.VITE_API_URI || '',
    router_mode: import.meta.env.VITE_ROUTER_MODE || 'hash',
    base_url: import.meta.env.VITE_BASE_URL || '/',
    api_key: import.meta.env.VITE_API_KEY || '',
    token_name: import.meta.env.VITE_TOKEN_NAME || '',
    lazy_time: parseInt(import.meta.env.VITE_LAZY_TIME) || 500
  }
}

initConfig()

const getAllConfig = () => {
  return cachedConfig || {}
}

const config = {
  get: getConfig,
  getSync: getConfigSync,
  set: setConfig,
  getAll: getAllConfig,
}

class Channel {
  constructor(name = 'default') {
    this.channelName = this.normalizeChannelName(name)
    this.listeners = new Map()
    this.onceListeners = new Map()
    this.isClosed = false
    this.messageQueue = []
    this.initChannel()
    this.bindUnloadHandler()
  }

  normalizeChannelName(name) {
    if (typeof name === 'string') {
      const trimmed = name.trim()
      return trimmed || 'default'
    }
    return 'default'
  }

  initChannel() {
    try {
      if (!window.BroadcastChannel) {
        this.bc = null
        this.isClosed = true
        return
      }
      
      this.bc = new BroadcastChannel(this.channelName)
      this.bc.onmessage = this.handleMessage.bind(this)
      this.bc.onmessageerror = this.handleError.bind(this)
    } catch (error) {
      this.bc = null
      this.isClosed = true
    }
  }

  bindUnloadHandler() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.close()
      })
    }
  }

  handleMessage(event) {
    if (!event?.data || this.isClosed) return
    
    const { type = 'message', data, timestamp = Date.now() } = event.data
    
    const listeners = this.listeners.get(type) || []
    const onceListeners = this.onceListeners.get(type) || []
    
    listeners.forEach(callback => {
      try {
        callback(data, { type, timestamp, channel: this.channelName })
      } catch (error) {
      }
    })
    
    onceListeners.forEach(callback => {
      try {
        callback(data, { type, timestamp, channel: this.channelName })
      } catch (error) {
      }
    })
    
    if (onceListeners.length > 0) {
      this.onceListeners.delete(type)
    }
  }

  handleError(event) {
  }

  on(typeOrCallback, callback) {
    if (this.isClosed) {
      return () => {}
    }
    
    let type, handler
    
    if (typeof typeOrCallback === 'function') {
      type = 'message'
      handler = typeOrCallback
    } else {
      type = typeOrCallback || 'message'
      handler = callback
    }
    
    if (typeof handler !== 'function') {
      return () => {}
    }
    
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type).push(handler)
    
    return () => this.off(type, handler)
  }

  once(typeOrCallback, callback) {
    if (this.isClosed) return () => {}
    
    let type, handler
    
    if (typeof typeOrCallback === 'function') {
      type = 'message'
      handler = typeOrCallback
    } else {
      type = typeOrCallback || 'message'
      handler = callback
    }
    
    if (typeof handler !== 'function') return () => {}
    
    if (!this.onceListeners.has(type)) {
      this.onceListeners.set(type, [])
    }
    this.onceListeners.get(type).push(handler)
    
    return () => {
      const listeners = this.onceListeners.get(type)
      if (listeners) {
        const index = listeners.indexOf(handler)
        if (index > -1) listeners.splice(index, 1)
      }
    }
  }

  off(typeOrCallback, callback) {
    let type, handler
    
    if (typeof typeOrCallback === 'function') {
      type = 'message'
      handler = typeOrCallback
    } else {
      type = typeOrCallback || 'message'
      handler = callback
    }
    
    if (!handler) {
      this.listeners.delete(type)
      this.onceListeners.delete(type)
      return true
    }
    
    const listeners = this.listeners.get(type)
    if (listeners) {
      const index = listeners.indexOf(handler)
      if (index > -1) {
        listeners.splice(index, 1)
        if (listeners.length === 0) {
          this.listeners.delete(type)
        }
        return true
      }
    }
    
    const onceListeners = this.onceListeners.get(type)
    if (onceListeners) {
      const index = onceListeners.indexOf(handler)
      if (index > -1) {
        onceListeners.splice(index, 1)
        if (onceListeners.length === 0) {
          this.onceListeners.delete(type)
        }
        return true
      }
    }
    
    return false
  }

  emit(data, type = 'message') {
    if (this.isClosed) {
      return false
    }
    
    if (!this.bc) {
      this.messageQueue.push({ type, data, timestamp: Date.now() })
      return false
    }
    
    try {
      const message = {
        type: type || 'message',
        data,
        timestamp: Date.now(),
        channel: this.channelName,
        source: 'channel'
      }
      
      this.bc.postMessage(message)
      return true
    } catch (error) {
      return false
    }
  }

  close() {
    if (this.isClosed) return
    
    this.isClosed = true
    this.listeners.clear()
    this.onceListeners.clear()
    this.messageQueue = []
    
    if (this.bc) {
      try {
        this.bc.close()
      } catch (error) {
      }
      this.bc = null
    }
  }

  static create(name = 'default') {
    return new Channel(name)
  }

  static isSupported() {
    return typeof window !== 'undefined' && !!window.BroadcastChannel
  }
}

const defaultChannel = Channel.create('default')
const channel = defaultChannel

const createRouteWrapper = (method) => {
  return function(options, { beforeHandle, afterHandle } = {}) {
    if (utils.is.empty(options)) {
      return Promise.reject(new Error('路由跳转参数不能为空'))
    }

    let removeBeforeEach, removeAfterEach

    if (beforeHandle) {
      removeBeforeEach = router.beforeEach((to, from, next) => {
        beforeHandle(to, from)
        next()
        removeBeforeEach()
      })
    }

    if (afterHandle) {
      removeAfterEach = router.afterEach((to, from) => {
        afterHandle(to, from)
        removeAfterEach()
      })
    }

    return new Promise((resolve, reject) => {
      router[method](options)
        .then(() => resolve())
        .catch((err) => {
          if (err.message?.includes('Avoided redundant navigation to current location')) {
            resolve()
          } else {
            reject(err)
          }
        })
    })
  }
}

const push = createRouteWrapper('push')
const replace = createRouteWrapper('replace')

const goBack = (step = 1) => {
  return new Promise((resolve) => {
    if (window.history.length <= 1) {
      push('/').then(() => resolve())
    } else {
      router.go(-step)
      resolve()
    }
  })
}

const getCurrentRoute = () => {
  return router.currentRoute.value
}

const getRouteParams = () => {
  return getCurrentRoute().params || {}
}

const getRouteQuery = () => {
  return getCurrentRoute().query || {}
}

const getRouteMeta = () => {
  return getCurrentRoute().meta || {}
}

const isRouteActive = (path) => {
  return router.currentRoute.value.path === path
}

const getRouteHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('router_history') || '[]')
  } catch {
    return []
  }
}

const clearRouteHistory = () => {
  localStorage.removeItem('router_history')
}

const redirectWithQuery = (path, query = {}) => {
  return push({ path, query })
}

const redirectWithParams = (name, params = {}) => {
  return push({ name, params })
}

const route = {
  push,
  replace,
  goBack,
  getCurrentRoute,
  getRouteParams,
  getRouteQuery,
  getRouteMeta,
  isRouteActive,
  getRouteHistory,
  clearRouteHistory,
  redirectWithQuery,
  redirectWithParams
}

const menuConfig = {
  hasIcon: true,
  iconType: 'svg-icon',
  menuWidth: 140,
  customClass: 'dark-howdy-menu scale-up-top-left',
  menuWrapperCss: {
    background: '#0b0b0bcc',
    borderRadius: '8px',
    padding: '5px 4px',
    boxShadow: '#00000080 0 10px 30px',
    lineColor: 'rgba(255,255,255,.1)',
    lineMargin: '5px 10px',
    backdropFilter: 'blur(10px)',
  },
  menuItemCss: {
    arrowSize: '10px',
    iconFontSize: '18px',
    labelColor: '#FFF',
    hoverLabelColor: '#FFF',
    iconColor: '#ffffff00',
    arrowColor: '#ffffff00'
  },
  menuList: [],
}

const getMenuList = async () => {
  return []
}

const menu = {
  config: menuConfig,
  getMenuList
}

const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

const TYPE_CONFIG = {
  [MESSAGE_TYPES.INFO]: {
    bgClass: '',
    iconClass: 'bi-info-circle text-info'
  },
  [MESSAGE_TYPES.SUCCESS]: {
    bgClass: '',
    iconClass: 'bi-check-circle text-success'
  },
  [MESSAGE_TYPES.WARNING]: {
    bgClass: '',
    iconClass: 'bi-exclamation-triangle text-warning'
  },
  [MESSAGE_TYPES.ERROR]: {
    bgClass: '',
    iconClass: 'bi-x-circle text-danger'
  }
}

class ToastManager {
  constructor() {
    this.container = null
    this.toasts = new Map()
    this.idCounter = 0
  }

  ensureContainer() {
    if (this.container) return this.container
    
    this.container = document.createElement('div')
    this.container.className = 'toast-container position-fixed bottom-0 end-0 p-3'
    this.container.style.zIndex = '9999'
    document.body.appendChild(this.container)
    
    return this.container
  }

  getIconByType(type) {
    return TYPE_CONFIG[type]?.iconClass || TYPE_CONFIG.info.iconClass
  }

  getTitleByType(type) {
    const titles = {
      [MESSAGE_TYPES.INFO]: '信息',
      [MESSAGE_TYPES.SUCCESS]: '成功',
      [MESSAGE_TYPES.WARNING]: '警告',
      [MESSAGE_TYPES.ERROR]: '错误'
    }
    return titles[type] || '通知'
  }

  show({ message = '', type = MESSAGE_TYPES.INFO, title = '', duration = 3000, closable = true }) {
    if (!message) return { id: null, close: () => {} }

    const container = this.ensureContainer()
    const id = `toast_${++this.idCounter}`
    
    const iconClass = this.getIconByType(type)
    const defaultTitle = title || this.getTitleByType(type)
    
    const toastHtml = `
      <div class="toast" id="${id}" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="true" data-bs-delay="${duration}">
        <div class="toast-header">
          <i class="${iconClass} me-2"></i>
          <strong class="me-auto">${defaultTitle}</strong>
          ${closable ? '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="关闭"></button>' : ''}
        </div>
        <div class="toast-body">${message}</div>
      </div>
    `
    
    container.insertAdjacentHTML('beforeend', toastHtml)
    
    const toastElement = document.getElementById(id)
    const toast = new bootstrap.Toast(toastElement)
    
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove()
      this.toasts.delete(id)
    })
    
    toast.show()
    this.toasts.set(id, { element: toastElement, toast })
    
    return {
      id,
      close: () => {
        if (this.toasts.has(id)) {
          toast.hide()
        }
      }
    }
  }

  info(message, options = {}) {
    return this.show({ ...options, message, type: MESSAGE_TYPES.INFO })
  }

  success(message, options = {}) {
    return this.show({ ...options, message, type: MESSAGE_TYPES.SUCCESS })
  }

  warning(message, options = {}) {
    return this.show({ ...options, message, type: MESSAGE_TYPES.WARNING })
  }

  error(message, options = {}) {
    return this.show({ ...options, message, type: MESSAGE_TYPES.ERROR })
  }
}

const toast = new ToastManager()

const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return ''
  
  let timestamp = parseInt(date)
  if (!isNaN(timestamp) && timestamp < 10000000000) {
    timestamp *= 1000
  }
  
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ''
  
  const now = Date.now()
  const date = new Date(timestamp)
  const time = date.getTime()
  
  if (isNaN(time)) return ''
  
  const diff = now - time
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  
  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  if (weeks < 4) return `${weeks}周前`
  if (months < 12) return `${months}月前`
  return `${years}年前`
}

const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0'
  
  const n = Number(num)
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + suffix
}

const escapeHtml = (text) => {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

const stripHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}

const formatters = {
  formatDate,
  formatRelativeTime,
  formatNumber,
  truncateText,
  escapeHtml,
  stripHtml
}

const validateComment = (content, options = {}) => {
  const { minLength = 1, maxLength = 1000 } = options
  
  if (!content || !content.trim()) {
    return { valid: false, message: '评论内容不能为空' }
  }
  
  const trimmed = content.trim()
  
  if (trimmed.length < minLength) {
    return { valid: false, message: `评论内容不能少于 ${minLength} 个字符` }
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, message: `评论内容不能超过 ${maxLength} 个字符` }
  }
  
  return { valid: true, message: '' }
}

const validateUsername = (username) => {
  if (!username || !username.trim()) {
    return { valid: false, message: '用户名不能为空' }
  }
  
  if (username.length < 2) {
    return { valid: false, message: '用户名至少需要2个字符' }
  }
  
  if (username.length > 20) {
    return { valid: false, message: '用户名不能超过20个字符' }
  }
  
  const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/
  if (!usernameRegex.test(username)) {
    return { valid: false, message: '用户名只能包含中文、字母、数字和下划线' }
  }
  
  return { valid: true, message: '' }
}

const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: '密码不能为空' }
  }
  
  if (password.length < 6) {
    return { valid: false, message: '密码至少需要6个字符' }
  }
  
  if (password.length > 32) {
    return { valid: false, message: '密码不能超过32个字符' }
  }
  
  return { valid: true, message: '' }
}

const validateEmail = (email) => {
  if (!email) {
    return { valid: false, message: '邮箱不能为空' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: '请输入有效的邮箱地址' }
  }
  
  return { valid: true, message: '' }
}

const checkRateLimit = (lastTime, limitSeconds = 30) => {
  if (!lastTime) return { allowed: true, remaining: 0 }
  
  const now = Date.now()
  const diff = (now - lastTime) / 1000
  
  if (diff < limitSeconds) {
    return { allowed: false, remaining: Math.ceil(limitSeconds - diff) }
  }
  
  return { allowed: true, remaining: 0 }
}

const validators = {
  validateComment,
  validateUsername,
  validatePassword,
  validateEmail,
  checkRateLimit
}

const usePageTitle = () => {
  const route = useRoute()
  const title = useVueUseTitle('')
  
  const baseTitle = computed(() => {
    // 优先从 store.siteInfo 读取站点标题，兜底使用配置或默认值
    const store = useCommStore()
    const storeTitle = store?.siteInfo?.title
    return storeTitle || getConfigSync('title') || 'Xiao-INIS'
  })
  
  const fullTitle = computed(() => {
    const pageTitle = route.meta.title || route.name || '未知页面'
    return `${pageTitle} - ${baseTitle.value}`
  })
  
  const setTitle = (newTitle) => {
    title.value = newTitle
  }
  
  watch(
    () => route.path,
    () => {
      setTitle(fullTitle.value)
    },
    { immediate: true }
  )
  
  const setDynamicTitle = (dynamicTitle, appendBase = true) => {
    if (appendBase) {
      setTitle(`${dynamicTitle} - ${baseTitle.value}`)
    } else {
      setTitle(dynamicTitle)
    }
  }
  
  const resetTitle = () => {
    setTitle(fullTitle.value)
  }
  
  return {
    title,
    fullTitle,
    baseTitle,
    setTitle,
    setDynamicTitle,
    resetTitle
  }
}

const setupRouteTitle = (router) => {
  router.beforeEach((to, from, next) => {
    if (to.path !== from.path) {
      // 优先从 store.siteInfo 读取站点标题，兜底使用配置或默认值
      const store = useCommStore()
      const storeTitle = store?.siteInfo?.title
      const siteTitle = storeTitle || getConfigSync('title') || 'Xiao-INIS'
      const pageTitle = to.meta.title || to.name || '未知页面'
      document.title = `${pageTitle} - ${siteTitle}`
    }
    next()
  })
}

const usePageTitleUtil = {
  usePageTitle,
  setupRouteTitle
}

const log = (...args) => {
  if (DEV) {
    console.log('[Init]', new Date().toLocaleTimeString(), ...args)
  }
}

const logError = (...args) => {
  console.error('[Init Error]', new Date().toLocaleTimeString(), ...args)
}

const init = async (app) => {
  try {
    const [bootstrapModule, fancyboxModule, apiModule] = await Promise.all([
      import('bootstrap/dist/js/bootstrap.bundle.min.js'),
      import('@fancyapps/ui/dist/fancybox/'),
      import('@/api')
    ])
    
    const { default: bootstrap } = bootstrapModule
    const { Fancybox } = fancyboxModule
    const { default: API } = apiModule
    
    if (typeof window !== 'undefined' && bootstrap) {
      window.bootstrap = bootstrap
    }
    
    if (API) {
      app.config.globalProperties.$api = API
    }
    
    if (Fancybox) {
      window.Fancybox = Fancybox
      
      setTimeout(() => {
        Fancybox.bind("[data-fancybox]", {
          Hash: false,
          Thumbs: { autoStart: false }
        })
      }, 100)
    }
    
    return { API, Fancybox }
  } catch (error) {
    return {}
  }
}

const setupSiteInfo = async (commStore) => {
  try {
    await commStore.fetchSiteInfo()
    
    if (commStore.siteInfo?.favicon && typeof window !== 'undefined') {
      const favicon = document.querySelector('link[rel="icon"]')
      if (favicon) {
        favicon.href = commStore.siteInfo.favicon
      }
    }
    
    const htmlElement = document.documentElement
    htmlElement.setAttribute('data-bs-theme', commStore.isDarkMode ? 'dark' : 'light')
    
    return true
  } catch (error) {
    return false
  }
}

const app = {
  config,
  channel: defaultChannel,
  Channel,
  route,
  menu,
  toast,
  formatters,
  validators,
  usePageTitle: usePageTitleUtil,
  init,
  setupSiteInfo,
  MESSAGE_TYPES,
  request,
  cache,
  uploadImage
}

export {
  config,
  getConfig as get,
  getConfigSync as getSync,
  channel,
  Channel,
  route,
  menu,
  toast,
  formatters,
  validators,
  usePageTitle,
  setupRouteTitle,
  init,
  setupSiteInfo,
  MESSAGE_TYPES,
  log,
  logError,
  checkRateLimit,
  validateComment,
  validateUsername,
  validatePassword,
  validateEmail,
  request,
  cache,
  uploadImage
}

export default app
