import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyDecks, deleteDeck } from '../lib/api'

function MyDecks() {
    const [decks, setDecks] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMyDecks()
            .then(res => setDecks(res.data))
            .finally(() => setLoading(false))
    }, [])

    async function handleDelete(id) {
        if (!confirm('Delete this deck?')) return
        await deleteDeck(id)
        setDecks(prev => prev.filter(d => d.id !== id))
    }

    if (loading) return <div className="text-gray-400 text-sm">Loading...</div>

    return (
        <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">My Decks</h1>
                <Link
                    to="/create"
                    className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                    + New Deck
                </Link>
            </div>

            {decks.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-lg mb-2">No decks yet</p>
                    <p className="text-sm">Create your first deck to get started</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {decks.map(deck => (
                        <div
                            key={deck.id}
                            className="border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <h2 className="font-medium text-gray-900">{deck.title}</h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    {deck.language} · {deck.is_public ? 'Public' : 'Private'}
                                </p>
                                {deck.description && (
                                    <p className="text-sm text-gray-500 mt-1">{deck.description}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    to={`/study/${deck.id}`}
                                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Study
                                </Link>
                                <button
                                    onClick={() => handleDelete(deck.id)}
                                    className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MyDecks
