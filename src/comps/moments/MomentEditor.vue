<template>
  <!-- 创建模式 -->
  <div v-if="mode === 'create'" class="card shadow-sm mb-4 mt-2">
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
          <div class="input-group mb-3">
            <span class="input-group-text"><i class="bi bi-geo-alt"></i></span>
            <input 
              type="text" 
              v-model="form.location" 
              class="form-control form-control-sm"
              placeholder="添加位置信息..."
            />
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
              class="btn btn-outline-secondary btn-sm me-2"
              @click="handleSaveDraft"
              :disabled="isSubmitting || !form.content.trim()"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
              保存草稿
            </button>
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

  <!-- 编辑模式 -->
  <div v-else-if="mode === 'edit'" class="card shadow-sm mb-4">
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
      <div class="input-group mb-3">
        <span class="input-group-text"><i class="bi bi-geo-alt"></i></span>
        <input 
          type="text" 
          v-model="form.location" 
          class="form-control form-control-sm"
          placeholder="添加位置信息..."
        />
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
import { ref, reactive, watch } from 'vue'
import { request } from '@/utils/network'
import { toast } from '@/utils/app'

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

const emit = defineEmits(['published', 'draft-saved', 'updated', 'cancelled'])

const imageInput = ref(null)
const isSubmitting = ref(false)

const form = reactive({
  id: null,
  content: '',
  images: [],
  location: ''
})

// 编辑模式初始化数据
watch(() => props.editData, (data) => {
  if (props.mode === 'edit' && data) {
    form.id = data.id || null
    form.content = data.content || ''
    form.images = data.images ? [...data.images] : []
    form.location = data.location || ''
  }
}, { immediate: true })

// 重置表单
const resetForm = () => {
  form.id = null
  form.content = ''
  form.images = []
  form.location = ''
}

const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageUpload = async (event) => {
  const files = Array.from(event.target.files || [])
  for (const file of files) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { code, msg, data } = await request.post('/api/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (code == 200) {
        form.images.push(data.path)
      } else {
        toast.error('上传失败：' + msg)
      }
    } catch (error) {
      toast.error('上传失败：' + (error.message || '请稍后重试'))
    }
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

    if (code == 200) {
      toast.success(msg || '发布成功')
      resetForm()
      emit('published')
    } else {
      toast.error(msg || '发布失败')
    }
  } catch (error) {
    toast.error('发布失败：' + (error.message || '请稍后重试'))
  } finally {
    isSubmitting.value = false
  }
}

const handleSaveDraft = async () => {
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
      status: 0,
      publish_time: Math.floor(Date.now() / 1000)
    })

    if (code == 200) {
      toast.success(msg || '保存成功')
      resetForm()
      emit('draft-saved')
    } else {
      toast.error(msg || '保存失败')
    }
  } catch (error) {
    toast.error('保存失败：' + (error.message || '请稍后重试'))
  } finally {
    isSubmitting.value = false
  }
}

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

    if (code == 200) {
      toast.success(msg || '更新成功')
      emit('updated')
    } else {
      toast.error(msg || '更新失败')
    }
  } catch (error) {
    toast.error('更新失败：' + (error.message || '请稍后重试'))
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
</style>
