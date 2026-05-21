import StatsGrid from './StatsGrid'

export default function AppHeader({
  onFileChange,
  stats,
  timeLeft,
  isTimerActive,
  setIsTimerActive,
  timerMode,
  testEnded,
  submitTest,
  resetQuiz,
  questionsCount,
  theme,
  setTheme,
  onOpenApiManager,
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isLowTime = timerMode === 'countdown' && timeLeft < 60 && timeLeft > 0

  return (
    <section className="border-b border-slate-200/10 bg-[var(--glass-bg)] backdrop-blur-md sticky top-0 z-40 light:border-slate-800/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3.5 py-1 text-sm font-black uppercase tracking-[0.14em] text-teal-400 border border-teal-500/20 shadow-[0_0_12px_rgba(20,184,166,0.1)]">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
              Multimodal Cyber Question Hub
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-main)] sm:text-3xl">
              Upload PDF or Photo and Generate Q&A
            </h1>
            <p className="mt-1 text-sm font-bold text-[var(--text-muted)]">
              AI reads documents & images, understands visual context, and auto-creates interactive tests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition light:bg-slate-200 light:text-slate-600 light:hover:bg-slate-300"
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* API Keys Configuration Button */}
            <button
              type="button"
              onClick={onOpenApiManager}
              className="flex items-center gap-1.5 h-10 rounded-xl bg-indigo-500/10 px-4 text-sm font-bold text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition light:bg-indigo-500/5 light:text-indigo-600 light:border-indigo-500/10"
              title="Configure API Keys"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>API Keys</span>
            </button>

            {/* Interactive Timer Display */}
            {questionsCount > 0 && (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-900/60 p-1.5 border border-slate-800 shadow-lg light:bg-slate-200/50 light:border-slate-300">
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${
                    isLowTime
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse-timer-glow animate-shake-timer shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      : testEnded
                        ? 'bg-slate-800 text-slate-400 border border-slate-700 light:bg-slate-300 light:text-slate-600 light:border-slate-400'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] light:bg-indigo-500/10 light:text-indigo-700'
                  }`}
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {timerMode === 'countdown'
                      ? testEnded
                        ? 'Time\'s Up!'
                        : formatTime(timeLeft)
                      : `Elapsed: ${formatTime(timeLeft)}`}
                  </span>
                </div>

                {!testEnded && (
                  <button
                    type="button"
                    onClick={() => setIsTimerActive(!isTimerActive)}
                    className={`rounded-xl px-3 py-2 text-sm font-black transition ${
                      isTimerActive
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 light:bg-amber-500/5 light:text-amber-700'
                        : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 light:bg-teal-500/5 light:text-teal-700'
                    }`}
                  >
                    {isTimerActive ? 'Pause' : 'Resume'}
                  </button>
                )}

                {!testEnded ? (
                  <button
                    type="button"
                    onClick={submitTest}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/25 transition duration-200 active:scale-95"
                  >
                    Submit Test
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetQuiz}
                    className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-black text-white hover:bg-teal-400 shadow-md shadow-teal-500/25 transition duration-200 active:scale-95"
                  >
                    Retake Test
                  </button>
                )}
              </div>
            )}

            {/* Custom file uploader */}
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-base font-black text-white shadow-[0_8px_20px_rgba(20,184,166,0.35)] transition hover:bg-teal-400 active:scale-95">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload PDF or Photo
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg"
                className="sr-only"
                onChange={onFileChange}
              />
            </label>
          </div>
        </div>

        {/* Stats segment */}
        <StatsGrid stats={stats} />
      </div>
    </section>
  )
}
