import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useStore = create((set) => ({
    user: null,
    session: null,
    isLoading: true,

    loadUser: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        set({
            session,
            user: session?.user ?? null,
            isLoading: false,
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            set({
                session,
                user: session?.user ?? null,
            })
        })

        return () => subscription.unsubscribe()
    },

    logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null })
    },
}))

export default useStore