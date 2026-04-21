import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

function ReviewButton({ deckId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
      >
        Review
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-md py-1 min-w-[140px] z-10">
          <Link
            to={`/study/${deckId}?mode=review`}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
          >
            Normal
          </Link>
          <Link
            to={`/study/${deckId}?mode=review&back_first=1`}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
          >
            Back first
          </Link>
        </div>
      )}
    </div>
  );
}

export default ReviewButton;
