import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getStudyCards, getDeck, updateProgress } from "../lib/api";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function calcNextInterval(grade, interval, easeFactor) {
  if (grade === 0) return 1;
  if (grade === 1) return Math.max(1, Math.floor(interval * 1.2));
  if (grade === 2) return Math.max(1, Math.floor(interval * easeFactor));
  if (grade === 3) return Math.max(1, Math.floor(interval * easeFactor * 1.3));
}

function fmtInterval(days) {
  if (days < 2) return "1d";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}

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

const GRADES = [
  { grade: 0, label: "Again", key: "1", color: "border-red-200 text-red-500 hover:bg-red-50" },
  { grade: 1, label: "Hard",  key: "2", color: "border-orange-200 text-orange-500 hover:bg-orange-50" },
  { grade: 2, label: "Good",  key: "3", color: "border-green-200 text-green-600 hover:bg-green-50" },
  { grade: 3, label: "Easy",  key: "4", color: "border-blue-200 text-blue-500 hover:bg-blue-50" },
];

function Study() {
  const { deckId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "normal";
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [deck, setDeck] = useState(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState({ due: 0, new: 0 });
  const [noMoreNew, setNoMoreNew] = useState(false);
  const [lastState, setLastState] = useState(null);
  const touchStart = useRef(null);

  useEffect(() => {
    Promise.all([getStudyCards(deckId, mode), getDeck(deckId)])
      .then(([studyRes, deckRes]) => {
        const { due, new: newCards } = studyRes.data;
        setCards(shuffle([...due, ...newCards]));
        setSessionInfo({ due: due.length, new: newCards.length });
        setDeck(deckRes.data);
      })
      .finally(() => setLoading(false));
  }, [deckId, mode]);

  // Preload next card's audio while the user reads the current one
  useEffect(() => {
    const next = cards[idx + 1];
    if (!next) return;
    if (next.audio_url) {
      const a = new Audio();
      a.preload = "auto";
      a.src = next.audio_url;
    }
    if (next.audio_slow_url) {
      const a = new Audio();
      a.preload = "auto";
      a.src = next.audio_slow_url;
    }
  }, [idx, cards]);

  // Auto-play audio when card is revealed
  useEffect(() => {
    if (!flipped || !cards[idx]) return;
    const t = deck?.template || DEFAULT_TEMPLATE;
    if (t.back_audio && cards[idx].audio_url) {
      new Audio(cards[idx].audio_url).play().catch(() => {});
    }
  }, [flipped, idx, deck]);

  const template = deck?.template || DEFAULT_TEMPLATE;

  function handleStudyAnyway() {
    setLoading(true);
    setNoMoreNew(false);
    setCards([]);
    setIdx(0);
    getStudyCards(deckId, "force")
      .then((res) => {
        const { due, new: newCards } = res.data;
        const all = shuffle([...due, ...newCards]);
        if (!all.length) {
          setNoMoreNew(true);
        } else {
          setCards(all);
          setSessionInfo({ due: due.length, new: newCards.length });
          setFlipped(false);
          setStats({ correct: 0, wrong: 0, streak: 0 });
          setLastState(null);
        }
      })
      .finally(() => setLoading(false));
  }

  const handleUndo = useCallback(() => {
    if (!lastState) return;
    setIdx(lastState.idx);
    setCards(lastState.cards);
    setStats(lastState.stats);
    setFlipped(true);
    setLastState(null);
  }, [lastState]);

  const handleAnswer = useCallback(
    (grade) => {
      if (!flipped) return;
      const card = cards[idx];

      setLastState({ idx, cards: [...cards], stats: { ...stats } });
      updateProgress(card.id, grade);

      setStats((prev) => ({
        correct: grade > 0 ? prev.correct + 1 : prev.correct,
        wrong: grade === 0 ? prev.wrong + 1 : prev.wrong,
        streak: grade > 0 ? prev.streak + 1 : 0,
      }));

      if (grade === 0) {
        // Re-insert ~10 cards ahead instead of at the end
        setCards((prev) => {
          const next = [...prev];
          next.splice(Math.min(idx + 10, next.length), 0, card);
          return next;
        });
      }

      setFlipped(false);
      setIdx((prev) => prev + 1);
    },
    [flipped, cards, idx, stats],
  );

  useEffect(() => {
    function handleKey(e) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.key === "u" || e.key === "U") handleUndo();
      if (flipped) {
        if (e.key === "1") handleAnswer(0);
        if (e.key === "2") handleAnswer(1);
        if (e.key === "3") handleAnswer(2);
        if (e.key === "4") handleAnswer(3);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleAnswer, handleUndo, flipped]);

  function playAudio(url) {
    if (url) new Audio(url).play().catch(() => {});
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
        <p className="text-gray-400">
          {mode === "review"
            ? "No studied cards yet — start a normal session first."
            : "Nothing to study right now — you're all caught up!"}
        </p>
        {mode !== "review" && (
          <div className="flex gap-3">
            {noMoreNew ? (
              <p className="text-sm text-gray-400">
                No more new cards in this deck.
              </p>
            ) : (
              <button
                onClick={handleStudyAnyway}
                className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Study anyway
              </button>
            )}
            <button
              onClick={() => navigate(`/study/${deckId}?mode=review`)}
              className="text-sm px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Review
            </button>
          </div>
        )}
        <button
          onClick={() => navigate("/mydecks")}
          className="text-sm text-gray-400 underline"
        >
          Go back
        </button>
      </div>
    );

  if (idx >= cards.length)
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Session Complete
        </h2>
        <p className="text-gray-400 text-sm">
          {stats.correct} correct · {stats.wrong} missed · {stats.streak} streak
        </p>
        <p className="text-xs text-gray-400">
          {sessionInfo.due} reviews · {sessionInfo.new} new cards
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleStudyAnyway}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Study More
          </button>
          <button
            onClick={() => navigate(`/study/${deckId}?mode=review`)}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Review
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
  const srsInterval = card.srs_interval ?? 1;
  const srsFactor = card.srs_ease_factor ?? 2.5;

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center gap-8">
      <div className="w-full flex flex-col gap-2">
        {deck && (
          <button
            onClick={() => navigate("/mydecks")}
            className="text-xs text-gray-400 hover:text-gray-600 self-start mb-1 transition-colors"
          >
            ← {deck.title}
          </button>
        )}
        <div className="flex justify-between text-xs text-gray-400">
          <span>
            Card {idx + 1} of {cards.length}
          </span>
          <span>
            {sessionInfo.due} reviews · {sessionInfo.new} new
          </span>
        </div>
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-6 text-sm items-center">
        <span className="text-green-600 font-medium">✓ {stats.correct}</span>
        <span className="text-red-500 font-medium">✗ {stats.wrong}</span>
        <span className="text-blue-500 font-medium">⚡ {stats.streak}</span>
        {lastState && (
          <button
            onClick={handleUndo}
            title="Undo last grade (U)"
            className="ml-2 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded transition-colors"
          >
            ↩ Undo
          </button>
        )}
      </div>

      <div
        className="w-full cursor-pointer"
        onClick={() => setFlipped((f) => !f)}
        onTouchStart={(e) => {
          touchStart.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }}
        onTouchEnd={(e) => {
          if (!touchStart.current) return;
          const dx = e.changedTouches[0].clientX - touchStart.current.x;
          const dy = e.changedTouches[0].clientY - touchStart.current.y;
          touchStart.current = null;
          if (Math.abs(dx) > Math.abs(dy)) {
            if (!flipped) return;
            if (dx < -60) handleAnswer(0); // swipe left = Again
            if (dx > 60) handleAnswer(2);  // swipe right = Good
          } else if (dy < -50 && !flipped) {
            setFlipped(true); // swipe up = reveal
          }
        }}
      >
        <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">
            {deck?.language || "Front"}
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
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(card.audio_url);
                }}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-sm"
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
                >
                  🐢
                </button>
              )}
            </div>
          )}

          {!flipped && (
            <span className="text-xs text-gray-300 mt-2">
              tap · space · swipe up
            </span>
          )}

          {flipped && (
            <div className="w-full flex flex-col items-center gap-4 pt-4 border-t border-gray-200 mt-2">
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
                <div className="w-full border-t border-gray-100 pt-3 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Definition
                  </p>
                  <p className="text-sm text-gray-600">{card.definition}</p>
                </div>
              )}

              {template.show_example && card.example && (
                <div className="w-full border-t border-gray-100 pt-3 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Example
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    "{card.example}"
                  </p>
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
                <div className="flex gap-2">
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
          )}
        </div>
      </div>

      <div
        className={`w-full flex gap-3 transition-opacity duration-200 ${flipped ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {GRADES.map(({ grade, label, key, color }) => (
          <button
            key={grade}
            onClick={() => handleAnswer(grade)}
            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors flex flex-col items-center gap-0.5 ${color}`}
          >
            <span>{label}</span>
            <span className="text-xs opacity-50">
              {fmtInterval(calcNextInterval(grade, srsInterval, srsFactor))} · {key}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Study;
