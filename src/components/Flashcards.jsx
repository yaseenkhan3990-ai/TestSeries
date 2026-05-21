import { useState } from 'react'

function Flashcards({ questions, mnemonics = [] }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  if (!questions || questions.length === 0) return null

  const activeQuestion = questions[currentIdx]
  
  // Find mnemonic hook for current question if index fits, or fallback
  const mnemonicHook = mnemonics[currentIdx] || (activeQuestion.explanation ? `Remember the keyword: ${activeQuestion.correctOption}` : null)

  const handleNext = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % questions.length)
    }, 150)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIdx((prev) => (prev - 1 + questions.length) % questions.length)
    }, 150)
  }

  const handleSelect = (idx) => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIdx(idx)
    }, 150)
  }

  return (
    <div className="rounded-3xl glass-panel p-6 shadow-xl space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-200/5 pb-4 light:border-slate-800/5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Active Study Mode
          </span>
          <h3 className="text-xl font-bold tracking-tight text-slate-100 light:text-slate-900 mt-0.5">
            Mnemonic Flashcards
          </h3>
        </div>
        <div className="text-sm font-semibold text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full light:bg-slate-100 light:text-slate-600">
          Card {currentIdx + 1} of {questions.length}
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div className="flex justify-center py-4">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`flip-card w-full max-w-xl h-72 cursor-pointer ${isFlipped ? 'flipped' : ''}`}
        >
          <div className="flip-card-inner relative w-full h-full">
            
            {/* Front Card */}
            <div className="flip-card-front glass-card border-slate-700/30 flex flex-col justify-between p-6 overflow-y-auto text-left light:border-slate-200 light:bg-white light:shadow-md">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">
                    {activeQuestion.topic || 'General Topic'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                    activeQuestion.difficulty === 'hard'
                      ? 'bg-rose-500/20 text-rose-400'
                      : activeQuestion.difficulty === 'medium'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {activeQuestion.difficulty || 'Easy'}
                  </span>
                </div>
                <h4 className="text-lg font-bold leading-relaxed text-slate-100 light:text-slate-800">
                  Q{activeQuestion.sourceNumber || currentIdx + 1}: {activeQuestion.text}
                </h4>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-800/40 pt-4 text-xs text-slate-400 light:border-slate-100">
                <span>Options present: {activeQuestion.options?.length || 4}</span>
                <span className="flex items-center gap-1 text-cyan-400 font-medium">
                  Tap to Reveal Answer
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Back Card */}
            <div className="flip-card-back glass-card border-cyan-500/20 flex flex-col justify-between p-6 overflow-y-auto text-left light:border-cyan-200 light:bg-white light:shadow-md">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider">
                    Correct Solution
                  </span>
                  <span className="font-semibold text-slate-400">
                    Question Key: {activeQuestion.correctOption}
                  </span>
                </div>

                {/* Answer Box */}
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 light:bg-emerald-50 light:border-emerald-200">
                  <p className="text-sm font-semibold text-emerald-400 light:text-emerald-700">
                    Correct Option: {activeQuestion.correctOption}
                  </p>
                  <p className="text-sm text-slate-200 light:text-slate-800 mt-1">
                    {activeQuestion.options?.find(o => o.key === activeQuestion.correctOption)?.text || 'No label option'}
                  </p>
                </div>

                {/* Mnemonic Hook */}
                {mnemonicHook && (
                  <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 flex gap-2 light:bg-purple-50 light:border-purple-200">
                    <span className="text-xl">🧠</span>
                    <div>
                      <h5 className="text-xs font-bold text-purple-400 light:text-purple-600 uppercase tracking-wider">
                        Mnemonic / Key Point Hook
                      </h5>
                      <p className="text-xs text-slate-300 light:text-slate-700 mt-0.5 italic">
                        {mnemonicHook}
                      </p>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {activeQuestion.explanation && (
                  <div className="text-xs text-slate-400 light:text-slate-500">
                    <strong className="text-slate-300 light:text-slate-700">Explanation:</strong> {activeQuestion.explanation}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800/40 pt-3 text-xs text-slate-400 light:border-slate-100">
                <span>Tap again to flip back</span>
                <span className="text-purple-400 font-medium">Concept Memorized!</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700 transition light:bg-slate-200 light:text-slate-700 light:hover:bg-slate-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {/* Card Dots Indicator */}
        <div className="hidden sm:flex flex-wrap justify-center gap-1.5 max-w-xs max-h-16 overflow-y-auto py-1 px-2 scrollbar-none">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                currentIdx === idx
                  ? 'bg-cyan-400 w-5'
                  : 'bg-slate-700 hover:bg-slate-500 light:bg-slate-300 light:hover:bg-slate-400'
              }`}
              title={`Card ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-1 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700 transition light:bg-slate-200 light:text-slate-700 light:hover:bg-slate-300"
        >
          Next
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Flashcards
