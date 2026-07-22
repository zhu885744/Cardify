<template>
  <!-- 创建模式（需要发布权限） -->
  <div v-if="mode === 'create' && canPublish" class="card shadow-sm mb-4 mt-2">
    <div class="card-body">
      <div class="d-flex align-items-start gap-3">
        <div class="flex-grow-1">
          <textarea
            v-model="form.content"
            class="form-control mb-3"
            rows="3"
            placeholder="分享你的动态..."
            maxlength="500"
          ></textarea>

          <!-- 地区选择 -->
          <div class="mb-3">
            <label class="form-label small text-secondary">
              <i class="bi bi-geo-alt me-1"></i>选择位置
            </label>
            <RegionSelects
              v-model="areaCode"
              :area="false"
              language="zh-CN"
              clearable
              filterable
              @change="handleAreaChange"
            />
          </div>

          <div v-if="form.location" class="mb-3 small text-success">
            已选位置：{{ form.location }}
          </div>

          <!-- 图片预览区域 -->
          <div v-if="form.images.length > 0" class="moment-images-container mb-3">
            <div :class="gridClass" class="moment-images-grid">
              <div
                v-for="(img, index) in form.images"
                :key="index"
                :class="gridItemClass"
              >
                <img :src="img" class="moment-img" loading="lazy" alt="preview" />
                <button
                  type="button"
                  class="btn-close btn-close-white position-absolute top-0 right-0 img-del-btn"
                  @click="removeImage(index)"
                ></button>
              </div>
            </div>
          </div>

          <!-- 图片上传按钮 -->
          <div class="d-flex align-items-center justify-between">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm me-2"
              @click="triggerImageUpload"
              :disabled="form.images.length >= MAX_IMG_COUNT"
            >
              <i class="bi bi-image me-1"></i>
              添加图片
              <span class="text-xs">({{ form.images.length }}/{{ MAX_IMG_COUNT }})</span>
            </button>
            <input
              ref="imageInput"
              type="file"
              multiple
              accept="image/*"
              class="d-none"
              @change="handleImageUpload"
            />
            <button
              type="button"
              class="btn btn-primary btn-sm"
              @click="handlePublish"
              :disabled="isSubmitting || !hasContent"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
              发布动态
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 无发布权限 -->
  <div v-else-if="mode === 'create' && !canPublish" class="card shadow-sm mb-4 mt-2">
    <div class="card-body text-center py-3">
      <i class="bi bi-lock text-muted me-1"></i>
      <span class="text-muted">无发布权限，请联系管理员</span>
    </div>
  </div>

  <!-- 编辑模式 -->
  <div v-else-if="mode === 'edit' && canPublish" class="card shadow-sm mb-4">
    <div class="card-header bg-body-secondary">
      <h6 class="mb-0">编辑动态</h6>
    </div>
    <div class="card-body">
      <div class="d-flex align-items-start gap-3">
        <div class="flex-grow-1">
          <textarea
            v-model="form.content"
            class="form-control mb-3"
            rows="3"
            maxlength="500"
          ></textarea>

          <!-- 地区选择 -->
          <div class="mb-3">
            <label class="form-label small text-secondary">
              <i class="bi bi-geo-alt me-1"></i>选择位置
            </label>
            <RegionSelects
              v-model="areaCode"
              :area="false"
              language="zh-CN"
              clearable
              filterable
              @change="handleAreaChange"
            />
          </div>

          <div v-if="form.location" class="mb-3 small text-success">
            已选位置：{{ form.location }}
          </div>

          <!-- 图片预览区域 -->
          <div v-if="form.images.length > 0" class="moment-images-container mb-3">
            <div :class="gridClass" class="moment-images-grid">
              <div
                v-for="(img, index) in form.images"
                :key="index"
                :class="gridItemClass"
              >
                <img :src="img" class="moment-img" loading="lazy" alt="preview" />
                <button
                  type="button"
                  class="btn-close btn-close-white position-absolute top-0 right-0 img-del-btn"
                  @click="removeImage(index)"
                ></button>
              </div>
            </div>
          </div>

          <!-- 图片上传按钮 -->
          <div class="d-flex align-items-center justify-between">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm me-2"
              @click="triggerImageUpload"
              :disabled="form.images.length >= MAX_IMG_COUNT"
            >
              <i class="bi bi-image me-1"></i>
              添加图片
              <span class="text-xs">({{ form.images.length }}/{{ MAX_IMG_COUNT }})</span>
            </button>
            <input
              ref="imageInput"
              type="file"
              multiple
              accept="image/*"
              class="d-none"
              @change="handleImageUpload"
            />
          </div>
        </div>
      </div>

      <div class="d-flex align-items-center justify-end mt-3 gap-2">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          @click="$emit('cancelled')"
        >
          取消
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          @click="handleUpdate"
          :disabled="isSubmitting || !hasContent"
        >
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
          保存修改
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { request, checkFileType } from '@/utils/network'
import { toast } from '@/utils/app'
import { useCommStore } from '@/store/comm'
import { RegionSelects } from 'v-region'

const store = useCommStore()

// ====================== 常量统一管理 ======================
const MAX_IMG_COUNT = 9
const CONST_API = {
  create: '/api/moments/create',
  update: '/api/moments/update',
  upload: '/api/attachment/batch'
}

const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: (v) => ['create', 'edit'].includes(v)
  },
  editData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['published', 'updated', 'cancelled'])

// DOM Ref
const imageInput = ref(null)
const isSubmitting = ref(false)

// 地区选择绑定
const areaCode = ref({
  province: '',
  city: '',
  area: '',
  town: ''
})

// 表单数据
const form = reactive({
  id: null,
  content: '',
  images: [],
  location: ''
})

// ====================== 计算属性 ======================
/** 是否拥有发布权限 */
const canPublish = computed(() => {
  const userInfo = store.login.user
  if (!userInfo) return false
  const userAuth = userInfo.result?.auth || userInfo.auth
  if (!userAuth) return false
  if (userAuth.all) return true
  const groupList = userAuth.group?.list || []
  return groupList.some(item => item.key === 'admin')
})

/** 内容是否有效 */
const hasContent = computed(() => !!form.content.trim())

/** 图片网格外层class */
const gridClass = computed(() => {
  const len = form.images.length
  if (len === 1) return 'moment-grid-1'
  if (len === 2 || len === 4) return 'moment-grid-2'
  return 'moment-grid-3'
})

/** 图片格子class */
const gridItemClass = computed(() => {
  const len = form.images.length
  if (len === 1) return 'moment-img-single'
  if (len === 2 || len === 4) return 'moment-img-double'
  return 'moment-img-grid'
})

// ====================== 方法 ======================
/** 地区选择回调 */
const handleAreaChange = (regionObj) => {
  if (!regionObj) {
    form.location = ''
    return
  }
  const nameList = []
  if (regionObj.province?.value) nameList.push(regionObj.province.value)
  if (regionObj.city?.value) nameList.push(regionObj.city.value)
  if (regionObj.area?.value) nameList.push(regionObj.area.value)
  if (regionObj.town?.value) nameList.push(regionObj.town.value)
  form.location = nameList.join('/')
}

/** 打开文件选择框 */
const triggerImageUpload = () => {
  imageInput.value?.click()
}

/** 图片上传处理 */
const handleImageUpload = async (event) => {
  const target = event.target
  const files = Array.from(target.files || [])
  if (!files.length) return

  const remain = MAX_IMG_COUNT - form.images.length
  if (remain <= 0) {
    toast.warning(`最多上传${MAX_IMG_COUNT}张图片`)
    target.value = ''
    return
  }
  const uploadList = files.slice(0, remain)

  try {
    const fileNames = uploadList.map(f => f.name)
    await checkFileType(fileNames)

    const formData = new FormData()
    uploadList.forEach(file => formData.append('files', file))

    const { code, msg, data } = await request.post(CONST_API.upload, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (code === 200 && Array.isArray(data?.results)) {
      data.results.forEach(item => {
        if (item.full_url) form.images.push(item.full_url)
      })
    } else {
      toast.error('上传失败：' + msg)
    }
  } catch (err) {
    toast.error('上传失败：' + (err.message || '网络异常'))
  }
  target.value = ''
}

/** 删除图片 */
const removeImage = (index) => {
  form.images.splice(index, 1)
}

/** 重置表单 */
const resetForm = () => {
  form.id = null
  form.content = ''
  form.images = []
  form.location = ''
  areaCode.value = { province: '', city: '', area: '', town: '' }
}

/** 发布动态 */
const handlePublish = async () => {
  if (!hasContent.value) {
    toast.warning('请输入动态内容')
    return
  }
  isSubmitting.value = true
  try {
    const { code, msg } = await request.post(CONST_API.create, {
      content: form.content.trim(),
      images: form.images.join(','),
      location: form.location,
      status: 1,
      publish_time: Math.floor(Date.now() / 1000)
    })
    if (code === 200) {
      toast.success(msg || '发布成功')
      resetForm()
      emit('published')
    } else {
      toast.error(msg || '发布失败')
    }
  } catch (err) {
    toast.error('发布失败：' + (err.message || '网络异常'))
  } finally {
    isSubmitting.value = false
  }
}

/** 更新动态 */
const handleUpdate = async () => {
  if (!hasContent.value) {
    toast.warning('请输入动态内容')
    return
  }
  isSubmitting.value = true
  try {
    const { code, msg } = await request.put(CONST_API.update, {
      id: form.id,
      content: form.content.trim(),
      images: form.images.join(','),
      location: form.location,
      status: 1
    })
    if (code === 200) {
      toast.success(msg || '修改成功')
      emit('updated')
    } else {
      toast.error(msg || '修改失败')
    }
  } catch (err) {
    toast.error('修改失败：' + (err.message || '网络异常'))
  } finally {
    isSubmitting.value = false
  }
}

// ====================== 编辑数据回填监听 ======================
watch(
  () => props.editData,
  (data) => {
    if (props.mode !== 'edit' || !data) return
    form.id = data.id ?? null
    form.content = data.content ?? ''
    form.images = data.images ? [...data.images] : []
    form.location = data.location ?? ''
    areaCode.value = { province: '', city: '', area: '', town: '' }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
.moment-images-container {
  margin-bottom: 12px;
}

.moment-images-grid {
  display: grid;
  width: fit-content;
  gap: 2px;
}

.moment-grid-1 {
  grid-template-columns: 1fr;
}
.moment-grid-2 {
  grid-template-columns: repeat(2, 1fr);
}
.moment-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.moment-img-item {
  overflow: hidden;
  cursor: pointer;
  display: block;
  position: relative;
}

.moment-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}
.moment-img-item:hover .moment-img {
  transform: scale(1.03);
}

.img-del-btn {
  z-index: 2;
  width: 20px;
  height: 20px;
  padding: 2px;
}

.moment-img-single {
  max-width: 180px;
  max-height: 180px;
}
.moment-img-single .moment-img {
  object-fit: contain;
}

.moment-img-double,
.moment-img-grid {
  aspect-ratio: 1;
  width: 90px;
  height: 90px;
}

/* 地区选择器铺满 */
:deep(.v-region-selects) {
  width: 100%;
}
:deep(.v-region-selects .region-col) {
  flex: 1;
  min-width: 120px;
}
</style>