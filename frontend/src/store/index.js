import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { clearTokenCache, getMyDecks, getDueByDeck } from '../lib/api'

const useStore = create((set) => ({
    user: null,
    session: null,
    isLoading: true,
    decks: [],
    dueCounts: {},

    loadUser: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        set({
            session,
            user: session?.user ?? null,
            isLoading: false,
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            clearTokenCache()
            set({
                session,
                user: session?.user ?? null,
            })
        })

        return () => subscription.unsubscribe()
    },

    logout: async () => {
        await supabase.auth.signOut()
        clearTokenCache()
        set({ user: null, session: null, decks: [], dueCounts: {} })
    },

    loadDecks: async () => {
        const [decksRes, dueRes] = await Promise.all([getMyDecks(), getDueByDeck()])
        set({ decks: decksRes.data, dueCounts: dueRes.data })
    },

    removeDeck: (id) => set((state) => ({
        decks: state.decks.filter((d) => d.id !== id),
        dueCounts: Object.fromEntries(
            Object.entries(state.dueCounts).filter(([k]) => k !== id)
        ),
    })),
}))

export default useStore
