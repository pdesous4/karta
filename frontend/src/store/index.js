import { create } from 'zustand'
import { getMe } from '../lib/api'

const useStore = create((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: true,

    setUser: (user) => set({ user }),

    login: (token, user) => {
        localStorage.setItem('token', token)
        set({ token, user })
    },

    logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null })
    },

    loadUser: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            set({ isLoading: false })
            return
        }
        try {
            const res = await getMe()
            set({ user: res.data, isLoading: false })
        } catch {
            localStorage.removeItem('token')
            set({ token: null, user: null, isLoading: false })
        }
    }
}))

export default useStore
