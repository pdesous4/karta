import axios from "axios";
import { supabase } from "./supabase";

const api = axios.create({
  baseURL: "/api",
});

// Cached token — avoids calling getSession() on every request.
// Cleared on any auth state change (logout, token refresh).
let _token = null;
let _tokenExpiry = 0;

export function clearTokenCache() {
  _token = null;
  _tokenExpiry = 0;
}

api.interceptors.request.use(async (config) => {
  const now = Date.now();
  if (!_token || now >= _tokenExpiry) {
    const { data: { session } } = await supabase.auth.getSession();
    _token = session?.access_token ?? null;
    // expires_at is a Unix timestamp in seconds; refresh 60s before expiry
    _tokenExpiry = session?.expires_at
      ? session.expires_at * 1000 - 60_000
      : now + 55 * 60 * 1000;
  }
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

// Decks
export const getPublicDecks = () => api.get("/decks/");
export const getMyDecks = () => api.get("/decks/mine");
export const getDeck = (id) => api.get(`/decks/${id}`);
export const createDeck = (data) => api.post("/decks/", data);
export const updateDeck = (id, data) => api.put(`/decks/${id}`, data);
export const deleteDeck = (id) => api.delete(`/decks/${id}`);
export const getStudyCards = (deckId, mode = 'normal') => api.get(`/decks/${deckId}/study-cards?mode=${mode}`)

// Cards
export const getCards = (deckId) => api.get(`/decks/${deckId}/cards`);
export const addCard = (deckId, data) =>
  api.post(`/decks/${deckId}/cards`, data);
export const updateCard = (id, data) => api.put(`/cards/${id}`, data);
export const deleteCard = (id) => api.delete(`/cards/${id}`);

// Progress
export const updateProgress = (card_id, grade) =>
  api.post("/progress", { card_id, grade });
export const getDueCards = () => api.get("/progress/due");
export const getAllProgress = () => api.get("/progress");
export const getDueByDeck = () => api.get("/progress/due/by-deck");

// Ratings
export const rateDeck = (id, rating) =>
  api.post(`/decks/${id}/rate`, { rating });
export const getDeckRating = (id) => api.get(`/decks/${id}/rating`);
export const getMyRating = (id) => api.get(`/decks/${id}/myrating`);
export const getBulkRatings = (ids) =>
  api.get(`/ratings/bulk?deck_ids=${ids.join(",")}`);

// Audio
export const generateAudio = (text, language) =>
  api.post("/audio/generate", { text, language });

// Saved Decks
export const saveDeck = (id) => api.post(`/decks/${id}/save`);
export const isSaved = (id) => api.get(`/decks/${id}/saved`);
export const getSavedDecks = () => api.get("/saved");

export default api;
