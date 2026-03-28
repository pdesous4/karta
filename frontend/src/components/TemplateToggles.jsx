const TEMPLATE_FIELDS = [
  {
    key: "show_romanization",
    label: "Romanization",
    desc: "Pronunciation guide",
  },
  {
    key: "show_context",
    label: "Context",
    desc: "Hints like (plural), (formal)",
  },
  {
    key: "show_definition",
    label: "Definition",
    desc: "Dictionary definition",
  },
  {
    key: "show_example",
    label: "Example sentence",
    desc: "Usage in context with translation",
  },
  { key: "show_image", label: "Image", desc: "Visual aid" },
  {
    key: "front_audio",
    label: "Audio on front",
    desc: "Play audio before flipping",
  },
  {
    key: "back_audio",
    label: "Audio on back",
    desc: "Play audio after flipping",
  },
  {
    key: "back_audio_slow",
    label: "Slow audio",
    desc: "Slower pronunciation button",
  },
];

function TemplateToggles({ template, onChange }) {
  return (
    <section className="mb-10">
      <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-4">
        Card Settings
      </h2>
      <div className="flex flex-col gap-2">
        {TEMPLATE_FIELDS.map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <button
              onClick={() => onChange(key, !template[key])}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${template[key] ? "bg-gray-900" : "bg-gray-200"}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${template[key] ? "left-5" : "left-1"}`}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TemplateToggles;
