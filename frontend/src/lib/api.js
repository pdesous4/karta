import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
    baseURL: '/api'
})

// Attach Supabase session token to every request
api.interceptors.request.use(async config => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
})

// Decks
export const getPublicDecks = () => api.get('/decks/')
export const getMyDecks = () => api.get('/decks/mine')
export const getDeck = (id) => api.get(`/decks/${id}`)
export const createDeck = (data) => api.post('/decks/', data)
export const updateDeck = (id, data) => api.put(`/decks/${id}`, data)
export const deleteDeck = (id) => api.delete(`/decks/${id}`)

// Cards
export const getCards = (deckId) => api.get(`/decks/${deckId}/cards`)
export const addCard = (deckId, data) => api.post(`/decks/${deckId}/cards`, data)
export const updateCard = (id, data) => api.put(`/cards/${id}`, data)
export const deleteCard = (id) => api.delete(`/cards/${id}`)

// Progress
export const updateProgress = (card_id, correct) =>
    api.post('/progress', { card_id, correct })
export const getDueCards = () => api.get('/progress/due')
export const getAllProgress = () => api.get('/progress')

// Ratings
export const rateDeck    = (id, rating) => api.post(`/decks/${id}/rate`, { rating })
export const getDeckRating  = (id) => api.get(`/decks/${id}/rating`)
export const getMyRating    = (id) => api.get(`/decks/${id}/myrating`)
export const getBulkRatings = (ids) => api.get(`/ratings/bulk?deck_ids=${ids.join(',')}`)

// Audio
export const generateAudio = (text, language) =>
    api.post('/audio/generate', { text, language })

export default api
