import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCards, getDeck, updateProgress } from "../lib/api";

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

function Study() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [deck, setDeck] = useState(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCards(deckId), getDeck(deckId)])
      .then(([cardsRes, deckRes]) => {
        setCards(cardsRes.data);
        setDeck(deckRes.data);
      })
      .finally(() => setLoading(false));
  }, [deckId]);

  const template = deck?.template || DEFAULT_TEMPLATE;

  const handleAnswer = useCallback(
    (correct) => {
      if (!flipped) return;
      const card = cards[idx];

      updateProgress(card.id, correct);

      setStats((prev) => ({
        correct: correct ? prev.correct + 1 : prev.correct,
        wrong: !correct ? prev.wrong + 1 : prev.wrong,
        streak: correct ? prev.streak + 1 : 0,
      }));

      if (!correct) setCards((prev) => [...prev, card]);

      setFlipped(false);
      setTimeout(() => setIdx((prev) => prev + 1), 200);
    },
    [flipped, cards, idx],
  );

  useEffect(() => {
    function handleKey(e) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.key === "ArrowRight" && flipped) handleAnswer(true);
      if (e.key === "ArrowLeft" && flipped) handleAnswer(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleAnswer, flipped]);

  function playAudio(url) {
    if (url) new Audio(url).play();
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading cards...
      </div>
    );

  if (!cards.length)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-400">No cards in this deck yet</p>
        <button
          onClick={() => navigate("/mydecks")}
          className="text-sm text-gray-600 underline"
        >
          Go back
        </button>
      </div>
    );

  if (idx >= cards.length)
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="text-2xl font-semibold text-gray-900">Deck Complete</h2>
        <p className="text-gray-400 text-sm">
          {stats.correct} correct · {stats.wrong} missed · {stats.streak} streak
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              getCards(deckId).then((res) => {
                setCards(res.data);
                setIdx(0);
                setFlipped(false);
                setStats({ correct: 0, wrong: 0, streak: 0 });
              });
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Study Again
          </button>
          <button
            onClick={() => navigate("/mydecks")}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Back to Decks
          </button>
        </div>
      </div>
    );

  const card = cards[idx];
  const progress = Math.round((idx / cards.length) * 100);

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center gap-8">
      {/* Progress */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>
            Card {idx + 1} of {cards.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm">
        <span className="text-green-600 font-medium">✓ {stats.correct}</span>
        <span className="text-red-500 font-medium">✗ {stats.wrong}</span>
        <span className="text-blue-500 font-medium">⚡ {stats.streak}</span>
      </div>

      {/* Card */}
      <div
        className="w-full cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "280px",
          }}
        >
          {/* ── Front ── */}
          <div
            className="absolute inset-0 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 p-8"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">
              {deck?.language || "English"}
            </span>

            <span className="text-3xl font-light text-gray-900 text-center">
              {card.front}
            </span>

            {template.show_context && card.context && (
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {card.context}
              </span>
            )}

            {template.front_audio && card.audio_url && (
              <div className="flex gap-2 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(card.audio_url);
                  }}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-sm"
                  title="Play audio"
                >
                  🔊
                </button>
                {template.back_audio_slow && card.audio_slow_url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(card.audio_slow_url);
                    }}
                    className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-sm"
                    title="Slow audio"
                  >
                    🐢
                  </button>
                )}
              </div>
            )}

            <span className="text-xs text-gray-300 absolute bottom-5">
              tap to reveal · space
            </span>
          </div>

          {/* ── Back ── */}
          <div
            className="absolute inset-0 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 p-8"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">
              Answer
            </span>

            <span className="text-3xl font-light text-gray-900 text-center">
              {card.back}
            </span>

            {template.show_romanization && card.romanization && (
              <span className="text-sm text-gray-400 italic">
                {card.romanization}
              </span>
            )}

            {template.show_definition && card.definition && (
              <div className="w-full border-t border-gray-100 pt-3 mt-1 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Definition
                </p>
                <p className="text-sm text-gray-600">{card.definition}</p>
              </div>
            )}

            {template.show_example && card.example && (
              <div className="w-full border-t border-gray-100 pt-3 mt-1 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Example
                </p>
                <p className="text-sm text-gray-600 italic">"{card.example}"</p>
                {card.example_translation && (
                  <p className="text-xs text-gray-400 mt-1">
                    {card.example_translation}
                  </p>
                )}
                {card.example_audio_url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(card.example_audio_url);
                    }}
                    className="mt-2 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-xs mx-auto"
                    title="Play example"
                  >
                    🔊
                  </button>
                )}
              </div>
            )}

            {template.show_image && card.image_url && (
              <img
                src={card.image_url}
                alt={card.back}
                className="w-24 h-24 object-cover rounded-lg border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {template.back_audio && card.audio_url && (
              <div className="flex gap-2 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(card.audio_url);
                  }}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-sm"
                  title="Normal speed"
                >
                  🔊
                </button>
                {template.back_audio_slow && card.audio_slow_url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(card.audio_slow_url);
                    }}
                    className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-sm"
                    title="Slow speed"
                  >
                    🐢
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer buttons */}
      <div
        className={`flex gap-4 transition-opacity duration-200 ${flipped ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <button
          onClick={() => handleAnswer(false)}
          className="px-8 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          ✗ Missed
        </button>
        <button
          onClick={() => handleAnswer(true)}
          className="px-8 py-3 rounded-xl border border-green-200 text-green-600 text-sm font-medium hover:bg-green-50 transition-colors"
        >
          ✓ Got it
        </button>
      </div>

      <p className="text-xs text-gray-300">← miss · space to flip · got it →</p>
    </div>
  );
}

export default Study;

