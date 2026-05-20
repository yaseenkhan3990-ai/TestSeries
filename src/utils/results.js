import { getChoiceDisplay, getEffectiveCorrectOption } from './choices'

export const emptyStats = {
  total: 0,
  answered: 0,
  correct: 0,
  wrong: 0,
  pending: 0,
  percentage: 0,
}

export function calculateStats(questions, answers, aiChecks) {
  if (!questions.length) return emptyStats

  const answered = questions.filter((question) => answers[question.id]).length
  const correct = questions.filter((question) => {
    const correctOption = getEffectiveCorrectOption(question, aiChecks)
    return correctOption && answers[question.id] && answers[question.id] === correctOption
  }).length
  const wrong = questions.filter((question) => {
    const correctOption = getEffectiveCorrectOption(question, aiChecks)
    return correctOption && answers[question.id] && answers[question.id] !== correctOption
  }).length

  return {
    total: questions.length,
    answered,
    correct,
    wrong,
    pending: questions.length - answered,
    percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0,
  }
}

export function downloadAnswerSheet(questions, answers, aiChecks) {
  const rows = [
    ['Question No.', 'Question', 'Your Answer', 'Correct Answer', 'Result', 'AI Explanation'],
    ...questions.map((question) => {
      const selected = answers[question.id]
      const correctOption = getEffectiveCorrectOption(question, aiChecks)
      const userAnswer = selected ? getChoiceDisplay(question, selected) : 'Not answered'
      const correctAnswer = correctOption ? getChoiceDisplay(question, correctOption) : 'Missing key'
      const result =
        !selected || !correctOption ? 'Pending' : selected === correctOption ? 'Correct' : 'Wrong'

      return [
        question.sourceNumber || question.id,
        question.text,
        userAnswer,
        correctAnswer,
        result,
        aiChecks[question.id]?.explanation || '',
      ]
    }),
  ]

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'answer-sheet.csv'
  link.click()
  URL.revokeObjectURL(url)
}
