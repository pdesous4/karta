import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDeck, addCard } from '../lib/api'

function CreateDeck() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [deck, setDeck] = useState(null)
    const [deckForm, setDeckForm] = useState({
        title: '',
        description: '',
        language: '',
        is_public: false
    })
    const [cards, setCards] = useState([])
    const [cardForm, setCardForm] = useState({
        front: '',
        back: '',
        romanization: ''
    })
    const [error, setError] = useState('')

    async function handleCreateDeck(e) {
        e.preventDefault()
        if (!deckForm.title || !deckForm.language) {
            setError('Title and language are required')
            return
        }
        try {
            const res = await createDeck(deckForm)
            setDeck(res.data)
            setStep(2)
            setError('')
        } catch {
            setError('Failed to create deck')
        }
    }

    async function handleAddCard(e) {
        e.preventDefault()
        if (!cardForm.front || !cardForm.back) {
            setError('Front and back are required')
            return
        }
        try {
            const res = await addCard(deck.id, cardForm)
            setCards(prev => [...prev, res.data])
            setCardForm({ front: '', back: '', romanization: '' })
            setError('')
        } catch {
            setError('Failed to add card')
        }
    }

    function handleDone() {
        navigate('/mydecks')
    }

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-gray-900 mb-8">Create Deck</h1>

            {/* Step 1 — Deck details */}
            {step === 1 && (
                <form onSubmit={handleCreateDeck} className="flex flex-col gap-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
                        <input
                            type="text"
                            value={deckForm.title}
                            onChange={e => setDeckForm(p => ({ ...p, title: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                            placeholder="e.g. Spanish Basics"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Language</label>
                        <input
                            type="text"
                            value={deckForm.language}
                            onChange={e => setDeckForm(p => ({ ...p, language: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                            placeholder="e.g. Spanish"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                            Description
                            <span className="text-gray-400 font-normal ml-1">(optional)</span>
                        </label>
                        <textarea
                            value={deckForm.description}
                            onChange={e => setDeckForm(p => ({ ...p, description: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                            rows={3}
                            placeholder="What is this deck about?"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_public"
                            checked={deckForm.is_public}
                            onChange={e => setDeckForm(p => ({ ...p, is_public: e.target.checked }))}
                            className="rounded"
                        />
                        <label htmlFor="is_public" className="text-sm text-gray-700">
                            Make this deck public
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 transition-colors mt-2"
                    >
                        Continue → Add Cards
                    </button>
                </form>
            )}

            {/* Step 2 — Add cards */}
            {step === 2 && (
                <div className="flex flex-col gap-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-medium text-gray-900">{deck.title}</h2>
                                <p className="text-sm text-gray-400">{deck.language}</p>
                            </div>
                            <div className="text-sm text-gray-400">
                                {cards.length} card{cards.length !== 1 ? 's' : ''} added
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAddCard} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Front</label>
                                <input
                                    type="text"
                                    value={cardForm.front}
                                    onChange={e => setCardForm(p => ({ ...p, front: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                                    placeholder="English"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Back</label>
                                <input
                                    type="text"
                                    value={cardForm.back}
                                    onChange={e => setCardForm(p => ({ ...p, back: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                                    placeholder="Translation"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                Romanization
                                <span className="text-gray-400 font-normal ml-1">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={cardForm.romanization}
                                onChange={e => setCardForm(p => ({ ...p, romanization: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                                placeholder="Pronunciation guide"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            + Add Card
                        </button>
                    </form>

                    {cards.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                Added cards
                            </h3>
                            {cards.map((card, i) => (
                                <div
                                    key={card.id}
                                    className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3"
                                >
                                    <span className="text-sm text-gray-900">{card.front}</span>
                                    <span className="text-sm text-gray-400">{card.back}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleDone}
                        className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    )
}

export default CreateDeck
