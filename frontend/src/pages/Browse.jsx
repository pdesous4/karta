import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicDecks, getBulkRatings, rateDeck } from '../lib/api'
import StarRating from '../components/StarRating'

function Browse() {
    const [decks,    setDecks]    = useState([])
    const [search,   setSearch]   = useState('')
    const [loading,  setLoading]  = useState(true)
    const [expanded, setExpanded] = useState(null)
    const [ratings,  setRatings]  = useState({})
    const navigate = useNavigate()

    useEffect(() => {
        getPublicDecks()
            .then(res => setDecks(res.data))
            .finally(() => setLoading(false))
    }, [])

    async function loadRatings(language, decks) {
        const ids = decks.map(d => d.id)
        const res = await getBulkRatings(ids)
        setRatings(prev => ({ ...prev, ...res.data }))
    }

    async function handleRate(deckId, rating) {
        const res = await rateDeck(deckId, rating)
        setRatings(prev => ({ ...prev, [deckId]: res.data }))
    }

    function handleExpand(language) {
        const next = expanded === language ? null : language
        setExpanded(next)
        if (next) loadRatings(next, grouped[next])
    }

    const filtered = decks.filter(deck =>
        deck.title.toLowerCase().includes(search.toLowerCase()) ||
        deck.language.toLowerCase().includes(search.toLowerCase())
    )

    const grouped = filtered.reduce((acc, deck) => {
        const lang = deck.language || 'Other'
        if (!acc[lang]) acc[lang] = []
        acc[lang].push(deck)
        return acc
    }, {})

    const languages = Object.keys(grouped).sort()

    if (loading) return (
        <div className="text-gray-400 text-sm">Loading...</div>
    )

    return (
        <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Browse Decks</h1>
                <span className="text-sm text-gray-400">{decks.length} decks</span>
            </div>

            <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setExpanded(null) }}
                placeholder="Search by title or language..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-400 mb-4"
            />

            {languages.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-lg mb-2">No public decks yet</p>
                    <p className="text-sm">Be the first to publish one</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {languages.map(language => (
                        <div key={language} className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => handleExpand(language)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-900">{language}</span>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {grouped[language].length} deck{grouped[language].length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <span className={`text-gray-400 transition-transform duration-200 ${
                                    expanded === language ? 'rotate-180' : ''
                                }`}>
                                    ▾
                                </span>
                            </button>

                            {expanded === language && (
                                <div className="border-t border-gray-100">
                                    {grouped[language].map((deck, i) => (
                                        <div
                                            key={deck.id}
                                            className={`px-5 py-4 hover:bg-gray-50 transition-colors ${
                                                i !== grouped[language].length - 1 ? 'border-b border-gray-100' : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{deck.title}</p>
                                                    {deck.description && (
                                                        <p className="text-xs text-gray-400 mt-0.5">{deck.description}</p>
                                                    )}
                                                    <div className="mt-2">
                                                        <StarRating
                                                            average={ratings[deck.id]?.average}
                                                            count={ratings[deck.id]?.count}
                                                            onRate={rating => handleRate(deck.id, rating)}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/study/${deck.id}`)}
                                                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 ml-4"
                                                >
                                                    Study
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Browse