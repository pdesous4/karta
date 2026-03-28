import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDeck, addCard, updateDeck, generateAudio } from '../lib/api'

const DEFAULT_TEMPLATE = {
    show_romanization: true,
    show_context:      true,
    show_definition:   false,
    show_example:      false,
    show_image:        false,
    front_audio:       false,
    back_audio:        true,
    back_audio_slow:   true,
}

// ── Card Form Component ───────────────────────────────────
function CardForm({ card, index, onChange, onRemove, language }) {
    const [expanded,        setExpanded]        = useState(false)
    const [generatingAudio, setGeneratingAudio] = useState(false)

    async function handleGenerateAudio() {
        if (!card.back || !language) return
        setGeneratingAudio(true)
        try {
            const res = await generateAudio(card.back, language)
            onChange('audio_url',      res.data.audio_url)
            onChange('audio_slow_url', res.data.audio_slow_url)
        } catch {
            alert('Failed to generate audio')
        } finally {
            setGeneratingAudio(false)
        }
    }

    return (
        <div className="flex flex-col gap-3 border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Card {index + 1}
                </span>
                <button
                    onClick={onRemove}
                    className="text-xs text-red-400 hover:text-red-600"
                >
                    Remove
                </button>
            </div>

            {/* Required fields */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Front</label>
                    <input
                        type="text"
                        value={card.front}
                        onChange={e => onChange('front', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                        placeholder="English"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Back</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={card.back}
                            onChange={e => onChange('back', e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                            placeholder="Translation"
                        />
                        <button
                            onClick={handleGenerateAudio}
                            disabled={!card.back || !language || generatingAudio}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-700 hover:border-gray-400 transition-colors disabled:opacity-30 text-sm"
                            title="Generate audio"
                        >
                            {generatingAudio ? '...' : '🔊'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Audio preview */}
            {card.audio_url && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-green-500">✓</span>
                    Audio generated
                    <button
                        onClick={() => new Audio(card.audio_url).play()}
                        className="underline hover:text-gray-600"
                    >
                        Preview
                    </button>
                    <button
                        onClick={() => {
                            onChange('audio_url', '')
                            onChange('audio_slow_url', '')
                        }}
                        className="text-red-400 hover:text-red-600"
                    >
                        Remove
                    </button>
                </div>
            )}

            <div>
                <label className="text-xs text-gray-500 block mb-1">
                    Romanization <span className="text-gray-300">(optional)</span>
                </label>
                <input
                    type="text"
                    value={card.romanization || ''}
                    onChange={e => onChange('romanization', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    placeholder="Pronunciation guide"
                />
            </div>

            {/* Toggle optional fields */}
            <button
                onClick={() => setExpanded(p => !p)}
                className="text-xs text-gray-400 hover:text-gray-600 text-left flex items-center gap-1"
            >
                <span>{expanded ? '▾' : '▸'}</span>
                {expanded ? 'Hide optional fields' : 'Add more details'}
            </button>

            {/* Optional fields */}
            {expanded && (
                <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Context</label>
                        <input
                            type="text"
                            value={card.context || ''}
                            onChange={e => onChange('context', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                            placeholder="e.g. (plural), (formal), (body part)"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Definition</label>
                        <textarea
                            value={card.definition || ''}
                            onChange={e => onChange('definition', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                            placeholder="Dictionary definition in English"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Example sentence</label>
                        <input
                            type="text"
                            value={card.example || ''}
                            onChange={e => onChange('example', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                            placeholder="Example in target language"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Example translation</label>
                        <input
                            type="text"
                            value={card.example_translation || ''}
                            onChange={e => onChange('example_translation', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                            placeholder="English translation of example"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Image URL</label>
                        <input
                            type="text"
                            value={card.image_url || ''}
                            onChange={e => onChange('image_url', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                            placeholder="https://..."
                        />
                        {card.image_url && (
                            <img
                                src={card.image_url}
                                alt="preview"
                                className="mt-2 h-20 w-20 object-cover rounded-lg border border-gray-100"
                                onError={e => e.target.style.display = 'none'}
                            />
                        )}
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Notes</label>
                        <textarea
                            value={card.notes || ''}
                            onChange={e => onChange('notes', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                            placeholder="Any additional notes"
                            rows={2}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Create Deck Page ──────────────────────────────────────
function CreateDeck() {
    const navigate = useNavigate()
    const [step,         setStep]         = useState(1)
    const [deck,         setDeck]         = useState(null)
    const [error,        setError]        = useState('')
    const [template,     setTemplate]     = useState(DEFAULT_TEMPLATE)
    const [generatingAll, setGeneratingAll] = useState(false)

    const [deckForm, setDeckForm] = useState({
        title:       '',
        description: '',
        language:    '',
        is_public:   false
    })

    const [cards, setCards] = useState([{
        front: '', back: '', romanization: '',
        context: '', definition: '', example: '',
        example_translation: '', notes: '', image_url: '',
        audio_url: '', audio_slow_url: ''
    }])

    async function handleCreateDeck(e) {
        e.preventDefault()
        if (!deckForm.title || !deckForm.language) {
            setError('Title and language are required')
            return
        }
        try {
            const res = await createDeck({ ...deckForm, template: DEFAULT_TEMPLATE })
            setDeck(res.data)
            setStep(2)
            setError('')
        } catch {
            setError('Failed to create deck')
        }
    }

    async function handleGenerateAllAudio() {
        const cardsWithBack = cards.filter(c => c.back && !c.audio_url)
        if (cardsWithBack.length === 0) return

        setGeneratingAll(true)
        try {
            const results = await Promise.all(
                cardsWithBack.map(card =>
                    generateAudio(card.back, deck.language)
                        .then(res => ({ back: card.back, ...res.data }))
                        .catch(() => null)
                )
            )

            setCards(prev => prev.map(card => {
                const result = results.find(r => r?.back === card.back)
                if (!result) return card
                return {
                    ...card,
                    audio_url:      result.audio_url,
                    audio_slow_url: result.audio_slow_url
                }
            }))
        } finally {
            setGeneratingAll(false)
        }
    }

    function handleContinueToTemplate() {
        const valid = cards.filter(c => c.front && c.back)
        if (valid.length === 0) {
            setError('Add at least one card with front and back')
            return
        }
        setError('')
        setStep(3)
    }

    async function handleDone() {
        try {
            await Promise.all([
                ...cards
                    .filter(c => c.front && c.back)
                    .map(card => addCard(deck.id, card)),
                updateDeck(deck.id, { template })
            ])
            navigate('/mydecks')
        } catch {
            setError('Failed to save deck')
        }
    }

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-gray-900 mb-8">Create Deck</h1>

            {/* ── Step 1 — Deck details ── */}
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

            {/* ── Step 2 — Add cards ── */}
            {step === 2 && (
                <div className="flex flex-col gap-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-medium text-gray-900">{deck.title}</h2>
                                <p className="text-sm text-gray-400">{deck.language}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-400">
                                    {cards.length} card{cards.length !== 1 ? 's' : ''}
                                </div>
                                <button
                                    onClick={handleGenerateAllAudio}
                                    disabled={generatingAll || !cards.some(c => c.back && !c.audio_url)}
                                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center gap-1"
                                >
                                    {generatingAll ? (
                                        <>⟳ Generating...</>
                                    ) : (
                                        <>🔊 Generate All</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        {cards.map((card, i) => (
                            <CardForm
                                key={i}
                                card={card}
                                index={i}
                                language={deck?.language || ''}
                                onChange={(field, value) => setCards(prev => prev.map((c, j) =>
                                    j === i ? { ...c, [field]: value } : c
                                ))}
                                onRemove={() => setCards(prev => prev.filter((_, j) => j !== i))}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => setCards(prev => [...prev, {
                            front: '', back: '', romanization: '',
                            context: '', definition: '', example: '',
                            example_translation: '', notes: '', image_url: '',
                            audio_url: '', audio_slow_url: ''
                        }])}
                        className="w-full border border-dashed border-gray-200 text-gray-400 rounded-xl py-3 text-sm hover:border-gray-400 hover:text-gray-600 transition-colors"
                    >
                        + Add Card
                    </button>

                    <button
                        onClick={handleContinueToTemplate}
                        className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                        Continue → Card Settings
                    </button>
                </div>
            )}

            {/* ── Step 3 — Template config ── */}
            {step === 3 && (
                <div className="flex flex-col gap-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <h2 className="font-medium text-gray-900">{deck.title}</h2>
                        <p className="text-sm text-gray-400">
                            {deck.language} · {cards.filter(c => c.front && c.back).length} cards
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">
                            What shows on your cards?
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            You can change this later from your deck settings.
                        </p>
                        <div className="flex flex-col gap-2">
                            {[
                                { key: "show_romanization", label: "Romanization",      desc: "Pronunciation guide" },
                                { key: "show_context",      label: "Context",           desc: "Hints like (plural), (formal)" },
                                { key: "show_definition",   label: "Definition",        desc: "Dictionary definition" },
                                { key: "show_example",      label: "Example sentence",  desc: "Usage in context with translation" },
                                { key: "show_image",        label: "Image",             desc: "Visual aid" },
                                { key: "front_audio",       label: "Audio on front",    desc: "Play audio before flipping" },
                                { key: "back_audio",        label: "Audio on back",     desc: "Play audio after flipping" },
                                { key: "back_audio_slow",   label: "Slow audio",        desc: "Slower pronunciation button" },
                            ].map(({ key, label, desc }) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{label}</p>
                                        <p className="text-xs text-gray-400">{desc}</p>
                                    </div>
                                    <button
                                        onClick={() => setTemplate(prev => ({ ...prev, [key]: !prev[key] }))}
                                        className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                                            template[key] ? 'bg-gray-900' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                                            template[key] ? 'left-5' : 'left-1'
                                        }`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleDone}
                        className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                        Create Deck
                    </button>
                </div>
            )}
        </div>
    )
}

export default CreateDeck