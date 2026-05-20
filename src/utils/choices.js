export const hindiChoiceMap = {
  '\u0915': 'A',
  '\u0916': 'B',
  '\u0917': 'C',
  '\u0918': 'D',
}

export function normalizeChoice(value) {
  if (!value) return ''

  const cleaned = String(value).trim().replace(/[().:-]/g, '')
  return hindiChoiceMap[cleaned] || cleaned.toUpperCase()
}

export function optionLabel(value) {
  const cleaned = String(value).trim().replace(/[().:-]/g, '')
  return cleaned.toUpperCase().match(/^[A-D]$/) ? cleaned.toUpperCase() : cleaned
}

export function getChoiceDisplay(question, choiceKey) {
  const option = question.options.find((item) => item.key === choiceKey)
  return option?.label || choiceKey
}

export function getEffectiveCorrectOption(question, aiChecks) {
  return aiChecks[question.id]?.correctOption || question.correctOption
}
