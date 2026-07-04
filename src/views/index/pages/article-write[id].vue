<template>
    <div class="px-1 px-lg-0 mt-2">
        <div class="row">
            <div class="col-lg-9">
                <div v-if="!state.struct.editor" class="d-flex justify-content-center align-items-center py-5">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <span class="ms-2">加载编辑器中...</span>
                </div>
                <i-md-editor ref="vditorRef" v-model="state.struct.content" :opts="{ height: 600 }"></i-md-editor>
                <div class="mt-2 d-flex justify-content-end gap-2">
                    <button class="btn btn-outline-secondary" type="button" @click="method.saveAsDraft()" :disabled="state.item.wait">
                        <span v-if="state.item.wait" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        保存草稿
                    </button>
                    <button class="btn btn-primary" type="button" @click="method.save()" :disabled="state.item.wait">
                        <span v-if="state.item.wait" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        发布文章
                    </button>
                </div>
            </div>
            <div class="col-lg-3" id="page-header-title">
                <div v-if="state.item.loading" class="d-flex justify-content-center align-items-center py-5">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <span class="ms-2">加载数据中...</span>
                </div>
                <div v-else>
                    <!-- 展示信息 -->
                    <div class="border rounded-3 mb-2 overflow-hidden">
                        <div class="bg-body-secondary px-3 py-2" data-bs-toggle="collapse" href="#collapse1" role="button" aria-expanded="true" aria-controls="collapse1">
                            <h6 class="mb-0">展示信息</h6>
                        </div>
                        <div id="collapse1" class="collapse show">
                            <div class="p-3">
                                <div class="mb-3">
                                    <label class="form-label">
                                        <span class="text-danger me-1">*</span>
                                        <span>标题：</span>
                                        <span class="text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="（必须）文章的标题">
                                            <i class="bi bi-info-circle ms-1"></i>
                                        </span>
                                    </label>
                                    <input type="text" v-model="state.struct.title" class="form-control" placeholder="文章标题">
                                </div>
                                <!-- 发布时间 -->
                                <div class="mb-3">
                                    <label class="form-label">
                                        <span>发布时间：</span>
                                        <span class="text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="文章的发布时间，留空则为当前时间">
                                            <i class="bi bi-info-circle ms-1"></i>
                                        </span>
                                    </label>
                                    <input type="datetime-local" v-model="state.struct.publishTime" class="form-control" step="1" placeholder="选择发布时间">
                                </div>
                                <!-- 审核状态 -->
                                <div v-if="store.comm.login.user.result.auth.all === true" class="mb-3">
                                    <label class="form-label">
                                        <span>审核状态：</span>
                                        <span class="text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="审核状态">
                                            <i class="bi bi-info-circle ms-1"></i>
                                        </span>
                                    </label>
                                    <select v-model="state.struct.audit" class="form-select">
                                        <option value="">请选择</option>
                                        <option v-for="item in state.select.audit" :key="item.value" :value="item.value">
                                            {{ item.label }} ({{ item.value }})
                                        </option>
                                    </select>
                                </div>
                                <!-- 摘要 -->
                                <div class="mb-3">
                                    <label class="form-label">
                                        <span>摘要：</span>
                                        <span class="text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="文章的摘要">
                                            <i class="bi bi-info-circle ms-1"></i>
                                        </span>
                                    </label>
                                    <textarea v-model="state.struct.abstract" class="form-control" rows="3" placeholder="简单的描述一下您的文章"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 封面图 -->
                    <div class="border rounded-3 mb-2 overflow-hidden">
                        <div class="bg-body-secondary px-3 py-2" data-bs-toggle="collapse" href="#collapse2" role="button" aria-expanded="false" aria-controls="collapse2">
                            <h6 class="mb-0">封面图</h6>
                        </div>
                        <div id="collapse2" class="collapse">
                            <div class="p-3">
                                <!-- 标签页 -->
                                <ul class="nav nav-tabs mb-3" id="coverTabs" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" :class="{ active: state.item.tabs === 'preview' }" id="preview-tab" data-bs-toggle="tab" data-bs-target="#preview" type="button" role="tab" aria-controls="preview" aria-selected="true" @click="state.item.tabs = 'preview'">预览</button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" :class="{ active: state.item.tabs === 'links' }" id="links-tab" data-bs-toggle="tab" data-bs-target="#links" type="button" role="tab" aria-controls="links" aria-selected="false" @click="state.item.tabs = 'links'">外链</button>
                                    </li>
                                </ul>
                                <div class="tab-content" id="coverTabsContent">
                                    <!-- 预览上传 -->
                                    <div class="tab-pane" :class="{ active: state.item.tabs === 'preview', show: state.item.tabs === 'preview' }" id="preview" role="tabpanel" aria-labelledby="preview-tab">
                                        <div class="border rounded-3 p-3 mb-3">
                                            <h6 class="mb-3">上传图片</h6>
                                            <input type="file" class="form-control mb-2" @change="method.cover.upload" multiple accept="image/*">
                                            <!-- 预览图 -->
                                            <div v-if="state.item.cover.preview.length > 0" class="mt-3">
                                                <h6 class="mb-2">已上传图片：</h6>
                                                <div class="d-flex flex-wrap gap-2">
                                                    <div v-for="(file, index) in state.item.cover.preview" :key="index" class="position-relative" style="width: 100px; height: 100px;">
                                                        <img :src="file.url" class="img-fluid rounded-3" style="width: 100%; height: 100%; object-fit: cover;">
                                                        <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0" @click="method.cover.remove(index)">
                                                            <i class="bi bi-x"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- 外链 -->
                                    <div class="tab-pane" :class="{ active: state.item.tabs === 'links', show: state.item.tabs === 'links' }" id="links" role="tabpanel" aria-labelledby="links-tab">
                                        <div class="border rounded-3 p-3">
                                            <h6 class="mb-3">外链图片地址</h6>
                                            <textarea v-model="state.item.cover.links" class="form-control" rows="4" placeholder="外链图片地址，一行一个" @change="method.cover.change"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 置顶、分类、标签 -->
                    <div class="border rounded-3 mb-2 overflow-hidden">
                        <div class="bg-body-secondary px-3 py-2" data-bs-toggle="collapse" href="#collapse3" role="button" aria-expanded="false" aria-controls="collapse3">
                            <h6 class="mb-0">置顶、分类、标签</h6>
                        </div>
                        <div id="collapse3" class="collapse">
                            <div class="p-3">
                                <!-- 置顶 -->
                                <div class="mb-3">
                                    <label class="form-label">
                                        <span>置顶：</span>
                                        <span class="text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="设置文章是否置顶">
                                            <i class="bi bi-info-circle ms-1"></i>
                                        </span>
                                    </label>
                                    <select v-model="state.struct.top" class="form-select">
                                        <option value="">请选择</option>
                                        <option v-for="item in state.select.top" :key="item.value" :value="item.value">
                                            {{ item.label }}
                                        </option>
                                    </select>
                                </div>
                                <!-- 分类 -->
                                <div class="mb-3">
                                    <label class="form-label">
                                        <span>分类：</span>
                                        <span class="text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="可同时选择多个分类">
                                            <i class="bi bi-info-circle ms-1"></i>
                                        </span>
                                    </label>
                                    <!-- 简化的分类选择 -->
                                    <select v-model="state.item.group" class="form-select" multiple>
                                        <option v-for="item in state.select.group" :key="item.value" :value="item.value">
                                            {{ item.label }}
                                        </option>
                                    </select>
                                </div>
                                <!-- 标签 -->
                                <div class="mb-3">
                                    <label class="form-label">
                                        <span>标签：</span>
                                        <span class="text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="可同时选择多个标签">
                                            <i class="bi bi-info-circle ms-1"></i>
                                        </span>
                                    </label>
                                    <div class="input-group">
                                        <input type="text" v-model="newTag" class="form-control" placeholder="输入标签名称">
                                        <button class="btn btn-outline-secondary" type="button" @click="addTag">添加</button>
                                    </div>
                                    <!-- 已选标签 -->
                                    <div v-if="state.item.tags.length > 0" class="mt-2">
                                        <span v-for="(tag, index) in state.item.tags" :key="index" class="badge bg-primary me-1 mb-1">
                                            {{ getTagName(tag) }}
                                            <button type="button" class="btn-close btn-close-white btn-sm ms-1" @click="removeTag(index)"></button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 高级选项 -->
                    <div class="border rounded-3 overflow-hidden">
                        <div class="bg-body-secondary px-3 py-2" data-bs-toggle="collapse" href="#collapse4" role="button" aria-expanded="false" aria-controls="collapse4">
                            <h6 class="mb-0">高级选项</h6>
                        </div>
                        <div id="collapse4" class="collapse">
                            <div class="p-3">
                                <!-- 允许评论 -->
                                <div class="mb-3">
                                    <label class="form-label">
                                        <span>允许评论：</span>
                                        <span class="text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="对当前文章的评论选项单独控制">
                                            <i class="bi bi-info-circle ms-1"></i>
                                        </span>
                                    </label>
                                    <select v-model="state.struct.json.comment.allow" class="form-select">
                                        <option value="">请选择</option>
                                        <option v-for="item in state.select.comment.allow" :key="item.value" :value="item.value">
                                            {{ item.label }} ({{ item.value }})
                                        </option>
                                    </select>
                                </div>
                                <!-- 显示评论 -->
                                <div class="mb-3">
                                    <label class="form-label">
                                        <span>显示评论：</span>
                                        <span class="text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="对当前文章的评论选项单独控制">
                                            <i class="bi bi-info-circle ms-1"></i>
                                        </span>
                                    </label>
                                    <select v-model="state.struct.json.comment.show" class="form-select">
                                        <option value="">请选择</option>
                                        <option v-for="item in state.select.comment.show" :key="item.value" :value="item.value">
                                            {{ item.label }} ({{ item.value }})
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import utils from '@/utils/utils'
import { request, cache } from '@/utils/network'
import IMdEditor from '@/comps/custom/i-md-editor.vue'
import { useCommStore } from '@/store/comm'
import { usePageTitle } from '@/utils/app'
import { toast } from '@/utils/app'

// 路由和状态管理
const route = useRoute()
const router = useRouter()
const store = {
    comm: useCommStore(),
}

// 页面标题管理
const { setDynamicTitle } = usePageTitle()

// 根据是否有id参数设置页面标题
const updatePageTitle = () => {
    const id = route.params?.id
    if (id) {
        setDynamicTitle(`编辑文章 - ${state.struct.title || '加载中...'}`)
    } else {
        setDynamicTitle('撰写文章')
    }
}

// 编辑器引用
const vditorRef = ref(null)

// 新标签输入
const newTag = ref('')

// 获取当前时间的 datetime-local 格式
const getCurrentDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

// 保存原始评论配置用于检测变化
const originalCommentConfig = ref({ allow: 1, show: 1 })

// 初始化原始配置
const initOriginalCommentConfig = (config) => {
    if (config && config.comment) {
        originalCommentConfig.value = {
            allow: config.comment.allow ?? 1,
            show: config.comment.show ?? 1
        }
    }
}

// 检测评论配置是否发生变化
const hasCommentConfigChanged = () => {
    const current = state.struct.json?.comment || {}
    return (
        current.allow !== originalCommentConfig.value.allow ||
        current.show !== originalCommentConfig.value.show
    )
}

// 清空文章相关缓存
const clearArticleCache = () => {
    try {
        // 清空文章相关的缓存键
        const cacheKeysToClear = [
            `article_${state.item.id}`,
            'article_list',
            'article_count',
            'article_archives'
        ]
        
        cacheKeysToClear.forEach(key => {
            cache.del(key)
        })
        
        // 也清空 localStorage 中可能的相关缓存
        Object.keys(localStorage).forEach(key => {
            if (key.includes('article') || key.includes('Article')) {
                localStorage.removeItem(key)
            }
        })
        
        console.log('文章相关缓存已清空')
    } catch (error) {
        console.error('清空缓存失败:', error)
    }
}

// 响应式状态
const state = reactive({
    item: {
        id: null,
        tags: [],
        group: [],
        tabs: 'preview',
        // 封面数据
        cover: {
            // 预览图
            preview: [],
            // 外链图
            links: ''
        },
        loading: false,
        wait: false
    },
    struct: {
        content: '',
        editor: 'vditor',
        publishTime: getCurrentDateTime(),
        json: { comment: { allow: 1, show: 1 } }
    },
    select: {
        top: [{ value: 1, label: '置顶' }, { value: 0, label: '不置顶' }],
        tags: [],
        group: [],
        comment: {
            allow: [
                { value: 1, label: '允许' },
                { value: 0, label: '禁止' },
            ],
            show: [
                { value: 1, label: '显示' },
                { value: 0, label: '隐藏' },
            ]
        },
        audit: [
            { value: 0, label: '待审核' },
            { value: 1, label: '通过' },
            { value: 2, label: '不通过' },
        ],
    },
    backup: {
        group: [],
    },
})

// 方法
const method = {
    init: async () => {
        let id = route.params?.id
        if (!utils.is.empty(id)) {
            state.item.id = parseInt(id)
            state.item.loading = true
        }
        await method.getGroup()
        await method.getTags()
        if (!utils.is.empty(state.item.id)) await method.getArticle(state.item.id)
        else {
            state.struct.editor = 'vditor'
        }
    },
    // 获取文章信息
    getArticle: async (id = null) => {
        try {
            const { code, msg, data } = await request.get('/api/article/one', { id })
            if (code !== 200) {
                await router.push({ path: '/admin/article/write' })
                toast.info(`已为您跳转到文章撰写页！${msg}`)
                return
            }

            // 合并 json 项默认数据
            const articleData = { ...data, json: Object.assign({}, data.json, state.struct.json) }
            
            // 处理发布时间：将 Unix 时间戳转换为 ISO 格式，兼容 datetime-local 输入
            if (data.publish_time && data.publish_time > 0) {
                const date = new Date(data.publish_time * 1000)
                // 手动构建本地时间字符串，确保时区正确
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')
                const hours = String(date.getHours()).padStart(2, '0')
                const minutes = String(date.getMinutes()).padStart(2, '0')
                const seconds = String(date.getSeconds()).padStart(2, '0')
                articleData.publishTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
            } else {
                // 当 publish_time 为 0 时，默认填充当前时间
                articleData.publishTime = getCurrentDateTime()
            }
            
            state.struct = articleData
            // 强制使用 Vditor
            state.struct.editor = 'vditor'
            // 保存原始评论配置
            initOriginalCommentConfig(data.json)

            // 封面图 - 字符串转数组 - name 正则出文件名部分
            if (!utils.is.empty(data.covers)) {
                state.item.cover.preview = data.covers.split(',').map(item => ({
                    name: item.replace(/.*\//, ''), url: item,
                }))
            }
            // 分类 - 字符串转数组 - 去空 去重 转int
            if (!utils.is.empty(data.group)) {
                state.item.group = data.group.split('|').filter(item => !utils.is.empty(item)).map(item => parseInt(item))
            }
            // 标签 - 字符串转数组 - 去空 去重 转int
            if (!utils.is.empty(data.tags)) {
                state.item.tags = data.tags.split('|').filter(item => !utils.is.empty(item)).map(item => parseInt(item))
            }

            // 关闭加载状态
            if (!utils.is.empty(id)) state.item.loading = false
        } catch (error) {
            console.error('获取文章信息失败:', error)
            toast.error('获取文章信息失败，请重试')
            state.item.loading = false
        }
    },
    // 获取文章分组
    getGroup: async () => {
        try {
            const { code, data } = await request.get('/api/article-group/column', {
                field: 'id,pid,name,avatar'
            })
            if (code !== 200) return
            state.backup.group = data
            state.select.group = data.map(item => ({ value: item.id, label: item.name }))
        } catch (error) {
            console.error('获取文章分组失败:', error)
        }
    },
    // 获取文章标签
    getTags: async () => {
        try {
            const { code, data } = await request.get('/api/tags/column', {
                field: 'id,name'
            })
            if (code !== 200) return
            state.select.tags = data.map(item => ({ value: item.id, label: item.name }))
        } catch (error) {
            console.error('获取文章标签失败:', error)
        }
    },
    // 保存
    save: async () => {
        try {
            // md-editor-v3 内容通过 v-model 双向绑定，直接使用 state.struct.content
            if (!state.struct.content) {
                toast.warning('编辑器尚未加载完成，请稍候重试')
                return
            }

            // 正则匹配纯文本内容 - 去除换行符
            const reg = /<[^>]+>/g
            // 文章字数
            let length = state.struct?.content?.replace(reg, '')?.replace(/\n/g, '')?.length || 0
            switch (length) {
                case 0:
                    return toast.warning('你这文章一个字都没写，糊弄谁呢？')
                case 1:
                    return toast.warning('真就只写一个字呗？')
                default:
                    if (length < 10) return toast.warning('你这太水了，10个字都不到。')
            }
            if (utils.is.empty(state.struct?.title)) return toast.warning('你可能忘记写标题了')

            // 封面图 - 去空
            let covers = state.item.cover.links.split('\n').filter(item => !utils.is.empty(item))
            // 分类 - 去空 去重 排序
            let group = Array.from(new Set(state.item.group.filter(item => item))).sort((a, b) => a - b)

            state.struct.covers = !utils.is.empty(covers) ? covers.join(',') : ''
            state.struct.tags = !utils.is.empty(state.item.tags) ? `|${state.item.tags.join('|')}|` : ''
            state.struct.group = !utils.is.empty(group) ? `|${group.join('|')}|` : ''

            // 处理发布时间：将 YYYY-MM-DD HH:mm:ss 格式转换为 Unix 时间戳
            const saveData = { ...state.struct, json: JSON.stringify(state.struct.json) }
            saveData.status = 1
            if (state.struct.publishTime) {
                saveData.publish_time = Math.floor(new Date(state.struct.publishTime).getTime() / 1000)
            }
            delete saveData.publishTime

            state.item.wait = true

            let response
            if (state.item.id) {
                response = await request.put('/api/article/update', saveData)
            } else {
                response = await request.post('/api/article/create', saveData)
            }

            const { code, msg, data } = response

            state.item.wait = false

            if (code !== 200) return toast.error('保存失败：' + msg)

            toast.success('保存成功：' + msg)

            // 检测评论配置是否变化，如果变化则清空缓存
            if (hasCommentConfigChanged()) {
                clearArticleCache()
            }

            state.item.id = data.id
            state.struct.id = data.id

            await router.push({ path: '/admin/article/write/' + parseInt(data.id) })
        } catch (error) {
            console.error('保存文章失败:', error)
            toast.error('保存文章失败，请重试')
            state.item.wait = false
        }
    },
    // 保存为草稿
    saveAsDraft: async () => {
        try {
            if (utils.is.empty(state.struct?.content)) return toast.warning('你可能忘记写内容了')
            if (utils.is.empty(state.struct?.title)) return toast.warning('你可能忘记写标题了')

            let covers = state.item.cover.links.split('\n').filter(item => !utils.is.empty(item))
            let group = Array.from(new Set(state.item.group.filter(item => item))).sort((a, b) => a - b)

            state.struct.covers = !utils.is.empty(covers) ? covers.join(',') : ''
            state.struct.tags = !utils.is.empty(state.item.tags) ? `|${state.item.tags.join('|')}|` : ''
            state.struct.group = !utils.is.empty(group) ? `|${group.join('|')}|` : ''

            const saveData = { ...state.struct, json: JSON.stringify(state.struct.json) }
            saveData.status = 0
            if (state.struct.publishTime) {
                saveData.publish_time = Math.floor(new Date(state.struct.publishTime).getTime() / 1000)
            }
            delete saveData.publishTime

            state.item.wait = true

            let response
            if (state.item.id) {
                response = await request.put('/api/article/update', saveData)
            } else {
                response = await request.post('/api/article/create', saveData)
            }

            const { code, msg, data } = response

            state.item.wait = false

            if (code !== 200) return toast.error('保存失败：' + msg)

            toast.success('草稿保存成功：' + msg)

            // 检测评论配置是否变化，如果变化则清空缓存
            if (hasCommentConfigChanged()) {
                clearArticleCache()
            }

            state.item.id = data.id
            state.struct.id = data.id

            await router.push({ path: '/admin/article/write/' + parseInt(data.id) })
        } catch (error) {
            console.error('保存草稿失败:', error)
            toast.error('保存草稿失败，请重试')
            state.item.wait = false
        }
    },
    // 封面图相关方法
    cover: {
        // 移除封面图
        remove: (index) => {
            state.item.cover.preview.splice(index, 1)
        },
        // 上传图片
        upload: async (event) => {
            const files = event.target.files
            if (!files || files.length === 0) return

            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    const formData = new FormData()
                    formData.append('file', file)

                    const { code, msg, data } = await request.post('/api/file/upload', formData, {
                        headers: method.headers()
                    })

                    if (code !== 200) {
                        toast.error('上传失败：' + msg)
                        continue
                    }

                    if (data?.path) {
                        state.item.cover.preview.push({
                            name: file.name,
                            url: data.path
                        })
                    }
                }
            } catch (error) {
            console.error('上传图片失败:', error)
            toast.error('上传图片失败，请重试')
        }
        },
        // 外链输入框事件
        change: (event) => {
            const value = event.target.value
            state.item.cover.preview = value.split('\n').filter(item => !utils.is.empty(item)).map(item => ({
                name: item.replace(/.*\//, ''),
                url: item
            }))
        }
    },
    // 文件上传自定义头
    headers: () => {
        let result = {}
        if (!utils.is.empty(globalThis?.inis?.api?.key)) {
            result['i-api-key'] = globalThis?.inis?.api?.key
        }
        let TOKEN_NAME = globalThis?.inis?.token_name || 'INIS_LOGIN_TOKEN'
        if (utils.has.cookie(TOKEN_NAME)) {
            let token = utils.get.cookie(TOKEN_NAME)
            if (!utils.is.empty(token)) {
                result.Authorization = token
            }
        }
        return result
    },
}

// 添加标签
const addTag = async () => {
    if (utils.is.empty(newTag.value)) return

    try {
        // 检查标签是否已存在
        const existingTag = state.select.tags.find(tag => tag.label === newTag.value)
        if (existingTag) {
            if (!state.item.tags.includes(existingTag.value)) {
                state.item.tags.push(existingTag.value)
            }
            newTag.value = ''
            return
        }

        // 创建新标签
        const { code, msg, data } = await request.post('/api/tags/save', { name: newTag.value })
        if (code !== 200) {
            toast.error('添加标签失败：' + msg)
            return
        }

        // 添加到标签列表
        state.select.tags.push({ value: data.id, label: newTag.value })
        state.item.tags.push(data.id)
        newTag.value = ''
    } catch (error) {
        console.error('添加标签失败:', error)
        toast.error('添加标签失败，请重试')
    }
}

// 移除标签
const removeTag = (index) => {
    state.item.tags.splice(index, 1)
}

// 获取标签名称
const getTagName = (tagId) => {
    const tag = state.select.tags.find(t => t.value === tagId)
    return tag ? tag.label : tagId
}

// 初始化
onMounted(async () => {
    await method.init()
    updatePageTitle()
    
    // 初始化Bootstrap组件
    if (window.bootstrap) {
        // 初始化tooltip
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new window.bootstrap.Tooltip(tooltipTriggerEl))
        
        // 初始化tab
        const tabElementList = document.querySelectorAll('[data-bs-toggle="tab"]')
        const tabList = [...tabElementList].map(tabEl => new window.bootstrap.Tab(tabEl))
    }
})

// 监听封面图预览图变化
watch(() => state.item.cover.preview, (value = []) => {
    state.item.cover.links = value.map(item => item.url).join('\n') + '\n'
}, { deep: true })

watch(() => state.item.cover.links, (value) => {
    // 去除空格和换行
    value = value?.replace(/[\s\n]/g, '')
    // 判断是否为空
    if (!utils.is.empty(value)) return
    state.item.cover.links = ''
})

watch(() => route.params?.id, (value) => {
    if (utils.is.empty(value)) return
    method.init()
    updatePageTitle()
})

// 监听文章标题变化，更新页面标题
watch(() => state.struct.title, () => {
    updatePageTitle()
})
</script>