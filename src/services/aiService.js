export const AI_API_BASE = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8787'

async function fetchWithTimeout(url, options = {}, timeoutMs = 90000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('AI request timed out. Please try again or use a smaller PDF.')
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function postJson(path, body, timeoutMs, apiKey) {
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) {
    headers['x-gemini-key'] = apiKey
  }

  const response = await fetchWithTimeout(`${AI_API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }, timeoutMs)
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'AI request failed.')
  }

  return payload
}

export async function getAiHealth(apiKey = '') {
  const headers = {}
  if (apiKey) {
    headers['x-gemini-key'] = apiKey
  }
  const response = await fetchWithTimeout(`${AI_API_BASE}/api/health`, { headers }, 5000)
  return response.json()
}

export function extractPdfWithAi(pdfPayload, languages = [], apiKey = '') {
  return postJson('/api/extract-pdf', {
    ...pdfPayload,
    mode: 'generate',
    questionCount: 10,
    languages,
  }, 120000, apiKey)
}

export function generateStoryWithAi(questions, apiKey = '') {
  return postJson('/api/generate-story', {
    questions,
  }, 90000, apiKey)
}

export function checkAnswerWithAi(question, selectedOption, apiKey = '') {
  return postJson('/api/check-answer', {
    question,
    selectedOption,
  }, 45000, apiKey)
}
