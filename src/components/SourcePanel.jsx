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
  isPhoto,
  photoUrl,
  timerDuration,
  setTimerDuration,
  timerMode,
  setTimerMode,
  languages,
  setLanguages,
}) {
  const AVAILABLE_LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Spanish', 'French']

  const handleLanguageChange = (lang) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter((l) => l !== lang))
    } else {
      setLanguages([...languages, lang])
    }
  }

  const PRESETS = [
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '15 min', value: 900 },
    { label: '30 min', value: 1800 },
    { label: '60 min', value: 3600 },
  ]

  return (
    <section className="glass-panel p-6 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
          <span className="flex h-3 w-3 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
          Settings & Source
        </h2>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${
          isLoading ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
        }`}>
          {isLoading ? 'Reading...' : 'Active'}
        </span>
      </div>

      {/* File Details & Thumbnail Preview */}
      <div className="rounded-xl bg-[#0c1222]/50 p-4 border border-slate-800 space-y-4">
        <div className="flex gap-4 items-center">
          {isPhoto && photoUrl ? (
            <img
              src={photoUrl}
              alt="Uploaded source"
              className="h-14 w-14 rounded-lg object-cover border border-slate-700 shadow-sm"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/25 shadow-sm">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">File Name</p>
            <p className="truncate text-base font-bold text-slate-300">{fileName || 'No file uploaded'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-slate-800">
          <div>
            <p className="font-bold text-slate-500 text-xs uppercase tracking-wider">File Status</p>
            <p className="mt-1 leading-relaxed font-semibold text-slate-400">{status}</p>
          </div>
          <div>
            <p className="font-bold text-slate-500 text-xs uppercase tracking-wider">AI status</p>
            <p className="mt-1 leading-relaxed font-semibold text-slate-400">{aiStatus}</p>
          </div>
        </div>
      </div>

      {/* Target Language Config */}
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
          Target Language(s) <span className="text-xs font-semibold text-slate-500 capitalize">(AI translates/generates)</span>
        </label>
        <div className="flex flex-wrap gap-2.5">
          {AVAILABLE_LANGUAGES.map((lang) => {
            const isSelected = languages.includes(lang)
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`rounded-xl px-3.5 py-2 text-sm font-bold transition border ${
                  isSelected
                    ? 'bg-teal-500/20 text-teal-400 border-teal-500/35 shadow-[0_0_12px_rgba(20,184,166,0.15)]'
                    : 'bg-[#0d1425]/50 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {lang}
              </button>
            )
          })}
        </div>
      </div>

      {/* Timer Configuration */}
      <div className="space-y-4">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
          Test Timer Settings
        </label>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setTimerMode('countdown')}
            className={`rounded-lg py-2 text-center text-sm font-black transition ${
              timerMode === 'countdown' ? 'bg-[#182235] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Countdown
          </button>
          <button
            type="button"
            onClick={() => setTimerMode('free')}
            className={`rounded-lg py-2 text-center text-sm font-black transition ${
              timerMode === 'free' ? 'bg-[#182235] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Count Up
          </button>
        </div>

        {timerMode === 'countdown' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-400">Duration limit:</span>
              <span className="font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
                {timerDuration / 60} minutes
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setTimerDuration(p.value)}
                  className={`flex-1 min-w-[70px] rounded-lg py-1.5 text-xs font-black text-center border transition ${
                    timerDuration === p.value
                      ? 'bg-indigo-600 text-white border-indigo-650 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                      : 'bg-[#0d1425]/50 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main interactive button */}
      <div className="pt-2 grid gap-4">
        <button
          type="button"
          onClick={onAiExtract}
          disabled={!pdfPayload || isAiLoading || isLoading || !aiConfigured}
          className="rounded-xl bg-teal-500 py-4 text-base font-black text-white shadow-[0_8px_20px_rgba(20,184,166,0.35)] transition hover:bg-teal-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-650 disabled:shadow-none"
        >
          {isLoading
            ? 'Processing Asset...'
            : isAiLoading
              ? 'AI Analyzing Document...'
              : `Create ${languages.length > 0 ? languages.join('/') : ''} Q&A Test`}
        </button>

        <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0d1425]/50 px-4 py-3 text-sm font-bold text-slate-400 hover:bg-[#0d1425]">
          <span>AI check after choice select</span>
          <input
            type="checkbox"
            checked={aiEnabled}
            disabled={!aiConfigured}
            onChange={(event) => onAiEnabledChange(event.target.checked)}
            className="h-5 w-5 accent-teal-500 disabled:cursor-not-allowed"
          />
        </label>
      </div>
    </section>
  )
}
