<!-- 自定义Markdown编辑器组件 -->
<template>
    <div ref="containerRef" class="md-editor" :class="{ 'fullscreen': isFullscreen }">
        <!-- 工具栏 -->
        <div class="md-toolbar">
            <div class="toolbar-group">
                <button type="button" class="toolbar-btn" @click="insertFormat('bold')" title="加粗 (Ctrl+B)">
                    <i class="bi bi-type-bold"></i>
                </button>
                <button type="button" class="toolbar-btn" @click="insertFormat('italic')" title="斜体 (Ctrl+I)">
                    <i class="bi bi-type-italic"></i>
                </button>
                <button type="button" class="toolbar-btn" @click="insertFormat('strikethrough')" title="删除线">
                    <i class="bi bi-type-strikethrough"></i>
                </button>
            </div>

            <div class="toolbar-divider"></div>

            <div class="toolbar-group">
                <button type="button" class="toolbar-btn" @click="insertFormat('h1')" title="标题1">
                    <span class="toolbar-text">H1</span>
                </button>
                <button type="button" class="toolbar-btn" @click="insertFormat('h2')" title="标题2">
                    <span class="toolbar-text">H2</span>
                </button>
                <button type="button" class="toolbar-btn" @click="insertFormat('h3')" title="标题3">
                    <span class="toolbar-text">H3</span>
                </button>
            </div>

            <div class="toolbar-divider"></div>

            <div class="toolbar-group">
                <button type="button" class="toolbar-btn" @click="insertFormat('quote')" title="引用">
                    <i class="bi bi-quote"></i>
                </button>
                <button type="button" class="toolbar-btn" @click="insertFormat('code')" title="代码">
                    <i class="bi bi-code"></i>
                </button>
                <button type="button" class="toolbar-btn" @click="insertFormat('codeblock')" title="代码块">
                    <i class="bi bi-code-square"></i>
                </button>
            </div>

            <div class="toolbar-divider"></div>

            <div class="toolbar-group">
                <button type="button" class="toolbar-btn" @click="insertFormat('ul')" title="无序列表">
                    <i class="bi bi-list-ul"></i>
                </button>
                <button type="button" class="toolbar-btn" @click="insertFormat('ol')" title="有序列表">
                    <i class="bi bi-list-ol"></i>
                </button>
                <button type="button" class="toolbar-btn" @click="insertFormat('task')" title="任务列表">
                    <i class="bi bi-check2-square"></i>
                </button>
            </div>

            <div class="toolbar-divider"></div>

            <div class="toolbar-group">
                <button type="button" class="toolbar-btn" @click="insertFormat('link')" title="链接">
                    <i class="bi bi-link-45deg"></i>
                </button>
                <button type="button" class="toolbar-btn" @click="showImageModal = true" title="图片">
                    <i class="bi bi-image"></i>
                </button>
                <button type="button" class="toolbar-btn" @click="insertFormat('table')" title="表格">
                    <i class="bi bi-table"></i>
                </button>
            </div>

            <div class="toolbar-divider"></div>

            <div class="toolbar-group">
                <button type="button" class="toolbar-btn" @click="insertFormat('hr')" title="分割线">
                    <i class="bi bi-dash-lg"></i>
                </button>
                <button type="button" class="toolbar-btn" @click="insertFormat('undo')" title="撤销 (Ctrl+Z)">
                    <i class="bi bi-arrow-counterclockwise"></i>
                </button>
                <button type="button" class="toolbar-btn" @click="insertFormat('redo')" title="重做 (Ctrl+Y)">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <div class="toolbar-spacer"></div>

            <div class="toolbar-group">
                <button 
                    type="button" 
                    class="toolbar-btn" 
                    :class="{ active: showPreview }"
                    @click="showPreview = !showPreview" 
                    title="预览"
                >
                    <i class="bi bi-eye"></i>
                </button>
                <button 
                    type="button" 
                    class="toolbar-btn" 
                    :class="{ active: isFullscreen }"
                    @click="toggleFullscreen" 
                    :title="isFullscreen ? '退出全屏' : '全屏'"
                >
                    <i :class="isFullscreen ? 'bi bi-fullscreen-exit' : 'bi bi-fullscreen'"></i>
                </button>
            </div>
        </div>

        <!-- 上传进度条 -->
        <div v-if="state.progress.show" class="md-progress">
            <div class="progress" style="height: 6px;">
                <div 
                    class="progress-bar" 
                    :class="progressClass" 
                    :style="{ width: state.progress.value + '%' }"
                    role="progressbar"
                ></div>
            </div>
            <div class="text-center text-sm mt-1">{{ state.progress.value }}%</div>
        </div>

        <!-- 编辑器主体 -->
        <div class="md-body" :class="{ 'fullscreen': isFullscreen }" :style="{ height: computedHeight + 'px' }">
            <!-- 编辑区 -->
            <div class="md-edit-area" :style="{ width: showPreview ? '50%' : '100%' }">
                <textarea
                    ref="textareaRef"
                    v-model="state.content"
                    class="md-textarea"
                    :placeholder="placeholder"
                    @keydown="handleKeydown"
                    @input="handleInput"
                ></textarea>
            </div>

            <!-- 预览区 -->
            <div v-if="showPreview" class="md-preview-area">
                <div class="article-content" v-html="renderedContent"></div>
            </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="state.error" class="md-error alert alert-danger alert-dismissible fade show" role="alert">
            {{ state.error }}
            <button type="button" class="btn-close" @click="state.error = ''" aria-label="Close"></button>
        </div>

        <!-- 图片插入弹窗 -->
        <div v-if="showImageModal" class="modal-overlay" @click.self="showImageModal = false">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">插入图片</h5>
                    <button type="button" class="btn-close" @click="showImageModal = false"></button>
                </div>
                <div class="modal-body">
                    <!-- 上传方式 -->
                    <div class="mb-4">
                        <label class="form-label d-block mb-2">方式一：上传图片</label>
                        <button 
                            type="button" 
                            class="btn btn-primary btn-sm"
                            @click="handleImageUpload"
                            :disabled="uploadingImage"
                        >
                            <i class="bi bi-upload me-2"></i>
                            {{ uploadingImage ? '上传中...' : '选择图片上传' }}
                        </button>
                    </div>

                    <!-- 手动输入链接方式 -->
                    <div class="mb-4">
                        <label class="form-label d-block mb-2">方式二：输入图片链接</label>
                        <div class="input-group">
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="imageUrl" 
                                placeholder="请输入图片链接"
                            >
                            <button 
                                type="button" 
                                class="btn btn-outline-primary"
                                @click="insertImageFromUrl"
                                :disabled="!imageUrl.trim()"
                            >
                                插入
                            </button>
                        </div>
                    </div>

                    <!-- 图片预览 -->
                    <div v-if="previewImage" class="mb-4">
                        <label class="form-label d-block mb-2">图片预览</label>
                        <img :src="previewImage" class="img-fluid rounded" style="max-height: 200px;" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="showImageModal = false">取消</button>
                </div>
            </div>
        </div>

        <!-- 隐藏的图片上传input -->
        <input 
            type="file" 
            ref="fileInputRef" 
            class="d-none" 
            accept="image/*" 
            @change="handleFileChange"
        >
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { request } from '@/utils/network'
import { toast } from '@/utils/app'

// 定义属性
const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: '写点什么吧！'
    },
    height: {
        type: Number,
        default: 400
    },
    preview: {
        type: Boolean,
        default: true
    }
})

// 定义事件
const emit = defineEmits(['update:modelValue'])

// Refs
const textareaRef = ref(null)
const fileInputRef = ref(null)

// 图片弹窗状态
const showImageModal = ref(false)
const imageUrl = ref('')
const previewImage = ref('')
const uploadingImage = ref(false)

// 全屏状态
const isFullscreen = ref(false)

// 自适应高度
const editorHeight = ref(500)
const containerRef = ref(null)
let resizeObserver = null

// 状态
const state = reactive({
    content: '',
    progress: {
        value: 0,
        show: false
    },
    error: '',
    history: [],
    historyIndex: -1
})

// 显示预览
const showPreview = ref(props.preview)

// 计算属性
const progressClass = computed(() => {
    if (state.progress.value < 30) return 'bg-dark'
    if (state.progress.value < 60) return 'bg-primary'
    if (state.progress.value < 100) return 'bg-info'
    return 'bg-success'
})

// 计算编辑器高度
const computedHeight = computed(() => {
    if (isFullscreen.value) {
        return window.innerHeight - 52
    }
    return editorHeight.value
})

// 监听窗口大小变化
const handleResize = () => {
    if (!containerRef.value || isFullscreen.value) return
    
    const parent = containerRef.value.parentElement
    if (parent) {
        const parentHeight = parent.clientHeight
        const toolbarHeight = 52
        const padding = 20
        
        // 计算可用高度，取父容器高度和视口高度的较小值
        const viewportHeight = window.innerHeight - 150
        const maxHeight = Math.min(parentHeight, viewportHeight)
        const newHeight = Math.max(400, Math.min(maxHeight - toolbarHeight - padding, 600))
        editorHeight.value = newHeight
    }
}

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
    if (newVal !== state.content) {
        state.content = newVal
    }
}, { immediate: true })

// 简单的 Markdown 解析器
const parseMarkdown = (text) => {
    if (!text) return ''

    let html = text
        // 转义 HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    // 代码块（优先处理，保护内容）
    const codeBlocks = []
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const placeholder = `\x00CODEBLOCK_${codeBlocks.length}\x00`
        codeBlocks.push({ lang, code: code.trim() })
        return placeholder
    })

    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

    // 标题
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')

    // 粗体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')

    // 斜体
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>')

    // 删除线
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')

    // 引用
    html = html.replace(/^&gt; \|(.*)$/gm, '<blockquote><p>$1</p></blockquote>')
    html = html.replace(/^&gt; (.*)$/gm, '<blockquote><p>$1</p></blockquote>')

    // 任务列表
    html = html.replace(/^- \[x\] (.*$)/gm, '<li class="task-list-item"><label><input type="checkbox" checked disabled> $1</label></li>')
    html = html.replace(/^- \[ \] (.*$)/gm, '<li class="task-list-item"><label><input type="checkbox" disabled> $1</label></li>')

    // 无序列表 - 先处理，避免与有序列表冲突
    html = html.replace(/^[\-\*] (.*$)/gm, '<li class="ul-item">$1</li>')
    
    // 有序列表
    html = html.replace(/^\d+\. (.*$)/gm, '<li class="ol-item">$1</li>')
    
    // 将无序列表项包装成 ul
    html = html.replace(/(<li class="ul-item">[\s\S]*?<\/li>)(\n<li class="ul-item">[\s\S]*?<\/li>)+/g, '<ul>$&</ul>')
    html = html.replace(/class="ul-item"/g, '')
    
    // 将有序列表项包装成 ol
    html = html.replace(/(<li class="ol-item">[\s\S]*?<\/li>)(\n<li class="ol-item">[\s\S]*?<\/li>)+/g, '<ol>$&</ol>')
    html = html.replace(/class="ol-item"/g, '')

    // 图片 ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-image">')

    // 链接 [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')

    // 分割线
    html = html.replace(/^---$/gm, '<hr>')
    html = html.replace(/^\*\*\*$/gm, '<hr>')

    // 表格 - 先处理表格，避免被段落处理影响
    const tableRegex = /(\|.+\|\n?)+/g
    html = html.replace(tableRegex, (match) => {
        let tableHtml = match
            // 去除首尾空行
            .trim()
            // 替换分隔行
            .replace(/^\|[\s\-]+\|$/gm, '')
            // 处理每一行
            .replace(/^\|(.+)\|$/gm, (rowMatch, content) => {
                const cells = content.split('|').map(cell => cell.trim())
                const isHeader = cells.every(cell => cell === '' || /^-+$/.test(cell))
                if (isHeader) return ''
                const cellTags = cells.map(cell => `<td>${cell}</td>`).join('')
                return `<tr>${cellTags}</tr>`
            })
            // 去除多余空行
            .replace(/\n\n+/g, '\n')
            .trim()
        
        if (!tableHtml) return match
        
        return `<table class="md-table"><tbody>${tableHtml}</tbody></table>`
    })

    // 段落（最后处理）
    html = html.replace(/\n\n/g, '</p><p>')
    html = '<p>' + html + '</p>'
    html = html.replace(/<p><\/p>/g, '')
    
    // 清理块级元素周围的段落标签
    html = html.replace(/<p>\s*(<h[1-6]>)/g, '$1')
    html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1')
    html = html.replace(/<p>\s*(<ul>)/g, '$1')
    html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1')
    html = html.replace(/<p>\s*(<ol>)/g, '$1')
    html = html.replace(/(<\/ol>)\s*<\/p>/g, '$1')
    html = html.replace(/<p>\s*(<blockquote>)/g, '$1')
    html = html.replace(/(<\/blockquote>)\s*<\/p>/g, '$1')
    html = html.replace(/<p>\s*(<pre>)/g, '$1')
    html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1')
    html = html.replace(/<p>\s*(<table)/g, '$1')
    html = html.replace(/(<\/table>)\s*<\/p>/g, '$1')
    html = html.replace(/<p>\s*(<hr>)\s*<\/p>/g, '$1')
    
    // 清理列表项内部的段落标签
    html = html.replace(/<li>\s*<p>(.+?)<\/p>\s*<\/li>/g, '<li>$1</li>')
    
    // 处理剩余的换行（不在pre/table内）
    html = html.replace(/<table[\s\S]*?<\/table>/g, (match) => {
        return match.replace(/\n/g, '<!--NEWLINE-->')
    })
    html = html.replace(/<pre[\s\S]*?<\/pre>/g, (match) => {
        return match.replace(/\n/g, '<!--NEWLINE-->')
    })
    html = html.replace(/\n/g, '')
    html = html.replace(/<!--NEWLINE-->/g, '\n')
    
    // 恢复代码块
    html = html.replace(/\x00CODEBLOCK_(\d+)\x00/g, (match, index) => {
        const block = codeBlocks[parseInt(index)]
        return `<pre><code class="language-${block.lang}">${block.code}</code></pre>`
    })

    return html
}

const renderedContent = computed(() => parseMarkdown(state.content))

// 处理输入
const handleInput = () => {
    emit('update:modelValue', state.content)
    saveHistory()
}

// 保存历史记录
const saveHistory = () => {
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1)
    }
    state.history.push(state.content)
    state.historyIndex = state.history.length - 1
    if (state.history.length > 100) {
        state.history.shift()
        state.historyIndex--
    }
}

// 键盘事件
const handleKeydown = (e) => {
    // Tab 插入空格
    if (e.key === 'Tab') {
        e.preventDefault()
        insertText('  ')
        return
    }

    // Ctrl+B 加粗
    if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        insertFormat('bold')
        return
    }

    // Ctrl+I 斜体
    if (e.ctrlKey && e.key === 'i') {
        e.preventDefault()
        insertFormat('italic')
        return
    }

    // Ctrl+Z 撤销
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        undo()
        return
    }

    // Ctrl+Y 重做
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault()
        redo()
        return
    }
}

// 插入格式化
const insertFormat = (type) => {
    const textarea = textareaRef.value
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = state.content
    const selectedText = text.substring(start, end)

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
        case 'strikethrough':
            insertText = `~~${selectedText || '删除线文本'}~~`
            cursorOffset = selectedText ? insertText.length : 2
            break
        case 'h1':
            insertText = `# ${selectedText || '标题1'}`
            cursorOffset = insertText.length
            break
        case 'h2':
            insertText = `## ${selectedText || '标题2'}`
            cursorOffset = insertText.length
            break
        case 'h3':
            insertText = `### ${selectedText || '标题3'}`
            cursorOffset = insertText.length
            break
        case 'quote':
            insertText = `> ${selectedText || '引用文本'}`
            cursorOffset = insertText.length
            break
        case 'code':
            insertText = `\`${selectedText || '代码'}\``
            cursorOffset = selectedText ? insertText.length : 1
            break
        case 'codeblock':
            insertText = `\`\`\`\n${selectedText || '代码块'}\n\`\`\``
            cursorOffset = selectedText ? insertText.length : 4
            break
        case 'ul':
            insertText = `- ${selectedText || '列表项'}`
            cursorOffset = insertText.length
            break
        case 'ol':
            insertText = `1. ${selectedText || '列表项'}`
            cursorOffset = insertText.length
            break
        case 'task':
            insertText = `- [ ] ${selectedText || '任务项'}`
            cursorOffset = insertText.length
            break
        case 'link':
            insertText = `[${selectedText || '链接文本'}](url)`
            cursorOffset = selectedText ? insertText.length - 1 : 1
            break
        case 'table':
            insertText = `| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |`
            cursorOffset = insertText.length
            break
        case 'hr':
            insertText = '\n---\n'
            cursorOffset = insertText.length
            break
        case 'undo':
            undo()
            return
        case 'redo':
            redo()
            return
        default:
            return
    }

    insertTextAtCursor(insertText, cursorOffset)
}

// 在光标位置插入文本
const insertText = (text) => {
    const textarea = textareaRef.value
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = state.content

    state.content = content.substring(0, start) + text + content.substring(end)
    emit('update:modelValue', state.content)

    // 设置光标位置
    setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = start + text.length
    }, 0)
}

// 在光标位置插入文本（带偏移量）
const insertTextAtCursor = (text, cursorOffset) => {
    const textarea = textareaRef.value
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = state.content

    state.content = content.substring(0, start) + text + content.substring(end)
    emit('update:modelValue', state.content)

    setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = start + cursorOffset
    }, 0)
}

// 撤销
const undo = () => {
    if (state.historyIndex > 0) {
        state.historyIndex--
        state.content = state.history[state.historyIndex]
        emit('update:modelValue', state.content)
    }
}

// 重做
const redo = () => {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++
        state.content = state.history[state.historyIndex]
        emit('update:modelValue', state.content)
    }
}

// 图片上传
const handleImageUpload = () => {
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

    uploadingImage.value = true

    try {
        const formData = new FormData()
        formData.append('file', file)

        const { code, msg, data } = await request.post('/api/file/upload', formData, {
            onUploadProgress: (progressEvent) => {
                state.progress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
            }
        })

        if (code !== 200) {
            throw new Error(msg)
        }

        const { path } = data
        previewImage.value = path
        const imageMarkdown = `![${file.name}](${path})`
        insertText(imageMarkdown)
        toast.success('图片上传成功')
        showImageModal.value = false
        resetImageModal()
    } catch (err) {
        toast.error(err.message || '上传失败')
    } finally {
        uploadingImage.value = false
        e.target.value = ''
    }
}

// 从URL插入图片
const insertImageFromUrl = () => {
    const url = imageUrl.value.trim()
    if (!url) {
        toast.warning('请输入图片链接')
        return
    }

    if (!/^https?:\/\//.test(url)) {
        toast.warning('请输入有效的图片链接（以 http:// 或 https:// 开头）')
        return
    }

    previewImage.value = url
    const imageMarkdown = `![图片](${url})`
    insertText(imageMarkdown)
    toast.success('图片插入成功')
    showImageModal.value = false
    resetImageModal()
}

// 重置图片弹窗状态
const resetImageModal = () => {
    imageUrl.value = ''
    previewImage.value = ''
    uploadingImage.value = false
}

// 全屏切换
const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
    
    if (isFullscreen.value) {
        document.documentElement.classList.add('md-editor-fullscreen-active')
        document.body.style.overflow = 'hidden'
    } else {
        document.documentElement.classList.remove('md-editor-fullscreen-active')
        document.body.style.overflow = ''
    }
}

// 监听 ESC 键退出全屏
const handleKeydownGlobal = (e) => {
    if (e.key === 'Escape' && isFullscreen.value) {
        toggleFullscreen()
    }
}

// 暴露方法
defineExpose({
    getValue: () => state.content,
    setValue: (value) => {
        state.content = value
        emit('update:modelValue', value)
    },
    insertText,
    insertFormat,
    clear: () => {
        state.content = ''
        emit('update:modelValue', '')
    }
})

// 初始化历史记录
onMounted(() => {
    // 确保初始化时历史记录包含当前内容
    if (state.history.length === 0) {
        state.history.push(state.content)
        state.historyIndex = 0
    }
    document.addEventListener('keydown', handleKeydownGlobal)
    
    // 初始化自适应高度
    handleResize()
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
    
    // 监听父容器大小变化
    if (containerRef.value) {
        resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(containerRef.value.parentElement)
    }
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydownGlobal)
    window.removeEventListener('resize', handleResize)
    
    if (resizeObserver) {
        resizeObserver.disconnect()
    }
    
    if (isFullscreen.value) {
        document.documentElement.classList.remove('md-editor-fullscreen-active')
        document.body.style.overflow = ''
    }
})
</script>

<style scoped>
.md-editor {
    border: 1px solid var(--bs-border-color);
    border-radius: 8px;
    overflow: hidden;
    background: var(--bs-body-bg);
    position: relative;
    transition: all 0.3s ease;
}

.md-editor.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    border-radius: 0;
    border: none;
}

/* 工具栏 */
.md-toolbar {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: var(--bs-tertiary-bg);
    border-bottom: 1px solid var(--bs-border-color);
    flex-wrap: wrap;
    gap: 4px;
}

.toolbar-group {
    display: flex;
    gap: 2px;
}

.toolbar-btn {
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

.toolbar-btn:hover {
    background: var(--bs-secondary-bg);
}

.toolbar-btn.active {
    background: var(--bs-primary);
    color: #fff;
}

.toolbar-text {
    font-weight: 600;
    font-size: 12px;
}

.toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--bs-border-color);
    margin: 0 4px;
}

.toolbar-spacer {
    flex: 1;
}

/* 进度条 */
.md-progress {
    padding: 8px 12px;
    background: var(--bs-tertiary-bg);
}

/* 编辑器主体 */
.md-body {
    display: flex;
    min-height: 400px;
}

.md-body.fullscreen {
    height: calc(100vh - 52px);
}

.md-edit-area {
    flex: 1;
    display: flex;
    height: 100%;
}

.md-textarea {
    width: 100%;
    height: 100%;
    padding: 16px;
    border: none;
    resize: none;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    line-height: 1.6;
    outline: none;
    background: transparent;
    color: var(--bs-body-color);
}

.md-textarea::placeholder {
    color: var(--bs-secondary-color);
}

/* 预览区 */
.md-preview-area {
    width: 50%;
    border-left: 1px solid var(--bs-border-color);
    overflow-y: auto;
    background: var(--bs-tertiary-bg);
    height: 100%;
}

.md-preview-area .article-content {
    padding: 16px;
}

/* 代码块样式 */
.md-preview-area :deep(.article-content pre) {
    margin: 0;
    border-radius: 0;
    padding: 1rem;
    overflow-x: auto;
    background-color: #282c34;
    border: none;
}

/* 代码块文字颜色 */
.md-preview-area :deep(.article-content pre code) {
    color: #e0e0e0;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    line-height: 1.6;
}

/* 行内代码样式 */
.md-preview-area :deep(.article-content) > code,
.md-preview-area :deep(.article-content) p code,
.md-preview-area :deep(.article-content) li code,
.md-preview-area :deep(.article-content) blockquote code,
.md-preview-area :deep(.article-content) h1 code,
.md-preview-area :deep(.article-content) h2 code,
.md-preview-area :deep(.article-content) h3 code {
    background-color: var(--bs-tertiary-bg);
    padding: 0.15rem 0.3rem;
    border-radius: 0.25rem;
    font-size: 0.95em;
    color: var(--bs-body-color);
    font-family: 'Consolas', 'Monaco', monospace;
}

/* 错误提示 */
.md-error {
    margin: 0;
    border-radius: 0;
    font-size: 14px;
}

/* 弹窗样式 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1055;
}

.modal-content {
    background: var(--bs-body-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 8px;
    width: 90%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--bs-border-color);
}

.modal-title {
    margin: 0;
    font-size: 16px;
}

.modal-body {
    padding: 16px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid var(--bs-border-color);
}

/* 响应式 */
@media (max-width: 768px) {
    .md-body {
        flex-direction: column;
    }

    .md-edit-area,
    .md-preview-area {
        width: 100% !important;
    }

    .md-preview-area {
        border-left: none;
        border-top: 1px solid #dee2e6;
        max-height: 300px;
    }

    .md-editor-dark .md-preview-area {
        border-color: #404040;
    }

    .toolbar-btn {
        width: 28px;
        height: 28px;
    }
}
</style>
