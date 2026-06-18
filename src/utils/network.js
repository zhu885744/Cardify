import axios from 'axios'
import utils from '@/utils/utils'

const DEV = import.meta.env.DEV
const DEFAULT_TIMEOUT = 60 * 1000
const MAX_RETRY = 2

const axiosInstance = axios.create({
  timeout: DEFAULT_TIMEOUT,
  withCredentials: false,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=utf-8'
  }
})

class Cache {
  constructor() {
    this.testKey = '__cache_test__'
  }

  isAvailable() {
    try {
      localStorage.setItem(this.testKey, 'test')
      localStorage.removeItem(this.testKey)
      return true
    } catch {
      return false
    }
  }

  isValidKey(key) {
    return typeof key === 'string' && key.trim() !== ''
  }

  has(key) {
    return !utils.is.empty(this.get(key))
  }

  get(key) {
    if (!this.isValidKey(key) || !this.isAvailable()) {
      return null
    }

    const rawValue = localStorage.getItem(key)
    if (rawValue === null || rawValue === '') {
      this.del(key)
      return null
    }

    try {
      const parsed = JSON.parse(rawValue)
      
      if (this.isExpiredCache(parsed)) {
        this.del(key)
        return null
      }

      return parsed.data !== undefined ? parsed.data : parsed
    } catch (error) {
      return rawValue || null
    }
  }

  isExpiredCache(cacheData) {
    return cacheData && 
           typeof cacheData === 'object' && 
           cacheData.expire && 
           Date.now() > cacheData.expire
  }

  set(key, value, minutes = 0) {
    if (!this.isValidKey(key) || !this.isAvailable()) {
      return
    }

    const storeValue = value === undefined ? null : value
    
    let dataToStore = storeValue
    const expireMinutes = Number(minutes)
    
    if (!isNaN(expireMinutes) && expireMinutes > 0) {
      dataToStore = {
        data: storeValue,
        expire: Date.now() + expireMinutes * 60 * 1000
      }
    }

    try {
      localStorage.setItem(key, JSON.stringify(dataToStore))
    } catch (error) {
    }
  }

  setItem(key, value, minutes = 0) {
    return this.set(key, value, minutes)
  }

  getItem(key) {
    return this.get(key)
  }

  del(key) {
    if (!this.isValidKey(key) || !this.isAvailable()) {
      return
    }
    localStorage.removeItem(key)
  }

  removeItem(key) {
    return this.del(key)
  }

  clear() {
    if (!this.isAvailable()) {
      return
    }
    localStorage.clear()
  }

  setMultiple(items) {
    if (!Array.isArray(items) || !this.isAvailable()) {
      return false
    }

    let success = true
    items.forEach(({ key, value, minutes = 0 }) => {
      try {
        this.set(key, value, minutes)
      } catch {
        success = false
      }
    })
    
    return success
  }

  getMultiple(keys) {
    if (!Array.isArray(keys) || !this.isAvailable()) {
      return {}
    }

    const result = {}
    keys.forEach(key => {
      if (this.isValidKey(key)) {
        result[key] = this.get(key)
      }
    })
    
    return result
  }

  delMultiple(keys) {
    if (!Array.isArray(keys) || !this.isAvailable()) {
      return false
    }

    keys.forEach(key => {
      if (this.isValidKey(key)) {
        this.del(key)
      }
    })
    
    return true
  }

  keys() {
    if (!this.isAvailable()) {
      return []
    }
    return Object.keys(localStorage)
  }

  size() {
    if (!this.isAvailable()) {
      return 0
    }
    return localStorage.length
  }

  clearExpired() {
    if (!this.isAvailable()) {
      return 0
    }

    let clearedCount = 0
    const keys = this.keys()
    
    keys.forEach(key => {
      const value = localStorage.getItem(key)
      if (value) {
        try {
          const parsed = JSON.parse(value)
          if (this.isExpiredCache(parsed)) {
            this.del(key)
            clearedCount++
          }
        } catch {
        }
      }
    })
    
    return clearedCount
  }

  replace(key, value, minutes = 0) {
    const oldValue = this.get(key)
    this.set(key, value, minutes)
    return oldValue
  }

  memoize(key, callback, minutes = 0) {
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }
    
    const result = callback()
    this.set(key, result, minutes)
    return result
  }
}

const cache = new Cache()

let baseURL = DEV ? '' : ''

const initBaseURL = async () => {
  if (!DEV) {
    try {
      const { get } = await import('@/utils/app')
      const api_uri = await get('api_uri')
      if (api_uri) {
        baseURL = api_uri
        axiosInstance.defaults.baseURL = api_uri
      }
    } catch (error) {
    }
  }
}

initBaseURL()

const logRequest = (method, url, data) => {
  if (DEV) {
    console.log(`[Request] ${method.toUpperCase()} ${url}`, data || '')
  }
}

const logResponse = (method, url, data, status) => {
  if (DEV) {
    console.log(`[Response] ${method.toUpperCase()} ${url} [${status}]`, data || '')
  }
}

const logError = (method, url, error) => {
  console.error(`[Request Error] ${method.toUpperCase()} ${url}`, error)
}

const handleError = (error) => {
  const response = error.response
  const message = response?.data?.msg || response?.statusText || error.message || '请求失败'
  
  const errorInfo = {
    code: response?.status || -1,
    message,
    data: response?.data,
    url: error.config?.url
  }
  
  return Promise.reject(errorInfo)
}

const createCancelToken = () => {
  return axios.CancelToken.source()
}

const isRetryable = (error) => {
  if (error?.response) {
    const status = error.response.status
    return status >= 500 || status === 429
  }
  return error?.code === 'ECONNABORTED' || !error?.response
}

const requestWithRetry = async (method, url, dataOrParams, options = {}) => {
  let attempts = 0
  let lastError = null
  
  while (attempts <= MAX_RETRY) {
    try {
      const cancelToken = createCancelToken()
      const requestConfig = {
        baseURL: options.baseURL || baseURL,
        cancelToken: cancelToken.token,
        ...options
      }

      if (!DEV && !requestConfig.baseURL) {
        throw new Error('请在配置文件中设置后端API地址（api_uri）')
      }

      logRequest(method, url, dataOrParams)
      
      let response
      switch (method.toLowerCase()) {
        case 'get':
        case 'delete':
          response = await axiosInstance[method](url, { params: dataOrParams, ...requestConfig })
          break
        case 'post':
        case 'put':
        case 'patch':
          response = await axiosInstance[method](url, dataOrParams, requestConfig)
          break
        default:
          throw new Error(`不支持的请求方法: ${method}`)
      }

      logResponse(method, url, response, response.status)
      return response.data
      
    } catch (error) {
      lastError = error
      attempts++
      
      if (error?.code === 'ERR_CANCELED') {
        throw error
      }

      if (attempts > MAX_RETRY || !isRetryable(error)) {
        logError(method, url, error)
        return handleError(error)
      }

      const delay = Math.pow(2, attempts) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return handleError(lastError)
}

axiosInstance.interceptors.request.use(
  async axiosConfig => {
    try {
      const { getSync } = await import('@/utils/app')
      const apiKey = getSync('api_key') || globalThis?.inis?.api?.key
      if (!utils.is.empty(apiKey)) {
        axiosConfig.headers['i-api-key'] = apiKey
      }

      const TOKEN_NAME = getSync('token_name') || globalThis?.inis?.token_name || 'INIS_LOGIN_TOKEN'
      if (utils.has.cookie(TOKEN_NAME)) {
        const token = utils.get.cookie(TOKEN_NAME)
        if (!utils.is.empty(token)) {
          axiosConfig.headers.Authorization = token
        }
      }

      axiosConfig.headers['X-CSRF-Token'] = utils.get.cookie('csrf_token') || ''
      
      axiosConfig.headers['X-App-Version'] = '1.0.0'
      
      if (!axiosConfig.url || !axiosConfig.url.startsWith('/api/')) {
        console.warn(`[Security] 请求路径不合法: ${axiosConfig.url}`)
      }

    } catch (error) {
    }

    return axiosConfig
  },
  error => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  async response => {
    const responseData = response.data
    if (responseData?.code === 401) {
      const TOKEN_NAME = getSync('token_name') || globalThis?.inis?.token_name || 'INIS_LOGIN_TOKEN'
      cache.del('user-info')
      utils.clear.cookie(TOKEN_NAME)
      
      try {
        await axios.delete('/api/comm/logout', { withCredentials: true })
      } catch (err) {
        console.error('登出接口调用失败：', err)
      }
      
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
      
      return Promise.reject({
        code: 401,
        message: responseData?.msg || '登录已过期，请重新登录！',
        data: responseData?.data,
        url: response.config?.url
      })
    }
    return response
  },
  async error => {
    const response = error.response
    if (response?.status === 401 || response?.data?.code === 401) {
      const TOKEN_NAME = getSync('token_name') || globalThis?.inis?.token_name || 'INIS_LOGIN_TOKEN'
      cache.del('user-info')
      utils.clear.cookie(TOKEN_NAME)
      
      try {
        await axios.delete('/api/comm/logout', { withCredentials: true })
      } catch (err) {
        console.error('登出接口调用失败：', err)
      }
      
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
      
      return Promise.reject({
        code: 401,
        message: response?.data?.msg || '登录已过期，请重新登录！',
        data: response?.data,
        url: error.config?.url
      })
    }
    return Promise.reject(error)
  }
)

const request = {
  get: async (url, params = {}, options = {}) => {
    return requestWithRetry('get', url, params, options)
  },

  delete: async (url, params = {}, options = {}) => {
    return requestWithRetry('delete', url, params, options)
  },

  put: async (url, data = {}, options = {}) => {
    return requestWithRetry('put', url, data, options)
  },

  post: async (url, data = {}, options = {}) => {
    return requestWithRetry('post', url, data, options)
  },

  patch: async (url, data = {}, options = {}) => {
    return requestWithRetry('patch', url, data, options)
  },

  all: async (array) => {
    if (!DEV && !baseURL) {
      return Promise.reject(new Error('请在配置文件中设置后端API地址（api_uri）'))
    }
    return axios.all(array)
  },

  createCancelToken,

  getBaseURL: () => baseURL,

  setBaseURL: (url) => {
    baseURL = url
    axiosInstance.defaults.baseURL = url
  },

  axios: axiosInstance
}

const uploadImage = async (callback) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  input.addEventListener('change', async () => {
    if (!input.files || input.files.length === 0) {
      return
    }

    const params = new FormData()
    params.append('file', input.files[0])

    try {
      const { code, msg, data } = await request.post('/api/file/upload', params, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (code !== 200) {
        return
      }
      
      if (typeof callback === 'function') {
        callback(data.path)
      }
    } catch (error) {
    } finally {
      input.value = ''
    }
  })

  input.click()
}

export { cache, request, uploadImage }

export default { cache, request, uploadImage }
