import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deleteDeck } from "../lib/api";
import useStore from "../store/index";

function MyDecks() {
  const { decks, dueCounts, loadDecks, removeDeck } = useStore();
  const [loading, setLoading] = useState(!decks.length);

  useEffect(() => {
    loadDecks().finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this deck?")) return;
    await deleteDeck(id);
    removeDeck(id);
  }

  if (loading) return <div className="text-stone-400 text-sm">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">My Decks</h1>
        <Link
          to="/create"
          className="bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
        >
          + New Deck
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-lg mb-2">No decks yet</p>
          <p className="text-sm">Create your first deck to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {decks.map((deck) => {
            const due = dueCounts[deck.id] || 0;
            return (
              <div
                key={deck.id}
                className="bg-white border border-stone-200 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium text-stone-900">{deck.title}</h2>
                    {due > 0 && (
                      <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        {due} due
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-400 mt-1">
                    {deck.language} · {deck.is_public ? "Public" : "Private"}
                  </p>
                  {deck.description && (
                    <p className="text-sm text-stone-500 mt-1">
                      {deck.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/study/${deck.id}`}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      due > 0
                        ? "border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600"
                        : "border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    Study
                  </Link>
                  <Link
                    to={`/study/${deck.id}?mode=review`}
                    className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Review
                  </Link>
                  <Link
                    to={`/edit/${deck.id}`}
                    className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(deck.id)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyDecks;
