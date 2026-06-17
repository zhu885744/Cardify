<!-- 基础信息设置组件 -->
<template>
  <div class="basic-info-settings">
    <div v-if="loading" class="row">
      <div class="col-md-4 mb-4">
        <div class="card">
          <div class="card-body">
            <div class="skeleton-loader" style="height: 20px; width: 60%; margin-bottom: 1.5rem;"></div>
            <div class="text-center mb-4">
              <div class="skeleton-loader" style="width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 1rem;"></div>
              <div class="skeleton-loader" style="height: 36px; width: 80%; margin: 0 auto 0.5rem;"></div>
              <div class="skeleton-loader" style="height: 14px; width: 90%; margin: 0 auto;"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-8">
        <div class="card">
          <div class="card-body">
            <div class="skeleton-loader" style="height: 20px; width: 60%; margin-bottom: 1.5rem;"></div>
            <div class="space-y-4">
              <div class="skeleton-loader" style="height: 40px; width: 100%;"></div>
              <div class="space-y-2">
                <div class="skeleton-loader" style="height: 16px; width: 30%;"></div>
                <div class="d-flex gap-4">
                  <div class="skeleton-loader" style="height: 20px; width: 20%;"></div>
                  <div class="skeleton-loader" style="height: 20px; width: 20%;"></div>
                  <div class="skeleton-loader" style="height: 20px; width: 20%;"></div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="skeleton-loader" style="height: 16px; width: 30%;"></div>
                <div class="skeleton-loader" style="height: 100px; width: 100%;"></div>
              </div>
              <div class="d-flex gap-2">
                <div class="skeleton-loader" style="height: 40px; width: 30%;"></div>
                <div class="skeleton-loader" style="height: 40px; width: 30%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="row">
      <!-- 头像设置 -->
      <div class="col-md-4 mb-4">
        <div class="card">
          <div class="card-body text-center">
            <h6 class="card-title mb-3">头像设置</h6>
            <div class="avatar-upload-container mb-4">
              <div class="avatar-preview">
                <img 
                  :src="formData.avatar || defaultAvatar" 
                  :alt="formData.nickname || '用户头像'"
                  class="rounded-circle avatar-image"
                >
              </div>
            </div>
            <div class="d-flex flex-column gap-2 mb-3">
              <button 
                type="button" 
                class="btn btn-primary btn-sm"
                @click="handleUploadAvatar"
                :disabled="uploading"
              >
                <i class="bi bi-upload me-2"></i>
                {{ uploading ? '上传中...' : '上传头像' }}
              </button>
              <button 
                type="button" 
                class="btn btn-outline-secondary btn-sm"
                @click="showAvatarUrlInput = !showAvatarUrlInput"
              >
                <i class="bi bi-link-45deg me-2"></i>自定义链接
              </button>
            </div>
            <div v-if="showAvatarUrlInput" class="mb-3">
              <div class="input-group input-group-sm">
                <span class="input-group-text"><i class="bi bi-globe"></i></span>
                <input 
                  type="text" 
                  v-model="customAvatarUrl"
                  class="form-control"
                  placeholder="请输入头像图片链接"
                  @keyup.enter="applyCustomAvatar"
                >
                <button 
                  type="button" 
                  class="btn btn-outline-primary btn-sm"
                  @click="applyCustomAvatar"
                  :disabled="!customAvatarUrl.trim()"
                >
                  应用
                </button>
              </div>
            </div>
            <button 
              v-if="formData.avatar"
              type="button" 
              class="btn btn-sm btn-outline-danger w-100"
              @click="removeAvatar"
            >
              <i class="bi bi-trash me-2"></i>移除头像
            </button>
            <p class="text-muted small mt-3 mb-0">
              <i class="bi bi-info-circle me-1"></i>
              支持 JPG、PNG、GIF 格式，最大 10MB
            </p>
          </div>
        </div>
      </div>

      <!-- 基本信息表单 -->
      <div class="col-md-8">
        <div class="card">
          <div class="card-body">
            <h6 class="card-title mb-3">个人信息</h6>
            <form @submit.prevent="updateBasicInfo">
              <div class="mb-3">
                <label for="nickname" class="form-label">昵称</label>
                <input 
                  type="text" 
                  id="nickname" 
                  v-model="formData.nickname" 
                  class="form-control"
                  placeholder="请输入昵称"
                  maxlength="20"
                >
              </div>

              <div class="mb-3">
                <label class="form-label">性别</label>
                <div class="d-flex gap-4">
                  <div class="form-check">
                    <input 
                      type="radio" 
                      id="gender-boy" 
                      v-model.number="formData.gender" 
                      :value="1"
                      class="form-check-input"
                    >
                    <label for="gender-boy" class="form-check-label">男</label>
                  </div>
                  <div class="form-check">
                    <input 
                      type="radio" 
                      id="gender-girl" 
                      v-model.number="formData.gender" 
                      :value="2"
                      class="form-check-input"
                    >
                    <label for="gender-girl" class="form-check-label">女</label>
                  </div>
                  <div class="form-check">
                    <input 
                      type="radio" 
                      id="gender-none" 
                      v-model.number="formData.gender" 
                      :value="0"
                      class="form-check-input"
                    >
                    <label for="gender-none" class="form-check-label">保密</label>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label for="description" class="form-label">个人简介</label>
                <textarea 
                  id="description" 
                  v-model="formData.description" 
                  class="form-control"
                  placeholder="请输入个人简介"
                  rows="4"
                  maxlength="200"
                ></textarea>
                <div class="text-end text-muted small mt-1">
                  {{ formData.description.length }}/200
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">联系方式</label>
                <div class="row">
                  <div class="col-md-6 mb-2">
                    <div class="input-group input-group-contact">
                      <span class="input-group-text"><i class="bi bi-telephone"></i></span>
                      <input 
                        type="text" 
                        class="form-control" 
                        :value="userContact.phone || '未设置'" 
                        disabled
                      >
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="input-group input-group-contact">
                      <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                      <input 
                        type="email" 
                        class="form-control" 
                        :value="userContact.email || '未设置'" 
                        disabled
                      >
                    </div>
                  </div>
                </div>
                <div class="text-muted small mt-2">
                  <i class="bi bi-info-circle me-1"></i>
                  手机号和邮箱可在"联系方式"标签页中修改
                </div>
              </div>

              <div class="d-flex gap-2">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="saving"
                >
                  <i class="bi bi-save me-2"></i>
                  {{ saving ? '保存中...' : '保存修改' }}
                </button>
                <button 
                  type="button" 
                  class="btn btn-outline-secondary"
                  @click="resetForm"
                  :disabled="saving"
                >
                  <i class="bi bi-arrow-counterclockwise me-2"></i>重置
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { request, uploadImage } from '@/utils/network'
import { toast } from '@/utils/app'
import { useCommStore } from '@/store/comm'
import defaultAvatar from '@/assets/img/avatar.png'

const store = useCommStore()
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const showAvatarUrlInput = ref(false)
const customAvatarUrl = ref('')

const formData = reactive({
  id: '',
  nickname: '',
  gender: 0,
  description: '',
  avatar: ''
})

const userContact = reactive({
  phone: '',
  email: ''
})

const originalData = reactive({})

const handleUploadAvatar = () => {
  if (uploading.value) return
  uploading.value = true

  uploadImage((path) => {
    formData.avatar = path
    uploading.value = false
    toast.success('头像上传成功，请点击"保存修改"完成更新')
  })
}

const applyCustomAvatar = () => {
  const url = customAvatarUrl.value.trim()
  if (!url) {
    toast.warning('请输入头像链接')
    return
  }

  if (!/^https?:\/\//.test(url)) {
    toast.warning('请输入有效的图片链接（以 http:// 或 https:// 开头）')
    return
  }

  formData.avatar = url
  showAvatarUrlInput.value = false
  customAvatarUrl.value = ''
  toast.success('头像链接已应用，请点击"保存修改"完成更新')
}

const removeAvatar = () => {
  formData.avatar = ''
  toast.info('头像已移除，请点击"保存修改"完成更新')
}

const updateBasicInfo = async () => {
  if (saving.value) return

  saving.value = true
  try {
    // 性别映射：1->boy, 2->girl, 0->空
    const genderMap = {
      1: 'boy',
      2: 'girl',
      0: ''
    }
    
    const payload = {
      id: formData.id,
      nickname: formData.nickname,
      description: formData.description,
      avatar: formData.avatar
    }
    
    // 只有选择了性别才传递gender字段
    if (formData.gender !== 0) {
      payload.gender = genderMap[formData.gender]
    }

    const res = await request.put('/api/users/update', payload)

    if (res.code === 200) {
      toast.success('用户信息更新成功')
      await syncUserInfo()
      Object.assign(originalData, { ...formData })
    } else {
      toast.error(res.msg || '用户信息更新失败')
    }
  } catch (error) {
    console.error('更新失败:', error)
    toast.error('网络错误，请稍后重试')
  } finally {
    saving.value = false
  }
}

const syncUserInfo = async () => {
  try {
    await store.checkLoginState()
  } catch (error) {
    console.error('同步用户信息失败:', error)
  }
}

const resetForm = () => {
  Object.assign(formData, { ...originalData })
  showAvatarUrlInput.value = false
  customAvatarUrl.value = ''
}

const fetchUserInfo = () => {
  try {
    const loginState = store.getLogin
    const userInfo = loginState.user
    if (userInfo && Object.keys(userInfo).length > 0) {
      formData.id = userInfo.id
      formData.nickname = userInfo.nickname || ''
      
      // 性别映射：boy->1, girl->2, 其他->0
      const genderReverseMap = {
        'boy': 1,
        'girl': 2
      }
      if (userInfo.gender === 'boy' || userInfo.gender === 'girl') {
        formData.gender = genderReverseMap[userInfo.gender]
      } else if (typeof userInfo.gender === 'number') {
        formData.gender = userInfo.gender
      } else {
        formData.gender = 0
      }
      
      formData.description = userInfo.description || ''
      formData.avatar = userInfo.avatar || ''
      Object.assign(originalData, { ...formData })
      userContact.phone = userInfo.phone || ''
      userContact.email = userInfo.email || ''
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

onMounted(() => {
  fetchUserInfo()
})

// 监听 store 中用户信息变化，确保 token 校验完成后能正确回填表单
watch(
  () => store.login?.user,
  (newUser) => {
    if (newUser && Object.keys(newUser).length > 0) {
      fetchUserInfo()
    }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
.avatar-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border: 3px solid var(--bs-border-color);
  transition: all 0.2s ease;
}

.avatar-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
}

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

@media (max-width: 768px) {
  .avatar-image {
    width: 80px;
    height: 80px;
  }

  .card-body {
    padding: 1rem;
  }

  .col-md-4,
  .col-md-8 {
    width: 100%;
  }

  .form-control {
    padding: 0.5rem 0.625rem;
    font-size: 0.8125rem;
  }

  .btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }

  .d-flex.gap-2 {
    flex-direction: column;
    gap: 0.5rem !important;
  }

  .d-flex.gap-2 .btn {
    width: 100%;
  }
}
</style>
