import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDeck,
  getCards,
  updateDeck,
  addCard,
  updateCard,
  deleteCard,
} from "../lib/api";
import DeckFormFields from "../components/DeckFormFields";
import TemplateToggles from "../components/TemplateToggles";
import CardList, { EMPTY_CARD } from "../components/CardList";

function EditDeck() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deckForm, setDeckForm] = useState({
    title: "",
    description: "",
    language: "",
    is_public: false,
  });
  const [template, setTemplate] = useState({});
  const [cards, setCards] = useState([]);

  useEffect(() => {
    Promise.all([getDeck(deckId), getCards(deckId)])
      .then(([deckRes, cardsRes]) => {
        const d = deckRes.data;
        setDeckForm({
          title: d.title,
          description: d.description || "",
          language: d.language,
          is_public: d.is_public,
        });
        setTemplate(d.template || {});
        setCards(cardsRes.data);
      })
      .catch(() => setError("Failed to load deck"))
      .finally(() => setLoading(false));
  }, [deckId]);

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

  async function handleRemoveCard(index) {
    const card = cards[index];
    if (card.id) {
      if (!confirm("Delete this card?")) return;
      await deleteCard(card.id);
    }
    setCards((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!deckForm.title || !deckForm.language) {
      setError("Title and language are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateDeck(deckId, { ...deckForm, template });
      await Promise.all(
        cards
          .filter((c) => c.front && c.back)
          .map((card) =>
            card.id ? updateCard(card.id, card) : addCard(deckId, card),
          ),
      );
      navigate("/mydecks");
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Deck</h1>
        <button
          onClick={() => navigate("/mydecks")}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← Back
        </button>
      </div>

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
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

export default EditDeck;
