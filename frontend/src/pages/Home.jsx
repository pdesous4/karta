import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyDecks, getDueCards } from '../lib/api'
import useStore from '../store/index'

function Home() {
    const { user } = useStore()
    const [decks, setDecks] = useState([])
    const [due, setDue] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        getMyDecks().then(res => setDecks(res.data))
        getDueCards().then(res => setDue(res.data))
    }, [])

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome back{user ? `, ${user.user_metadata.username}` : ''}
            </h1>
            <p className="text-gray-400 text-sm mb-10">
                Ready to study?
            </p>

            {/* Due cards */}
            {due.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8">
                    <h2 className="font-medium text-blue-900 mb-1">
                        {due.length} card{due.length !== 1 ? 's' : ''} due for review
                    </h2>
                    <p className="text-sm text-blue-500">
                        Keep your streak going — review them now
                    </p>
                </div>
            )}

            {/* My decks */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-gray-900">My Decks</h2>
                <button
                    onClick={() => navigate('/create')}
                    className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                    + New
                </button>
            </div>

            {decks.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl text-gray-400">
                    <p className="mb-2">No decks yet</p>
                    <button
                        onClick={() => navigate('/create')}
                        className="text-sm text-gray-600 underline"
                    >
                        Create your first deck
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {decks.map(deck => (
                        <div
                            key={deck.id}
                            className="border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-gray-300 transition-colors cursor-pointer"
                            onClick={() => navigate(`/study/${deck.id}`)}
                        >
                            <div>
                                <h3 className="font-medium text-gray-900">{deck.title}</h3>
                                <p className="text-sm text-gray-400 mt-1">{deck.language}</p>
                            </div>
                            <span className="text-sm text-gray-400">Study →</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Home
