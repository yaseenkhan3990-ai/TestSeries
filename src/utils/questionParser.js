import { hindiChoiceMap, normalizeChoice, optionLabel } from './choices'

const questionMarkers = ['Question', 'Q', '\u092A\u094D\u0930\u0936\u094D\u0928', '\u092A\u094D\u0930']
const answerMarkers = [
  'Answer',
  'Ans',
  'Correct(?: Answer)?',
  '\u0909\u0924\u094D\u0924\u0930',
  '\u0938\u0939\u0940\\s+\u0909\u0924\u094D\u0924\u0930',
  '\u091C\u0935\u093E\u092C',
  '\u0938\u0939\u0940\\s+\u0935\u093F\u0915\u0932\u094D\u092A',
]

const hindiChoiceChars = Object.keys(hindiChoiceMap).join('')
const choiceChars = `A-D${hindiChoiceChars}`
const questionMarkerPattern = questionMarkers.join('|')
const answerMarkerPattern = answerMarkers.join('|')

function prepareTextForParsing(text) {
  return text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(new RegExp(`\\s+(?=(?:${questionMarkerPattern})\\.?\\s*\\d{1,3}[).:-]?)`, 'gi'), '\n')
    .replace(/\s+(?=\d{1,3}[).:-]\s+)/g, '\n')
    .replace(new RegExp(`\\s+(?=[(]?[${choiceChars}][)]?[).:-]\\s+)`, 'gi'), '\n')
    .replace(new RegExp(`\\s+(?=(?:${answerMarkerPattern})\\s*[:-])`, 'gi'), '\n')
}

function getQuestionMatch(line) {
  return line.match(
    new RegExp(`^(?:(?:${questionMarkerPattern})\\.?\\s*)?(\\d{1,3})[).:-]?\\s+(.+)$`, 'i'),
  )
}

function getOptionMatch(line) {
  return line.match(
    new RegExp(`^(?:Option|\\u0935\\u093F\\u0915\\u0932\\u094D\\u092A)?\\s*[(]?([${choiceChars}])[)]?[).:-]\\s+(.+)$`, 'i'),
  )
}

function getAnswerMatch(line) {
  return line.match(
    new RegExp(`^(?:${answerMarkerPattern})\\s*[:-]?\\s*[(]?([${choiceChars}])[)]?(?:\\s|$)`, 'i'),
  )
}

export function hasUnreadablePdfText(text) {
  const compactText = text.replace(/\s/g, '')
  if (!compactText) return false

  const unreadableCount = Array.from(compactText).filter((char) => {
    const code = char.charCodeAt(0)
    return code === 0xfffd || (code < 32 && code !== 9 && code !== 10 && code !== 13)
  }).length

  return unreadableCount / compactText.length > 0.01
}

export function parseQuestions(rawText) {
  const lines = prepareTextForParsing(rawText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const questions = []
  let current = null

  const saveCurrent = () => {
    if (!current) return

    const options = Object.entries(current.options)
      .filter(([, option]) => option.text.trim())
      .map(([key, option]) => ({
        key,
        label: option.label,
        text: option.text.trim(),
      }))

    if (current.text.trim() && options.length >= 2) {
      questions.push({
        id: questions.length + 1,
        text: current.text.trim(),
        options,
        correctOption: normalizeChoice(current.correctOption),
        sourceNumber: current.sourceNumber,
      })
    }
  }

  lines.forEach((line) => {
    const optionMatch = getOptionMatch(line)
    const answerMatch = getAnswerMatch(line)
    const questionMatch = getQuestionMatch(line)

    if (questionMatch && !optionMatch && !answerMatch) {
      saveCurrent()
      current = {
        sourceNumber: questionMatch[1],
        text: questionMatch[2],
        options: {},
        correctOption: '',
      }
      return
    }

    if (!current) return

    if (answerMatch) {
      current.correctOption = answerMatch[1]
      return
    }

    if (optionMatch) {
      current.options[normalizeChoice(optionMatch[1])] = {
        label: optionLabel(optionMatch[1]),
        text: optionMatch[2],
      }
      return
    }

    const optionKeys = Object.keys(current.options)
    if (optionKeys.length) {
      const lastKey = optionKeys[optionKeys.length - 1]
      current.options[lastKey].text = `${current.options[lastKey].text} ${line}`
    } else {
      current.text = `${current.text} ${line}`
    }
  })

  saveCurrent()
  return questions
}
