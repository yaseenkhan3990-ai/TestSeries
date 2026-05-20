export default function SourcePanel({
  aiConfigured,
  aiEnabled,
  aiStatus,
  fileName,
  isAiLoading,
  isLoading,
  onAiEnabledChange,
  onAiExtract,
  pdfPayload,
  status,
}) {
  return (
    <section className="rounded-md border border-[#dde8ee] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-[#172b4d]">Source</h2>
        <span className="rounded-md bg-[#e9fbf4] px-2 py-1 text-xs font-bold text-[#06a86f]">
          {isLoading ? 'Reading' : 'Ready'}
        </span>
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-bold text-[#7b8794]">File</dt>
          <dd className="mt-1 break-words font-semibold text-[#1f2933]">{fileName || 'No file selected'}</dd>
        </div>
        <div>
          <dt className="font-bold text-[#7b8794]">Status</dt>
          <dd className="mt-1 leading-6 text-[#1f2933]">{status}</dd>
        </div>
        <div>
          <dt className="font-bold text-[#7b8794]">AI status</dt>
          <dd className="mt-1 leading-6 text-[#1f2933]">{aiStatus}</dd>
        </div>
      </dl>
      <div className="mt-4 grid gap-3">
        <button
          type="button"
          onClick={onAiExtract}
          disabled={!pdfPayload || isAiLoading || isLoading || !aiConfigured}
          className="rounded-md bg-[#08bd80] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(8,189,128,0.2)] transition hover:bg-[#06a86f] disabled:cursor-not-allowed disabled:bg-[#ccd6dd] disabled:shadow-none"
        >
          {isLoading ? 'Reading PDF...' : isAiLoading ? 'Analyzing PDF...' : 'Analyze PDF and generate Q&A'}
        </button>
        <label className="flex items-center justify-between gap-3 rounded-md border border-[#dde8ee] bg-[#f8fbfd] px-3 py-2 text-sm font-bold text-[#3e4c59]">
          <span>Google AI check after answer</span>
          <input
            type="checkbox"
            checked={aiEnabled}
            disabled={!aiConfigured}
            onChange={(event) => onAiEnabledChange(event.target.checked)}
            className="h-4 w-4 accent-teal-700 disabled:cursor-not-allowed"
          />
        </label>
      </div>
    </section>
  )
}
