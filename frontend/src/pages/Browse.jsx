import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicDecks } from '../lib/api'

function Browse() {
    const [decks, setDecks] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        getPublicDecks()
            .then(res => setDecks(res.data))
            .finally(() => setLoading(false))
    }, [])

    const filtered = decks.filter(deck =>
        deck.title.toLowerCase().includes(search.toLowerCase()) ||
        deck.language.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return (
        <div className="text-gray-400 text-sm">Loading...</div>
    )

    return (
        <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Browse Decks</h1>
            </div>

            <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or language..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-400 mb-6"
            />

            {filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-lg mb-2">No public decks yet</p>
                    <p className="text-sm">Be the first to publish one</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map(deck => (
                        <div
                            key={deck.id}
                            className="border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <h2 className="font-medium text-gray-900">{deck.title}</h2>
                                <p className="text-sm text-gray-400 mt-1">{deck.language}</p>
                                {deck.description && (
                                    <p className="text-sm text-gray-500 mt-1">{deck.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => navigate(`/study/${deck.id}`)}
                                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Study
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Browse
