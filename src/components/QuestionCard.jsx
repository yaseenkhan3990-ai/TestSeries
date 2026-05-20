import { getChoiceDisplay } from '../utils/choices'

function getBadgeClass({ hasKey, isAnswered, isCorrect, isWrong }) {
  if (isCorrect) return 'bg-[#e9fbf4] text-[#05895f]'
  if (isWrong) return 'bg-[#fff0f1] text-[#c62f3f]'
  if (isAnswered && !hasKey) return 'bg-[#fff7e6] text-[#9a6700]'
  return 'bg-[#eef4f8] text-[#5f6c7b]'
}

function getBadgeText({ hasKey, isAnswered, isCorrect, isWrong }) {
  if (isCorrect) return 'Correct'
  if (isWrong) return 'Wrong'
  if (isAnswered && !hasKey) return 'Needs key'
  return 'Pending'
}

export default function QuestionCard({
  aiCheck,
  correctOption,
  onAnswer,
  question,
  selected,
}) {
  const isAnswered = Boolean(selected)
  const hasKey = Boolean(correctOption)
  const isCorrect = isAnswered && hasKey && selected === correctOption
  const isWrong = isAnswered && hasKey && selected !== correctOption
  const badgeState = { hasKey, isAnswered, isCorrect, isWrong }
  const explanation = aiCheck?.explanation || question.explanation

  return (
    <article className="rounded-md border border-[#dde8ee] bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#08bd80]">
            Question {question.sourceNumber || question.id}
          </p>
          <h3 className="mt-2 text-lg font-black leading-7 text-[#172b4d]">{question.text}</h3>
        </div>
        <span className={`w-fit rounded-md px-3 py-1 text-xs font-bold ${getBadgeClass(badgeState)}`}>
          {getBadgeText(badgeState)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const isSelected = selected === option.key
          const isCorrectOption = correctOption === option.key
          const optionClass = isSelected
            ? 'border-[#08bd80] bg-[#e9fbf4] text-[#123d35]'
            : 'border-[#dde8ee] bg-white text-[#1f2933] hover:border-[#08bd80] hover:bg-[#fbfffd]'
          const answerClass =
            isAnswered && isCorrectOption
              ? 'ring-2 ring-[#08bd80]'
              : isAnswered && isSelected && isWrong
                ? 'ring-2 ring-[#e5485d]'
                : ''

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onAnswer(question.id, option.key)}
              className={`flex min-h-16 items-start gap-3 rounded-md border p-3 text-left transition ${optionClass} ${answerClass}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#172b4d] text-sm font-black text-white">
                {option.label}
              </span>
              <span className="text-sm font-semibold leading-6">{option.text}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-md bg-[#eef4f8] px-3 py-2 font-bold text-[#3e4c59]">
          Your answer: {selected ? getChoiceDisplay(question, selected) : 'Not answered'}
        </span>
        <span
          className={`rounded-md px-3 py-2 font-semibold ${
            isAnswered ? 'bg-[#e9fbf4] text-[#05895f]' : 'bg-[#eef4f8] text-[#7b8794]'
          }`}
        >
          Correct answer:{' '}
          {isAnswered
            ? correctOption
              ? getChoiceDisplay(question, correctOption)
              : 'Missing key'
            : 'Shown after selection'}
        </span>
        {aiCheck?.status === 'checking' ? (
          <span className="rounded-md bg-[#e8f1ff] px-3 py-2 font-semibold text-[#1f5fbf]">
            AI checking...
          </span>
        ) : null}
        {isAnswered && explanation ? (
          <span className="rounded-md bg-[#f4f0ff] px-3 py-2 font-semibold text-[#5b3bbf]">
            AI: {explanation}
          </span>
        ) : null}
        {aiCheck?.error ? (
          <span className="rounded-md bg-[#fff0f1] px-3 py-2 font-semibold text-[#c62f3f]">
            AI error: {aiCheck.error}
          </span>
        ) : null}
      </div>
    </article>
  )
}
