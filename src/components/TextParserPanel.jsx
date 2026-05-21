export default function TextParserPanel({ isLoading, onParse, rawText, setRawText }) {
  return (
    <section className="glass-panel p-5 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-lg font-black text-slate-800 tracking-wide flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500" />
          Raw Extracted Text
        </h2>
        <button
          type="button"
          onClick={onParse}
          disabled={!rawText.trim() || isLoading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 transition active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          Parse Text
        </button>
      </div>
      <textarea
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
        className="h-64 w-full resize-none rounded-xl border border-slate-200 bg-white/50 p-3.5 text-xs font-semibold leading-relaxed text-slate-700 placeholder-slate-400 shadow-inner focus:border-indigo-500 transition scrollbar-none"
        placeholder="Extracted text will appear here automatically. You can also paste raw questions and answers directly to test them."
      />
    </section>
  )
}
