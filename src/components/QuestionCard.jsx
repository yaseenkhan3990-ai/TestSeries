import { getChoiceDisplay } from '../utils/choices'

function getBadgeClass({ hasKey, isAnswered, isCorrect, isWrong }) {
  if (isCorrect) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
  if (isWrong) return 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
  if (isAnswered && !hasKey) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  return 'bg-slate-800 text-slate-400 border border-slate-700'
}

function getBadgeText({ hasKey, isAnswered, isCorrect, isWrong }) {
  if (isCorrect) return 'Correct'
  if (isWrong) return 'Incorrect'
  if (isAnswered && !hasKey) return 'Verifying...'
  return 'Not Answered'
}

export default function QuestionCard({
  aiCheck,
  correctOption,
  onAnswer,
  question,
  selected,
  disabled,
}) {
  const isAnswered = Boolean(selected)
  const hasKey = Boolean(correctOption)
  const isCorrect = isAnswered && hasKey && selected === correctOption
  const isWrong = isAnswered && hasKey && selected !== correctOption
  const badgeState = { hasKey, isAnswered, isCorrect, isWrong }
  const explanation = aiCheck?.explanation || question.explanation

  return (
    <article className="glass-card p-6 space-y-5 animate-slide-up bg-[#0e1627] border border-slate-800">
      {/* Header info */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-400 border border-indigo-500/25 shadow-[0_0_10px_rgba(99,102,241,0.15)]">
              Question {question.sourceNumber || question.id}
            </span>
            {question.topic && (
              <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-400 border border-slate-700">
                {question.topic}
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-black leading-relaxed text-slate-100">{question.text}</h3>
        </div>
        <span className={`w-fit rounded-full px-3.5 py-1.5 text-xs font-black tracking-wide shrink-0 ${getBadgeClass(badgeState)}`}>
          {getBadgeText(badgeState)}
        </span>
      </div>

      {/* Grid of choice options */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {question.options.map((option) => {
          const isSelected = selected === option.key
          const isCorrectOption = correctOption === option.key
          
          let optionStyle = 'border-slate-800 bg-[#12192b]/60 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/5'
          if (isSelected) {
            optionStyle = 'border-indigo-500/80 bg-indigo-500/15 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
          }
          
          let borderFeedback = ''
          if (isAnswered) {
            if (isCorrectOption) {
              borderFeedback = 'ring-2 ring-emerald-500/80 border-transparent bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            } else if (isSelected && isWrong) {
              borderFeedback = 'ring-2 ring-rose-500/80 border-transparent bg-rose-50/10 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
            }
          }

          return (
            <button
              key={option.key}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer(question.id, option.key)}
              className={`group flex min-h-16 items-center gap-3.5 rounded-2xl border p-4 text-left transition duration-200 active:scale-98 ${optionStyle} ${borderFeedback} ${
                disabled ? 'cursor-not-allowed opacity-90' : ''
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-colors ${
                isSelected 
                  ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                  : isAnswered && isCorrectOption 
                    ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                    : isAnswered && isSelected && isWrong 
                      ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]' 
                      : 'bg-slate-800 text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400'
              }`}>
                {option.label}
              </span>
              <span className="text-sm sm:text-base font-bold leading-relaxed">{option.text}</span>
            </button>
          )
        })}
      </div>

      {/* Answer key / AI review tags */}
      <div className="flex flex-wrap gap-3 text-xs sm:text-sm pt-1">
        <span className="rounded-xl bg-slate-900/60 px-3.5 py-2.5 font-black text-slate-400 border border-slate-800/80">
          Your Answer: <strong className="text-slate-200">{selected ? getChoiceDisplay(question, selected) : 'None'}</strong>
        </span>
        
        <span
          className={`rounded-xl px-3.5 py-2.5 font-black border ${
            isAnswered 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.1)]' 
              : 'bg-slate-900/40 text-slate-500 border-slate-800/50'
          }`}
        >
          Correct Key:{' '}
          <strong className={isAnswered ? 'text-emerald-300' : 'text-slate-500'}>
            {isAnswered
              ? correctOption
                ? getChoiceDisplay(question, correctOption)
                : 'Not Set'
              : 'Submitted Answer'}
          </strong>
        </span>

        {aiCheck?.status === 'checking' && (
          <span className="rounded-xl bg-blue-500/10 px-3.5 py-2.5 font-black text-blue-400 border border-blue-500/20 animate-pulse flex items-center gap-1.5 shadow-[0_0_12px_rgba(59,130,246,0.1)]">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
            AI Verifying...
          </span>
        )}

        {isAnswered && explanation && (
          <div className="w-full rounded-2xl bg-indigo-500/5 px-5 py-4 text-xs sm:text-sm font-bold text-indigo-300 border border-indigo-500/15 leading-relaxed shadow-lg mt-1 animate-slide-up">
            <span className="font-black text-indigo-400 block mb-1">💡 AI Explanation:</span>
            {explanation}
          </div>
        )}

        {aiCheck?.error && (
          <span className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 font-black text-rose-400 border border-rose-500/20 mt-1 block w-full">
            ⚠️ Verification Error: {aiCheck.error}
          </span>
        )}
      </div>
    </article>
  )
}
