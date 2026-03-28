import { useState } from "react";
import { generateAudio } from "../lib/api";

function CardForm({ card, index, onChange, onRemove, language }) {
  const [expanded, setExpanded] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);

  async function handleGenerateAudio() {
    if (!card.back || !language) return;
    setGeneratingAudio(true);
    try {
      const res = await generateAudio(card.back, language);
      onChange("audio_url", res.data.audio_url);
      onChange("audio_slow_url", res.data.audio_slow_url);
    } catch {
      alert("Failed to generate audio");
    } finally {
      setGeneratingAudio(false);
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Front</label>
          <input
            type="text"
            value={card.front}
            onChange={(e) => onChange("front", e.target.value)}
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
              onChange={(e) => onChange("back", e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              placeholder="Translation"
            />
            <button
              onClick={handleGenerateAudio}
              disabled={!card.back || !language || generatingAudio}
              className="px-2 py-1 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-700 hover:border-gray-400 transition-colors disabled:opacity-30 text-sm"
              title="Generate audio"
            >
              {generatingAudio ? "..." : "🔊"}
            </button>
          </div>
        </div>
      </div>

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
              onChange("audio_url", "");
              onChange("audio_slow_url", "");
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
          value={card.romanization || ""}
          onChange={(e) => onChange("romanization", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          placeholder="Pronunciation guide"
        />
      </div>

      <button
        onClick={() => setExpanded((p) => !p)}
        className="text-xs text-gray-400 hover:text-gray-600 text-left flex items-center gap-1"
      >
        <span>{expanded ? "▾" : "▸"}</span>
        {expanded ? "Hide optional fields" : "Add more details"}
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
          {[
            {
              key: "context",
              label: "Context",
              placeholder: "e.g. (plural), (formal)",
            },
            {
              key: "definition",
              label: "Definition",
              placeholder: "Dictionary definition",
            },
            {
              key: "example",
              label: "Example sentence",
              placeholder: "Usage in context",
            },
            {
              key: "example_translation",
              label: "Example translation",
              placeholder: "English translation",
            },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">
                {label}
              </label>
              <input
                type="text"
                value={card[key] || ""}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                placeholder={placeholder}
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Image URL
            </label>
            <input
              type="text"
              value={card.image_url || ""}
              onChange={(e) => onChange("image_url", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              placeholder="https://..."
            />
            {card.image_url && (
              <img
                src={card.image_url}
                alt="preview"
                className="mt-2 h-20 w-20 object-cover rounded-lg border border-gray-100"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Notes</label>
            <textarea
              value={card.notes || ""}
              onChange={(e) => onChange("notes", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
              placeholder="Any additional notes"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CardForm;
