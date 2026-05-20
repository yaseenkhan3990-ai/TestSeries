import http from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env')

  if (!existsSync(envPath)) return

  const envFile = readFileSync(envPath, 'utf8')

  envFile.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return

    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')

    if (!process.env[key.trim()]) {
      process.env[key.trim()] = value
    }
  })
}

loadLocalEnv()

const PORT = Number(process.env.AI_SERVER_PORT || 8787)
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
const MAX_BODY_SIZE = 24 * 1024 * 1024
const GEMINI_TIMEOUT_MS = 90000

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  })
  response.end(JSON.stringify(payload))
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let rawBody = ''

    request.on('data', (chunk) => {
      rawBody += chunk

      if (rawBody.length > MAX_BODY_SIZE) {
        reject(new Error('Request is too large. Keep PDF under 20MB for inline AI processing.'))
        request.destroy()
      }
    })

    request.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {})
      } catch {
        reject(new Error('Invalid JSON request.'))
      }
    })

    request.on('error', reject)
  })
}

function extractJson(text) {
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
    }

    throw new Error('AI response was not valid JSON.')
  }
}

function ensureApiKey() {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is missing. Add it to your terminal environment or .env setup before starting the AI server.')
  }
}

async function callGemini(parts) {
  ensureApiKey()

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  const geminiResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY,
    },
    signal: controller.signal,
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  }).catch((error) => {
    if (error.name === 'AbortError') {
      throw new Error('Google AI request timed out. Please try a smaller PDF or retry.')
    }

    throw error
  }).finally(() => clearTimeout(timeout))

  const payload = await geminiResponse.json()

  if (!geminiResponse.ok) {
    const message = payload.error?.message || `Gemini API failed with ${geminiResponse.status}`
    throw new Error(message)
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim()

  if (!text) {
    throw new Error('Gemini returned an empty response.')
  }

  return extractJson(text)
}

function normalizeAiQuestions(questions = []) {
  return questions
    .filter((question) => question?.text && Array.isArray(question.options) && question.options.length >= 2)
    .map((question, index) => ({
      id: index + 1,
      sourceNumber: String(question.sourceNumber || index + 1),
      text: String(question.text).trim(),
      language: question.language ? String(question.language).trim() : '',
      topic: question.topic ? String(question.topic).trim() : '',
      difficulty: question.difficulty ? String(question.difficulty).trim() : '',
      options: question.options.slice(0, 6).map((option, optionIndex) => {
        const fallbackKey = String.fromCharCode(65 + optionIndex)
        const key = String(option.key || fallbackKey).trim().toUpperCase()

        return {
          key: /^[A-Z]$/.test(key) ? key : fallbackKey,
          label: String(option.label || option.key || fallbackKey).trim(),
          text: String(option.text || '').trim(),
        }
      }),
      correctOption: question.correctOption ? String(question.correctOption).trim().toUpperCase() : '',
      explanation: question.explanation ? String(question.explanation).trim() : '',
    }))
}

async function handleExtractPdf(request, response) {
  const body = await readJson(request)

  if (!body.data) {
    sendJson(response, 400, { error: 'PDF data is required.' })
    return
  }

  const requestedCount = Math.min(Math.max(Number(body.questionCount || 10), 1), 25)
  const shouldGenerateFromContext = body.mode !== 'extract'
  const result = await callGemini([
    {
      inline_data: {
        mime_type: body.mimeType || 'application/pdf',
        data: body.data,
      },
    },
    {
      text: `Read and understand this PDF in its original language or languages. It may be text-based, scanned, handwritten-looking, or use custom font encodings.

Your job is to analyze the PDF context first, find any objective questions already present, and then make the best possible objective questions from the actual PDF content.
Return JSON only in this exact shape:
{
  "languageSummary": "languages detected in the PDF",
  "contextSummary": "short summary of the PDF's main topics and learning points",
  "mode": "found-and-generated",
  "questions": [
    {
      "sourceNumber": "1",
      "language": "language used for this question",
      "topic": "topic from the PDF",
      "difficulty": "easy, medium, or hard",
      "text": "question text",
      "options": [
        { "key": "A", "label": "A", "text": "option text" }
      ],
      "correctOption": "A",
      "explanation": "short answer explanation in the same language as the question"
    }
  ],
  "notes": "short note"
}
Rules:
- Preserve the PDF's language. If the PDF has multiple languages, create questions in the language of the source section they come from.
- Do not translate unless the PDF itself is bilingual or mixed-language.
- ${shouldGenerateFromContext ? `Return up to ${requestedCount} high-quality objective MCQ questions total. First include useful objective questions already found in the PDF, then generate more from the PDF context until the set is strong and complete.` : 'Extract real objective questions and visible answer keys from the PDF.'}
- Before writing questions, infer the main concepts, definitions, formulas, events, examples, and conclusions from the PDF.
- Cover different important parts of the PDF instead of making many questions from one paragraph.
- Prefer conceptual understanding, factual recall, cause/effect, comparison, and application questions that a teacher could ask after reading this PDF.
- Every generated question must have 4 options, exactly one correctOption, and a short explanation in the same language as the question.
- If an existing PDF question has fewer than 4 options, keep it only when it is clearly objective; otherwise replace it with a better generated MCQ from the same topic.
- Keep distractor options plausible but clearly wrong according to the PDF.
- key must always be A, B, C, D, E, or F. label may use the PDF's original option style if useful.
- Use native PDF understanding/OCR when browser text extraction is broken.
- Do not invent facts beyond the PDF content.`,
    },
  ])

  sendJson(response, 200, {
    questions: normalizeAiQuestions(result.questions),
    languageSummary: result.languageSummary || '',
    contextSummary: result.contextSummary || '',
    mode: result.mode || (shouldGenerateFromContext ? 'generated' : 'extracted'),
    notes: result.notes || '',
  })
}

async function handleCheckAnswer(request, response) {
  const body = await readJson(request)

  if (!body.question?.text || !Array.isArray(body.question?.options) || !body.selectedOption) {
    sendJson(response, 400, { error: 'Question, options, and selectedOption are required.' })
    return
  }

  const result = await callGemini([
    {
      text: `You are checking one objective question for a quiz app. The question can be in any language or mixed languages.
Return JSON only:
{
  "correctOption": "A",
  "isSelectedCorrect": true,
  "confidence": 0.92,
  "explanation": "one short sentence"
}
Question: ${body.question.text}
Options: ${JSON.stringify(body.question.options)}
Selected option: ${body.selectedOption}
Existing answer key, if available: ${body.question.correctOption || 'not provided'}
Rules:
- If the existing answer key is provided and looks valid, use it.
- Otherwise solve the question from knowledge/reasoning.
- correctOption must be one option key from the options list.
- Explanation should be short, student-friendly, and in the same language as the question when possible.`,
    },
  ])

  sendJson(response, 200, {
    correctOption: String(result.correctOption || '').trim().toUpperCase(),
    isSelectedCorrect: Boolean(result.isSelectedCorrect),
    confidence: Number(result.confidence || 0),
    explanation: String(result.explanation || ''),
  })
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  try {
    if (request.method === 'GET' && request.url === '/api/health') {
      sendJson(response, 200, {
        configured: Boolean(API_KEY),
        model: MODEL,
      })
      return
    }

    if (request.method === 'POST' && request.url === '/api/extract-pdf') {
      await handleExtractPdf(request, response)
      return
    }

    if (request.method === 'POST' && request.url === '/api/check-answer') {
      await handleCheckAnswer(request, response)
      return
    }

    sendJson(response, 404, { error: 'Not found.' })
  } catch (error) {
    sendJson(response, 500, { error: error.message || 'AI server failed.' })
  }
})

server.listen(PORT, () => {
  console.log(`AI server running on http://127.0.0.1:${PORT}`)
  console.log(`Gemini model: ${MODEL}`)
  console.log(API_KEY ? 'Gemini API key detected.' : 'GEMINI_API_KEY is not set yet.')
})
