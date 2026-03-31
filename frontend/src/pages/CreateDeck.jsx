import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDeck, addCard } from "../lib/api";
import DeckFormFields from "../components/DeckFormFields";
import TemplateToggles from "../components/TemplateToggles";
import CardList, { EMPTY_CARD } from "../components/CardList";

const DEFAULT_TEMPLATE = {
  show_romanization: true,
  show_context: true,
  show_definition: false,
  show_example: false,
  show_image: false,
  front_audio: false,
  back_audio: true,
  back_audio_slow: true,
};

function CreateDeck() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deckForm, setDeckForm] = useState({
    title: "",
    description: "",
    language: "",
    is_public: false,
    daily_new_cards: 10,
  });
  const [template, setTemplate] = useState({ ...DEFAULT_TEMPLATE });
  const [cards, setCards] = useState([{ ...EMPTY_CARD }]);

  function handleDeckChange(field, value) {
    setDeckForm((p) => ({ ...p, [field]: value }));
  }

  function handleTemplateChange(key, value) {
    setTemplate((p) => ({ ...p, [key]: value }));
  }

  function handleCardChange(index, field, value) {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  function handleAddCard() {
    setCards((prev) => [...prev, { ...EMPTY_CARD }]);
  }

  function handleRemoveCard(index) {
    setCards((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!deckForm.title || !deckForm.language) {
      setError("Title and language are required");
      return;
    }
    const validCards = cards.filter((c) => c.front && c.back);
    if (validCards.length === 0) {
      setError("Add at least one card with front and back");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await createDeck({ ...deckForm, template });
      await Promise.all(validCards.map((card) => addCard(res.data.id, card)));
      navigate("/mydecks");
    } catch {
      setError("Failed to create deck");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Create Deck</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-6">
          {error}
        </div>
      )}

      <DeckFormFields deckForm={deckForm} onChange={handleDeckChange} />
      <TemplateToggles template={template} onChange={handleTemplateChange} />
      <CardList
        cards={cards}
        language={deckForm.language}
        onChange={handleCardChange}
        onAdd={handleAddCard}
        onRemove={handleRemoveCard}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {saving ? "Creating..." : "Create Deck"}
      </button>
    </div>
  );
}

export default CreateDeck;
