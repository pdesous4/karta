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

const LEARNING_STEPS = [1, 10];   // minutes
const RELEARNING_STEPS = [10];    // minutes
const GRADUATING_INTERVAL = 1;    // days
const EASY_INTERVAL = 4;          // days
const EASY_BONUS = 1.3;
const HARD_INTERVAL_FACTOR = 1.2;
const LAPSE_MIN_INTERVAL = 1;     // days

function hardStepDelay(steps, cur) {
  if (steps.length === 1) return Math.min(steps[0] * 1.5, steps[0] + 1440);
  if (cur === 0) return Math.round((steps[0] + steps[1]) / 2);
  return steps[cur];
}

function previewInterval(grade, state, step, interval, ease) {
  if (state === "new" || state === "learning") {
    const steps = LEARNING_STEPS;
    if (grade === 0) return { unit: "m", value: steps[0] };
    if (grade === 1) {
      const cur = state === "learning" ? Math.min(step, steps.length - 1) : 0;
      return { unit: "m", value: hardStepDelay(steps, cur) };
    }
    if (grade === 2) {
      const nxt = state === "learning" ? step + 1 : 1;
      if (nxt >= steps.length) return { unit: "d", value: GRADUATING_INTERVAL };
      return { unit: "m", value: steps[nxt] };
    }
    if (grade === 3) {
      return { unit: "d", value: state === "new" ? GRADUATING_INTERVAL : EASY_INTERVAL };
    }
  }

  if (state === "relearning") {
    const steps = RELEARNING_STEPS;
    if (steps.length === 0) return { unit: "d", value: Math.max(LAPSE_MIN_INTERVAL, interval) };
    if (grade === 0) return { unit: "m", value: steps[0] };
    if (grade === 1) {
      const cur = Math.min(step, steps.length - 1);
      return { unit: "m", value: hardStepDelay(steps, cur) };
    }
    if (grade === 2) {
      const nxt = step + 1;
      if (nxt >= steps.length) return { unit: "d", value: Math.max(LAPSE_MIN_INTERVAL, interval) };
      return { unit: "m", value: steps[nxt] };
    }
    if (grade === 3) return { unit: "d", value: Math.max(EASY_INTERVAL, interval) };
  }

  // review
  if (grade === 0) {
    if (RELEARNING_STEPS.length === 0) return { unit: "d", value: LAPSE_MIN_INTERVAL };
    return { unit: "m", value: RELEARNING_STEPS[0] };
  }
  const hardInt = Math.max(1, Math.floor(interval * HARD_INTERVAL_FACTOR));
  const goodInt = Math.max(hardInt + 1, Math.floor(interval * ease));
  const easyInt = Math.max(goodInt + 1, Math.floor(interval * ease * EASY_BONUS));
  if (grade === 1) return { unit: "d", value: hardInt };
  if (grade === 2) return { unit: "d", value: goodInt };
  if (grade === 3) return { unit: "d", value: easyInt };
}

function fmtInterval({ unit, value }) {
  if (unit === "m") {
    if (value < 60) return `${value}m`;
    return `${Math.round(value / 60)}h`;
  }
  if (value < 30) return `${value}d`;
  if (value < 365) return `${Math.round(value / 30)}mo`;
  return `${Math.round(value / 365)}y`;
}

const DEFAULT_TEMPLATE = {
  show_hint: true,
  show_romanization: true,
  show_context: true,
  show_definition: false,
  show_image: false,
  show_example: false,
  front_audio: false,
  back_audio: true,
  back_audio_slow: true,
};

const GRADES = [
  { grade: 0, label: "Again", key: "1", color: "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" },
  { grade: 1, label: "Hard",  key: "2", color: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" },
  { grade: 2, label: "Good",  key: "3", color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" },
  { grade: 3, label: "Easy",  key: "4", color: "bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100" },
];

function Study() {
  const { deckId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "normal";
  const backFirst = searchParams.get("back_first") === "1";
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
  const [hintShown, setHintShown] = useState(false);
  const touchStart = useRef(null);

  useEffect(() => {
    Promise.all([getStudyCards(deckId, mode), getDeck(deckId)])
      .then(([studyRes, deckRes]) => {
        const { due, new: newCards } = studyRes.data;
        const all = [...due, ...newCards];
        setCards(deckRes.data.shuffle === false ? all : shuffle(all));
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

  // Auto-play audio when the back (foreign word) is visible
  useEffect(() => {
    if (!cards[idx]) return;
    const t = deck?.template || DEFAULT_TEMPLATE;
    const backVisible = backFirst ? !flipped : flipped;
    if (backVisible && t.back_audio && cards[idx].audio_url) {
      new Audio(cards[idx].audio_url).play().catch(() => {});
    }
  }, [flipped, idx, deck, backFirst]);

  const template = deck?.template || DEFAULT_TEMPLATE;

  function handleStudyAnyway() {
    setLoading(true);
    setNoMoreNew(false);
    setCards([]);
    setIdx(0);
    getStudyCards(deckId, "force")
      .then((res) => {
        const { due, new: newCards } = res.data;
        const combined = [...due, ...newCards];
        const all = deck?.shuffle === false ? combined : shuffle(combined);
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
      setHintShown(false);
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
      <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
        Loading cards...
      </div>
    );

  if (!cards.length)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-stone-400">
          {mode === "review"
            ? "No studied cards yet — start a normal session first."
            : "Nothing to study right now — you're all caught up!"}
        </p>
        {mode !== "review" && (
          <div className="flex gap-3">
            {noMoreNew ? (
              <p className="text-sm text-stone-400">
                No more new cards in this deck.
              </p>
            ) : (
              <button
                onClick={handleStudyAnyway}
                className="text-sm px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Study anyway
              </button>
            )}
            <button
              onClick={() => navigate(`/study/${deckId}?mode=review`)}
              className="text-sm px-4 py-2 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
            >
              Review
            </button>
          </div>
        )}
        <button
          onClick={() => navigate("/mydecks")}
          className="text-sm text-stone-400 underline"
        >
          Go back
        </button>
      </div>
    );

  if (idx >= cards.length)
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="text-2xl font-semibold text-stone-900">
          Session Complete
        </h2>
        <p className="text-stone-400 text-sm">
          {stats.correct} correct · {stats.wrong} missed · {stats.streak} streak
        </p>
        <p className="text-xs text-stone-400">
          {sessionInfo.due} reviews · {sessionInfo.new} new cards
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleStudyAnyway}
            className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Study More
          </button>
          <button
            onClick={() => navigate(`/study/${deckId}?mode=review`)}
            className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Review
          </button>
          <button
            onClick={() => navigate("/mydecks")}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
          >
            Back to Decks
          </button>
        </div>
      </div>
    );

  const card = cards[idx];
  const progress = Math.round((idx / cards.length) * 100);
  const srsState = card.srs_state ?? "new";
  const srsStep = card.srs_learning_step ?? 0;
  const srsInterval = card.srs_interval ?? 1;
  const srsFactor = card.srs_ease_factor ?? 2.5;

  const renderFrontContent = (size) => (
    <>
      <span className={`${size} font-light text-stone-900 text-center tracking-tight leading-tight`}>
        {card.front}
      </span>
      {template.show_context && card.context && (
        <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
          {card.context}
        </span>
      )}
    </>
  );

  const renderBackContent = (size) => (
    <>
      <span className={`${size} font-light text-stone-900 text-center tracking-tight leading-tight`}>
        {card.back}
      </span>
      {template.show_romanization && card.romanization && (
        <span className="text-sm text-stone-400 italic">{card.romanization}</span>
      )}
      {template.show_definition && card.definition && (
        <div className="w-full border-t border-stone-100 pt-3 text-center">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
            Definition
          </p>
          <p className="text-sm text-stone-600">{card.definition}</p>
        </div>
      )}
      {template.show_example && card.example && (
        <div className="w-full border-t border-stone-100 pt-3 text-center">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
            Example
          </p>
          <p className="text-sm text-stone-600 italic">"{card.example}"</p>
          {card.example_translation && (
            <p className="text-xs text-stone-400 mt-1">
              {card.example_translation}
            </p>
          )}
          {card.example_audio_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                playAudio(card.example_audio_url);
              }}
              className="mt-2 w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors text-xs mx-auto"
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
          className="w-24 h-24 object-cover rounded-lg border border-stone-100"
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
            className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors text-sm"
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
              className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors text-sm"
              title="Slow speed"
            >
              🐢
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center gap-8">
      <div className="w-full flex flex-col gap-2">
        {deck && (
          <button
            onClick={() => navigate("/mydecks")}
            className="text-xs text-stone-400 hover:text-stone-600 self-start mb-1 transition-colors"
          >
            ← {deck.title}
          </button>
        )}
        <div className="flex justify-between text-xs text-stone-400">
          <span>
            Card {idx + 1} of {cards.length}
          </span>
          <span>
            {sessionInfo.due} reviews · {sessionInfo.new} new
          </span>
        </div>
        <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-5 text-sm items-center">
        <span className="text-emerald-600 font-medium tabular-nums">✓ {stats.correct}</span>
        <span className="text-rose-500 font-medium tabular-nums">✗ {stats.wrong}</span>
        <span className="text-indigo-500 font-medium tabular-nums">⚡ {stats.streak}</span>
        {lastState && (
          <button
            onClick={handleUndo}
            title="Undo last grade (U)"
            className="ml-1 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 bg-white px-2.5 py-1 rounded-lg transition-colors"
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
        <div className="relative w-full bg-white border border-stone-200 rounded-2xl p-10 flex flex-col items-center gap-4 shadow-sm">
          {srsState === "new" && (
            <svg
              viewBox="0 0 100 100"
              className="absolute -top-4 -right-4 w-16 h-16 drop-shadow-md rotate-12 pointer-events-none"
              aria-label="New card"
            >
              <polygon
                points="50,2 60.1,12.3 74,8.4 77.6,22.4 91.6,26 87.7,39.9 98,50 87.7,60.1 91.6,74 77.6,77.6 74,91.6 60.1,87.7 50,98 39.9,87.7 26,91.6 22.4,77.6 8.4,74 12.3,60.1 2,50 12.3,39.9 8.4,26 22.4,22.4 26,8.4 39.9,12.3"
                fill="#fbbf24"
                stroke="#000"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <text
                x="50"
                y="61"
                textAnchor="middle"
                fontSize="26"
                fontWeight="900"
                fill="#000"
                fontFamily="sans-serif"
              >
                NEW
              </text>
            </svg>
          )}
          <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">
            {backFirst ? (deck?.language || "Back") : (deck?.language || "Front")}
          </span>

          {backFirst
            ? renderBackContent("text-5xl")
            : renderFrontContent("text-5xl")}

          {template.show_hint && card.hint && !flipped && (
            hintShown ? (
              <span className="text-sm text-stone-500 italic text-center">
                {card.hint}
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHintShown(true);
                }}
                className="text-xs text-stone-500 border border-stone-200 hover:bg-stone-50 px-3 py-1 rounded-full transition-colors"
              >
                💡 Show hint
              </button>
            )
          )}

          {!backFirst && template.front_audio && card.audio_url && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(card.audio_url);
                }}
                className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors text-sm"
              >
                🔊
              </button>
              {template.back_audio_slow && card.audio_slow_url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(card.audio_slow_url);
                  }}
                  className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors text-sm"
                >
                  🐢
                </button>
              )}
            </div>
          )}

          {!flipped && (
            <span className="text-xs text-stone-300 mt-4 select-none">
              tap to reveal · space · swipe up
            </span>
          )}

          {flipped && (
            <div className="w-full flex flex-col items-center gap-4 pt-6 border-t border-stone-100 mt-2">
              <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">
                Answer
              </span>
              {backFirst
                ? renderFrontContent("text-4xl")
                : renderBackContent("text-4xl")}
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
              {fmtInterval(previewInterval(grade, srsState, srsStep, srsInterval, srsFactor))} · {key}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Study;
