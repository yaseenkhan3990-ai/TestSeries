import { getEffectiveCorrectOption } from '../utils/choices'
import EmptyQuestions from './EmptyQuestions'
import QuestionCard from './QuestionCard'

export default function QuestionsPanel({
  aiChecks,
  answers,
  onAnswer,
  onDownloadSheet,
  questions,
}) {
  return (
    <section className="space-y-6 rounded-md border border-[#dde8ee] bg-white p-5 shadow-sm overflow-auto h-[28%] scrollbar-none">
      <div className="flex flex-col gap-3 border-b border-[#edf2f5] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#172b4d]">Questions</h2>
          <p className="text-sm font-medium text-[#5f6c7b]">
            Generated from the PDF context in the PDF language. Answers appear after selection.
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadSheet}
          disabled={!questions.length}
          className="rounded-md border border-[#dde8ee] bg-white px-4 py-2 text-sm font-bold text-[#172b4d] transition hover:border-[#08bd80] hover:text-[#06a86f] disabled:cursor-not-allowed disabled:bg-[#f1f5f8] disabled:text-[#9aa5b1]"
        >
          Download sheet
        </button>
      </div>
      {!questions.length ? (
        <EmptyQuestions />
      ) : (
        questions.map((question) => (
          <QuestionCard
            key={question.id}
            aiCheck={aiChecks[question.id]}
            correctOption={getEffectiveCorrectOption(question, aiChecks)}
            onAnswer={onAnswer}
            question={question}
            selected={answers[question.id]}
          />
        ))
      )}
    </section>
  )
}
