import { useEffect, useState } from 'react'
import { getAiHealth } from '../services/aiService'

export default function useAiServer() {
  const [aiConfigured, setAiConfigured] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiStatus, setAiStatus] = useState('Checking Google AI server...')

  useEffect(() => {
    let isMounted = true

    async function checkAiServer() {
      try {
        const payload = await getAiHealth()

        if (!isMounted) return

        setAiConfigured(Boolean(payload.configured))
        setAiEnabled(Boolean(payload.configured))
        setAiStatus(
          payload.configured
            ? `Google AI ready with ${payload.model}.`
            : 'Google AI server is running, but GEMINI_API_KEY is missing.',
        )
      } catch {
        if (!isMounted) return

        setAiConfigured(false)
        setAiEnabled(false)
        setAiStatus('Google AI server is not running. Start it with npm run api.')
      }
    }

    checkAiServer()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    aiConfigured,
    aiEnabled,
    aiStatus,
    setAiEnabled,
    setAiStatus,
  }
}
