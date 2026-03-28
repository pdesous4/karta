function DeckFormFields({ deckForm, onChange }) {
  return (
    <section className="flex flex-col gap-4 mb-10">
      <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
        Deck Details
      </h2>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Title
        </label>
        <input
          type="text"
          value={deckForm.title}
          onChange={(e) => onChange("title", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          placeholder="e.g. Spanish Basics"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Language
        </label>
        <input
          type="text"
          value={deckForm.language}
          onChange={(e) => onChange("language", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          placeholder="e.g. Spanish"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Description{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={deckForm.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
          rows={3}
          placeholder="What is this deck about?"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_public"
          checked={deckForm.is_public}
          onChange={(e) => onChange("is_public", e.target.checked)}
          className="rounded"
        />
        <label htmlFor="is_public" className="text-sm text-gray-700">
          Make this deck public
        </label>
      </div>
    </section>
  );
}

export default DeckFormFields;
