import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteDeck } from "../lib/api";
import useStore from "../store/index";

function Home() {
  const { user, decks, dueCounts, loadDecks, removeDeck } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!decks.length);

  useEffect(() => {
    loadDecks().finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this deck?")) return;
    await deleteDeck(id);
    removeDeck(id);
  }

  const totalDue = Object.values(dueCounts).reduce((sum, n) => sum + n, 0);
  const username =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "";

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Welcome back{username ? `, ${username}` : ""}
      </h1>
      <p className="text-gray-400 text-sm mb-10">Ready to study?</p>

      {totalDue > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8">
          <h2 className="font-medium text-blue-900 mb-1">
            {totalDue} card{totalDue !== 1 ? "s" : ""} due for review
          </h2>
          <p className="text-sm text-blue-500">
            Keep your streak going — review them now
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900">Currently Studying</h2>
        <Link
          to="/create"
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          + New Deck
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl text-gray-400">
          <p className="mb-2">No decks yet</p>
          <button
            onClick={() => navigate("/create")}
            className="text-sm text-gray-600 underline"
          >
            Create your first deck
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {decks.map((deck) => {
            const due = dueCounts[deck.id] || 0;
            return (
              <div
                key={deck.id}
                className={`border rounded-xl p-5 flex items-center justify-between transition-colors ${
                  due > 0
                    ? "border-blue-200 hover:border-blue-300"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{deck.title}</h3>
                    {due > 0 && (
                      <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {due} due
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {deck.language} · {deck.is_public ? "Public" : "Private"}
                  </p>
                  {deck.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {deck.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/study/${deck.id}`}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      due > 0
                        ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Study
                  </Link>
                  <Link
                    to={`/study/${deck.id}?mode=review`}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Review
                  </Link>
                  <Link
                    to={`/edit/${deck.id}`}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
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

export default Home;
