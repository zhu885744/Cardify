// 权限页面状态管理
import { defineStore } from 'pinia'

export const useAuthPagesStore = defineStore('auth-pages', {
    state: () => ({
        flat: []
    }),
    getters: {
        getFlat: (state) => state.flat
    },
    actions: {
        setFlat(pages) {
            this.flat = pages || []
        }
    }
})
