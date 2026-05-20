export default function TextParserPanel({ isLoading, onParse, rawText, setRawText }) {
  return (
    <section className="rounded-md border border-[#dde8ee] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-[#172b4d]">Extracted text</h2>
        <button
          type="button"
          onClick={onParse}
          disabled={!rawText.trim() || isLoading}
          className="rounded-md bg-[#172b4d] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#243b61] disabled:cursor-not-allowed disabled:bg-[#ccd6dd]"
        >
          Parse
        </button>
      </div>
      <textarea
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
        className="mt-4 h-72 w-full resize-y rounded-md border border-[#cbd6df] bg-[#fbfdfe] p-3 text-sm leading-6 text-[#1f2933] shadow-inner"
        placeholder="PDF text will appear here. You can also paste questions in any language."
      />
    </section>
  )
}
