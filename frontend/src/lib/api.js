import axios from 'axios'

const api = axios.create({
    baseURL: '/api'
})

// Automatically attach token to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Auth
export const register = (email, username, password) =>
    api.post('/auth/register', { email, username, password })

export const login = (email, password) =>
    api.post('/auth/login', { email, password })

export const getMe = () =>
    api.get('/auth/me')

// Decks
export const getPublicDecks = () =>
    api.get('/decks/')

export const getMyDecks = () =>
    api.get('/decks/mine')

export const getDeck = (id) =>
    api.get(`/decks/${id}`)

export const createDeck = (data) =>
    api.post('/decks/', data)

export const updateDeck = (id, data) =>
    api.put(`/decks/${id}`, data)

export const deleteDeck = (id) =>
    api.delete(`/decks/${id}`)

// Cards
export const getCards = (deckId) =>
    api.get(`/decks/${deckId}/cards`)

export const addCard = (deckId, data) =>
    api.post(`/decks/${deckId}/cards`, data)

export const updateCard = (id, data) =>
    api.put(`/cards/${id}`, data)

export const deleteCard = (id) =>
    api.delete(`/cards/${id}`)

// Progress
export const updateProgress = (card_id, correct) =>
    api.post('/progress', { card_id, correct })

export const getDueCards = () =>
    api.get('/progress/due')

export const getAllProgress = () =>
    api.get('/progress')

export default api
