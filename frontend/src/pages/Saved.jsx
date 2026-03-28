import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSavedDecks, saveDeck } from '../lib/api'

function Saved() {
    const [decks,   setDecks]   = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        getSavedDecks()
            .then(res => setDecks(res.data))
            .finally(() => setLoading(false))
    }, [])

    async function handleUnsave(deckId) {
        await saveDeck(deckId)
        setDecks(prev => prev.filter(d => d.id !== deckId))
    }

    if (loading) return <div className="text-gray-400 text-sm">Loading...</div>

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold text-gray-900 mb-8">Saved Decks</h1>

            {decks.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl text-gray-400">
                    <p className="mb-2">No saved decks yet</p>
                    <button
                        onClick={() => navigate('/browse')}
                        className="text-sm text-gray-600 underline"
                    >
                        Browse public decks
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {decks.map(deck => (
                        <div
                            key={deck.id}
                            className="border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <h3 className="font-medium text-gray-900">{deck.title}</h3>
                                <p className="text-sm text-gray-400 mt-1">{deck.language}</p>
                                {deck.description && (
                                    <p className="text-sm text-gray-500 mt-1">{deck.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => handleUnsave(deck.id)}
                                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400 transition-colors"
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={() => navigate(`/study/${deck.id}`)}
                                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Study
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Saved