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

          <!-- 近距离层级 RegionSelects 平铺地区选择 -->
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

          <!-- 已选地址展示（用于调试确认是否选中） -->
          <div v-if="form.location" class="mb-3 small text-success">
            已选位置：{{ form.location }}
          </div>

          <div v-if="form.images.length > 0" class="moment-images-container mb-3">
            <div 
              :class="[
                'moment-images-grid',
                form.images.length === 1 ? 'moment-grid-1' : 
                form.images.length === 2 ? 'moment-grid-2' : 
                form.images.length === 4 ? 'moment-grid-2' : 'moment-grid-3'
              ]"
            >
              <div 
                v-for="(img, index) in form.images" 
                :key="index" 
                :class="[
                  'moment-img-item',
                  form.images.length === 1 ? 'moment-img-single' : 
                  form.images.length === 2 ? 'moment-img-double' : 
                  form.images.length === 4 ? 'moment-img-double' : 'moment-img-grid'
                ]"
              >
                <img :src="img" class="moment-img" />
                <button 
                  type="button" 
                  class="btn-close btn-close-white position-absolute top-0 right-0"
                  @click="removeImage(index)"
                ></button>
              </div>
            </div>
          </div>
          <div class="d-flex align-items-center justify-between">
            <button 
              type="button" 
              class="btn btn-outline-secondary btn-sm me-2"
              @click="triggerImageUpload"
            >
              <i class="bi bi-image me-1"></i>
              添加图片
            </button>
            <input 
              ref="imageInput" 
              type="file" 
              multiple 
              accept="image/*" 
              class="d-none"
              @change="handleImageUpload"
            />
            <!-- 删除保存草稿按钮 -->
            <button 
              type="button" 
              class="btn btn-primary btn-sm"
              @click="handlePublish"
              :disabled="isSubmitting || !form.content.trim()"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
              发布动态
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 无权限提示 -->
  <div v-else-if="mode === 'create' && !canPublish" class="card shadow-sm mb-4 mt-2">
    <div class="card-body text-center py-3">
      <i class="bi bi-lock text-muted me-1"></i>
      <span class="text-muted">无发布权限，请联系管理员</span>
    </div>
  </div>

  <!-- 编辑模式（需要发布权限） -->
  <div v-else-if="mode === 'edit' && canPublish" class="card shadow-sm mb-4">
    <div class="card-header bg-body-secondary">
      <h6 class="mb-0">编辑动态</h6>
    </div>
    <div class="card-body">
      <textarea 
        v-model="form.content" 
        class="form-control mb-3" 
        rows="3"
        maxlength="500"
      ></textarea>

      <!-- 近距离层级 RegionSelects -->
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

      <!-- 已选地址展示 -->
      <div v-if="form.location" class="mb-3 small text-success">
        已选位置：{{ form.location }}
      </div>

      <div v-if="form.images.length > 0" class="moment-images-container mb-3">
        <div 
          :class="[
            'moment-images-grid',
            form.images.length === 1 ? 'moment-grid-1' : 
            form.images.length === 2 ? 'moment-grid-2' : 
            form.images.length === 4 ? 'moment-grid-2' : 'moment-grid-3'
          ]"
        >
          <div 
            v-for="(img, index) in form.images" 
            :key="index" 
            :class="[
              'moment-img-item',
              form.images.length === 1 ? 'moment-img-single' : 
              form.images.length === 2 ? 'moment-img-double' : 
              form.images.length === 4 ? 'moment-img-double' : 'moment-img-grid'
            ]"
          >
            <img :src="img" class="moment-img" />
            <button 
              type="button" 
              class="btn-close btn-close-white position-absolute top-0 right-0"
              @click="removeImage(index)"
            ></button>
          </div>
        </div>
      </div>
      <div class="d-flex align-items-center justify-between">
        <button 
          type="button" 
          class="btn btn-outline-secondary btn-sm me-2"
          @click="triggerImageUpload"
        >
          <i class="bi bi-image me-1"></i>
          添加图片
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
          class="btn btn-secondary btn-sm me-2"
          @click="$emit('cancelled')"
        >
          取消
        </button>
        <button 
          type="button" 
          class="btn btn-primary btn-sm"
          @click="handleUpdate"
          :disabled="isSubmitting || !form.content.trim()"
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
import { toast, getSync } from '@/utils/app'
import { useCommStore } from '@/store/comm'
import { RegionSelects } from 'v-region'

const store = useCommStore()

// 权限检查
const canPublish = computed(() => {
  const userInfo = store.login.user
  if (!userInfo) return false
  const userAuth = userInfo.result?.auth || userInfo?.auth
  if (!userAuth) return false
  if (userAuth.all) return true
  const userGroups = userAuth.group?.list || []
  return userGroups.some(group => group.key === 'admin')
})

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

// 删除 'draft-saved' 事件
const emit = defineEmits(['published', 'updated', 'cancelled'])

const imageInput = ref(null)
const isSubmitting = ref(false)
// v-model 绑定对象格式，对应省/市/区/街道编码
const areaCode = ref({
  province: '',
  city: '',
  area: '',
  town: ''
})

const form = reactive({
  id: null,
  content: '',
  images: [],
  location: '' // 最终提交的纯中文地址
})

// ✅ 修复：适配 RegionSelects 对象格式的变更事件
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

// 编辑回填
watch(() => props.editData, (data) => {
  if (props.mode === 'edit' && data) {
    form.id = data.id || null
    form.content = data.content || ''
    form.images = data.images ? [...data.images] : []
    form.location = data.location || ''
    // 后端仅存文字，无编码对象，编辑时组件不自动高亮，重新选择即可覆盖
    areaCode.value = { province: '', city: '', area: '', town: '' }
  }
}, { immediate: true })

// 重置表单
const resetForm = () => {
  form.id = null
  form.content = ''
  form.images = []
  form.location = ''
  areaCode.value = { province: '', city: '', area: '', town: '' }
}

const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageUpload = async (event) => {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return

  try {
    const fileNames = files.map(f => f.name)
    await checkFileType(fileNames)

    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    const { code, msg, data } = await request.post('/api/attachment/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (code === 200 && data?.results) {
      data.results.forEach(result => {
        if (result.full_url) {
          form.images.push(result.full_url)
        }
      })
    } else {
      toast.error('上传失败：' + msg)
    }
  } catch (err) {
    toast.error('上传失败：' + (err.message || '网络异常'))
  }
  event.target.value = ''
}

const removeImage = (index) => {
  form.images.splice(index, 1)
}

const handlePublish = async () => {
  if (!form.content.trim()) {
    toast.warning('请输入动态内容')
    return
  }
  isSubmitting.value = true
  try {
    const { code, msg } = await request.post('/api/moments/create', {
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

// 已完整删除 handleSaveDraft 草稿保存函数

const handleUpdate = async () => {
  if (!form.content.trim()) {
    toast.warning('请输入动态内容')
    return
  }
  isSubmitting.value = true
  try {
    const { code, msg } = await request.put('/api/moments/update', {
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
}

.moment-img-single {
  max-width: 180px;
  max-height: 180px;
}

.moment-img-single .moment-img {
  object-fit: contain;
}

.moment-img-double {
  aspect-ratio: 1;
  width: 90px;
  height: 90px;
}

.moment-img-grid {
  aspect-ratio: 1;
  width: 90px;
  height: 90px;
}

/* 平铺选择器宽度铺满 */
:deep(.v-region-selects) {
  width: 100%;
}
:deep(.v-region-selects .region-col) {
  flex: 1;
  min-width: 120px;
}
</style>