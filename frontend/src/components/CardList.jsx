import { useState } from "react";
import { generateAudio } from "../lib/api";
import CardForm from "./CardForm";

const EMPTY_CARD = {
  front: "",
  back: "",
  romanization: "",
  context: "",
  definition: "",
  example: "",
  example_translation: "",
  notes: "",
  image_url: "",
  audio_url: "",
  audio_slow_url: "",
};

function CardList({ cards, onChange, onAdd, onRemove, language }) {
  const [generatingAll, setGeneratingAll] = useState(false);

  async function handleGenerateAllAudio() {
    const targets = cards.filter((c) => c.back && !c.audio_url);
    if (!targets.length || !language) return;
    setGeneratingAll(true);
    try {
      const results = await Promise.all(
        targets.map((card) =>
          generateAudio(card.back, language)
            .then((res) => ({ back: card.back, ...res.data }))
            .catch(() => null),
        ),
      );
      results.forEach((result) => {
        if (!result) return;
        const index = cards.findIndex((c) => c.back === result.back);
        if (index === -1) return;
        onChange(index, "audio_url", result.audio_url);
        onChange(index, "audio_slow_url", result.audio_slow_url);
      });
    } finally {
      setGeneratingAll(false);
    }
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
          Cards{" "}
          <span className="text-gray-400 font-normal normal-case">
            ({cards.length})
          </span>
        </h2>
        <button
          onClick={handleGenerateAllAudio}
          disabled={
            generatingAll ||
            !cards.some((c) => c.back && !c.audio_url) ||
            !language
          }
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
        >
          {generatingAll ? "⟳ Generating..." : "🔊 Generate All"}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {cards.map((card, i) => (
          <CardForm
            key={card.id || `new-${i}`}
            card={card}
            index={i}
            language={language}
            onChange={(field, value) => onChange(i, field, value)}
            onRemove={() => onRemove(i)}
          />
        ))}
      </div>

      <button
        onClick={onAdd}
        className="w-full mt-4 border border-dashed border-gray-200 text-gray-400 rounded-xl py-3 text-sm hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        + Add Card
      </button>
    </section>
  );
}

export { EMPTY_CARD };
export default CardList;
