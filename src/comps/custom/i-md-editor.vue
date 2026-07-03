<template>
  <div class="simple-editor">
    <textarea
      ref="textareaRef"
      v-model="state.content"
      class="editor-textarea"
      :placeholder="placeholder"
      @input="handleInput"
      @keydown="handleKeydown"
    ></textarea>
    
    <div class="editor-actions">
      <button class="action-btn" @click="triggerImageUpload" title="插入图片">
        <i class="bi bi-image"></i>
      </button>
      <button class="action-btn" @click="insertFormat('bold')" title="加粗">
        <i class="bi bi-type-bold"></i>
      </button>
      <button class="action-btn" @click="insertFormat('italic')" title="斜体">
        <i class="bi bi-type-italic"></i>
      </button>
      <button class="action-btn" @click="insertFormat('link')" title="链接">
        <i class="bi bi-link-45deg"></i>
      </button>
      <button class="action-btn" @click="insertFormat('quote')" title="引用">
        <i class="bi bi-quote"></i>
      </button>
      <button class="action-btn" @click="insertFormat('code')" title="代码">
        <i class="bi bi-code"></i>
      </button>
    </div>
    
    <input
      type="file"
      ref="fileInputRef"
      class="d-none"
      accept="image/*"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { request } from '@/utils/network'
import { toast } from '@/utils/app'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '写点什么吧！'
  }
})

const emit = defineEmits(['update:modelValue'])

const textareaRef = ref(null)
const fileInputRef = ref(null)

const state = reactive({
  content: ''
})

watch(() => props.modelValue, (newVal) => {
  if (newVal !== state.content) {
    state.content = newVal
  }
}, { immediate: true })

const handleInput = () => {
  emit('update:modelValue', state.content)
}

const handleKeydown = (e) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    insertText('  ')
  }
}

const insertText = (text) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const content = state.content
  
  state.content = content.substring(0, start) + text + content.substring(end)
  emit('update:modelValue', state.content)
  
  setTimeout(() => {
    textarea.focus()
    textarea.selectionStart = textarea.selectionEnd = start + text.length
  }, 0)
}

const insertFormat = (type) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = state.content.substring(start, end)
  
  let insertText = ''
  let cursorOffset = 0
  
  switch (type) {
    case 'bold':
      insertText = `**${selectedText || '粗体文本'}**`
      cursorOffset = selectedText ? insertText.length : 2
      break
    case 'italic':
      insertText = `*${selectedText || '斜体文本'}*`
      cursorOffset = selectedText ? insertText.length : 1
      break
    case 'link':
      insertText = `[${selectedText || '链接文本'}](url)`
      cursorOffset = selectedText ? insertText.length - 1 : 1
      break
    case 'quote':
      insertText = `> ${selectedText || '引用文本'}`
      cursorOffset = insertText.length
      break
    case 'code':
      insertText = `\`${selectedText || '代码'}\``
      cursorOffset = selectedText ? insertText.length : 1
      break
    default:
      return
  }
  
  const content = state.content
  state.content = content.substring(0, start) + insertText + content.substring(end)
  emit('update:modelValue', state.content)
  
  setTimeout(() => {
    textarea.focus()
    textarea.selectionStart = textarea.selectionEnd = start + cursorOffset
  }, 0)
}

const triggerImageUpload = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    toast.error('请选择图片文件')
    return
  }
  
  if (file.size > 5 * 1024 * 1024) {
    toast.error('图片大小不能超过 5MB')
    return
  }
  
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const { code, msg, data } = await request.post('/api/file/upload', formData)
    
    if (code !== 200) {
      throw new Error(msg)
    }
    
    const { path } = data
    const imageMarkdown = `![${file.name}](${path})`
    insertText(imageMarkdown)
    toast.success('图片上传成功')
  } catch (err) {
    toast.error(err.message || '上传失败')
  } finally {
    e.target.value = ''
  }
}

defineExpose({
  getValue: () => state.content,
  setValue: (value) => {
    state.content = value
    emit('update:modelValue', value)
  },
  insertText
})
</script>

<style scoped>
.simple-editor {
  border: 1px solid var(--bs-border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bs-body-bg);
  position: relative;
}

.editor-textarea {
  width: 100%;
  min-height: 200px;
  padding: 16px;
  padding-bottom: 48px;
  border: none;
  resize: vertical;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  background: transparent;
  color: var(--bs-body-color);
}

.editor-textarea::placeholder {
  color: var(--bs-secondary-color);
}

.editor-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--bs-tertiary-bg);
  border-top: 1px solid var(--bs-border-color);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--bs-body-color);
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bs-secondary-bg);
}
</style>