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
    'Access-Control-Allow-Headers': 'Content-Type, x-gemini-key',
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

async function callGemini(parts, clientApiKey) {
  const activeKey = clientApiKey || API_KEY
  if (!activeKey) {
    throw new Error('Gemini API key is missing. Please add an API Key in the API Key Manager or configure the server environment.')
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  const geminiResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': activeKey,
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
  const clientKey = request.headers['x-gemini-key']
  const body = await readJson(request)

  if (!body.data) {
    sendJson(response, 400, { error: 'PDF or Image data is required.' })
    return
  }

  const requestedCount = Math.min(Math.max(Number(body.questionCount || 10), 1), 25)
  const shouldGenerateFromContext = body.mode !== 'extract'
  const targetLanguages = body.languages && Array.isArray(body.languages) && body.languages.length > 0
    ? body.languages.join(', ')
    : 'Original language of the document'

  const result = await callGemini([
    {
      inline_data: {
        mime_type: body.mimeType || 'application/pdf',
        data: body.data,
      },
    },
    {
      text: `Read and understand this document (which can be a PDF or image file containing questions or study material) in its original language. It may be text-based, scanned, hand-written, or a photo of a printed page.

Your job is to analyze the document content, find objective questions already present, or generate excellent objective MCQs based on the content.
Return JSON only in this exact shape:
{
  "languageSummary": "languages detected in the document",
  "contextSummary": "short summary of the document's main topics and learning points",
  "mode": "found-and-generated",
  "questions": [
    {
      "sourceNumber": "1",
      "language": "language used for this question",
      "topic": "topic from the document",
      "difficulty": "easy, medium, or hard",
      "text": "question text",
      "options": [
        { "key": "A", "label": "A", "text": "option text" }
      ],
      "correctOption": "A",
      "explanation": "short answer explanation"
    }
  ],
  "notes": "short note"
}
Rules:
- TARGET LANGUAGES: You MUST generate/translate all questions, options, and explanations into these target languages: "${targetLanguages}". If the target languages are "Original language of the document", preserve the language of the source. If multiple languages are requested, provide questions in those selected languages or a mixed/bilingual format.
- ${shouldGenerateFromContext ? `Return up to ${requestedCount} high-quality objective MCQ questions total. First include useful objective questions already found, then generate more from the context until the set is strong and complete.` : 'Extract real objective questions and visible answer keys.'}
- Before writing questions, infer the main concepts, definitions, formulas, events, examples, and conclusions.
- Cover different important parts of the document instead of making many questions from one paragraph.
- Every generated question must have 4 options, exactly one correctOption, and a short explanation.
- Distractor options must be plausible but clearly wrong according to the document.
- key must always be A, B, C, D, E, or F.
- Do not invent facts beyond the document content.`,
    },
  ], clientKey)

  sendJson(response, 200, {
    questions: normalizeAiQuestions(result.questions),
    languageSummary: result.languageSummary || '',
    contextSummary: result.contextSummary || '',
    mode: result.mode || (shouldGenerateFromContext ? 'generated' : 'extracted'),
    notes: result.notes || '',
  })
}

async function handleGenerateStory(request, response) {
  const clientKey = request.headers['x-gemini-key']
  const body = await readJson(request)

  if (!body.questions || !Array.isArray(body.questions) || body.questions.length === 0) {
    sendJson(response, 400, { error: 'Questions are required to generate a story.' })
    return
  }

  const formattedQuestions = body.questions.map((q, idx) => {
    const correctOptObj = q.options.find(o => o.key === q.correctOption)
    const answerText = correctOptObj ? `${correctOptObj.label || correctOptObj.key}: ${correctOptObj.text}` : q.correctOption
    return `Question ${q.sourceNumber || idx + 1}: ${q.text}\nCorrect Answer: ${answerText}\nExplanation: ${q.explanation || ''}`
  }).join('\n\n')

  try {
    const result = await callGemini([
      {
        text: `You are an expert mnemonic educator, creative writer, and memory champion.
Your job is to read these objective questions, their correct answers, and explanations, and write a single, highly engaging, cohesive, and creative "realistic story" or narrative that weaves ALL correct answers and concepts together in a logical flow.

This will help students remember the correct answers perfectly through visual, emotional, or situational association!

Here are the Questions and Answers:
${formattedQuestions}

Instructions for outputting JSON:
Return JSON only in this exact shape:
{
  "story": "The complete narrative story formatted in markdown. Make it vivid, highly interesting, and reference the questions in brackets where their answers appear, e.g., '[Question 1 Answer]'. Keep the story language matching the questions' language (or bilingual Hinglish/Hindi as popular).",
  "mnemonics": [
    "A concise bullet-point list of quick mnemonic hooks connecting each Question number to its visual memory anchor in the story."
  ]
}

Rules:
- Create a single, continuous, logical story. Do NOT just list bullet points or write disconnected paragraphs.
- Keep the narrative extremely memorable, funny, realistic, or dramatic.
- Use simple terms so it is easy to understand.
- Bold the correct answers/key concepts inside the story.`,
      },
    ], clientKey)

    sendJson(response, 200, {
      story: String(result.story || ''),
      mnemonics: Array.isArray(result.mnemonics) ? result.mnemonics : [],
    })
  } catch (error) {
    sendJson(response, 500, { error: `Mnemonic generation failed: ${error.message}` })
  }
}

async function handleCheckAnswer(request, response) {
  const clientKey = request.headers['x-gemini-key']
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
  ], clientKey)

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
      const clientKey = request.headers['x-gemini-key']
      const activeKey = clientKey || API_KEY
      sendJson(response, 200, {
        configured: Boolean(activeKey),
        model: MODEL,
      })
      return
    }

    if (request.method === 'POST' && request.url === '/api/extract-pdf') {
      await handleExtractPdf(request, response)
      return
    }

    if (request.method === 'POST' && request.url === '/api/generate-story') {
      await handleGenerateStory(request, response)
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
