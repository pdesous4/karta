import { useState } from "react";
import { generateAudio } from "../lib/api";
import CardForm from "./CardForm";

export const EMPTY_CARD = {
  front: "",
  back: "",
  hint: "",
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
    const targets = cards
      .map((c, i) => ({ ...c, index: i }))
      .filter((c) => c.back && !c.audio_url);
    if (!targets.length || !language) return;

    setGeneratingAll(true);
    try {
      const results = await Promise.all(
        targets.map((card) =>
          generateAudio(card.back, language)
            .then((res) => ({ index: card.index, ...res.data }))
            .catch(() => null),
        ),
      );
      results.forEach((result) => {
        if (!result) return;
        onChange(result.index, "audio_url", result.audio_url);
        onChange(result.index, "audio_slow_url", result.audio_slow_url);
      });
    } finally {
      setGeneratingAll(false);
    }
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wider">
          Cards{" "}
          <span className="text-stone-400 font-normal normal-case">
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
          className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-40"
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
        className="w-full mt-4 border border-dashed border-stone-200 text-stone-400 rounded-xl py-3 text-sm hover:border-stone-400 hover:text-stone-600 transition-colors"
      >
        + Add Card
      </button>
    </section>
  );
}

export default CardList;
