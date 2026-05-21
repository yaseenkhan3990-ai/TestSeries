import { useMemo, useState, useEffect } from 'react'
import './App.css'
import AppHeader from './components/AppHeader'
import QuestionsPanel from './components/QuestionsPanel'
import Sidebar from './components/Sidebar'
import ApiKeyManager from './components/ApiKeyManager'
import useAiServer from './hooks/useAiServer'
import { checkAnswerWithAi, extractPdfWithAi, generateStoryWithAi } from './services/aiService'
import { extractPdfText, fileToBase64 } from './services/pdfService'
import { normalizeChoice } from './utils/choices'
import { hasUnreadablePdfText, parseQuestions } from './utils/questionParser'
import { calculateStats, downloadAnswerSheet } from './utils/results'

function App() {
  const [fileName, setFileName] = useState('')
  const [rawText, setRawText] = useState('')
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [pdfPayload, setPdfPayload] = useState(null)
  const [aiChecks, setAiChecks] = useState({})
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [status, setStatus] = useState('Upload a PDF/Image or paste question text.')
  const [isLoading, setIsLoading] = useState(false)
  const { aiConfigured, aiEnabled, aiStatus, setAiEnabled, setAiStatus } = useAiServer()

  // New features state
  const [timerDuration, setTimerDuration] = useState(600) // Default 10 mins (600s)
  const [timeLeft, setTimeLeft] = useState(600)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [testEnded, setTestEnded] = useState(false)
  const [timerMode, setTimerMode] = useState('countdown') // 'countdown' or 'free'
  
  const [languages, setLanguages] = useState([]) // e.g. ['English', 'Hindi']
  const [viewMode, setViewMode] = useState('allAtOnce') // 'allAtOnce' or 'oneByOne' or 'flashcards'
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)

  const [mnemonicStory, setMnemonicStory] = useState(null)
  const [isStoryLoading, setIsStoryLoading] = useState(false)

  const [isPhoto, setIsPhoto] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)

  // Extra study features state
  const [showOnlyMistakes, setShowOnlyMistakes] = useState(false)

  // Theme & Multiple API Keys state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('test-series-theme') || 'dark'
  })

  const initialKeys = Array.from({ length: 10 }, (_, i) => ({
    nickname: `Key #${i + 1}`,
    key: '',
    status: 'empty',
  }))

  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('test-series-api-keys')
    return saved ? JSON.parse(saved) : initialKeys
  })

  const [activeKeyIdx, setActiveKeyIdx] = useState(() => {
    const saved = localStorage.getItem('test-series-active-key-idx')
    return saved ? Number(saved) : 0
  })

  const [autoFailover, setAutoFailover] = useState(() => {
    const saved = localStorage.getItem('test-series-auto-failover')
    return saved ? saved === 'true' : true
  })

  const [rotationLogs, setRotationLogs] = useState([])
  const [isApiManagerOpen, setIsApiManagerOpen] = useState(false)

  // Sync theme
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light')
    } else {
      document.body.classList.remove('light')
    }
    localStorage.setItem('test-series-theme', theme)
  }, [theme])

  // Save states to localStorage
  useEffect(() => {
    localStorage.setItem('test-series-api-keys', JSON.stringify(apiKeys))
  }, [apiKeys])

  useEffect(() => {
    localStorage.setItem('test-series-active-key-idx', String(activeKeyIdx))
  }, [activeKeyIdx])

  useEffect(() => {
    localStorage.setItem('test-series-auto-failover', String(autoFailover))
  }, [autoFailover])

  const addRotationLog = (event, message) => {
    const time = new Date().toLocaleTimeString()
    setRotationLogs((prev) => [
      { timestamp: time, event, message },
      ...prev,
    ].slice(0, 50))
  }

  // Capability check
  const isAiCapable = (aiConfigured || apiKeys.some(k => k.key.trim() !== '')) && 
    aiStatus !== 'Google AI server is not running. Start it with npm run api.'

  // Dynamic Failover Wrapper
  const runWithFailover = async (apiCallFn) => {
    let attempts = 0
    const validKeyIndices = apiKeys
      .map((k, idx) => (k.key.trim() ? idx : null))
      .filter((idx) => idx !== null)

    const activeIndicesList = validKeyIndices.length > 0
      ? [...validKeyIndices.slice(activeKeyIdx), ...validKeyIndices.slice(0, activeKeyIdx)]
      : [null]

    for (const idx of activeIndicesList) {
      attempts++
      const keyToUse = idx !== null ? apiKeys[idx].key : ''
      const keyLabel = idx !== null ? (apiKeys[idx].nickname || `Key #${idx + 1}`) : 'Server Env Key'

      try {
        const result = await apiCallFn(keyToUse)
        if (idx !== null) {
          setApiKeys(prev => {
            const copy = [...prev]
            copy[idx].status = 'active'
            return copy
          })
        }
        if (idx !== null && idx !== activeKeyIdx) {
          setActiveKeyIdx(idx)
          addRotationLog('RECOVERY', `Successfully connected usingrotated key: ${keyLabel}`)
        }
        return result
      } catch (error) {
        const errorMsg = error.message || ''
        const isRateOrQuota = errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('exhausted')
        
        if (idx !== null) {
          setApiKeys(prev => {
            const copy = [...prev]
            copy[idx].status = isRateOrQuota ? 'exhausted' : 'invalid'
            return copy
          })
        }

        addRotationLog('FAIL', `${keyLabel} failed: ${errorMsg}`)

        if (autoFailover && attempts < activeIndicesList.length) {
          const nextIdx = activeIndicesList[attempts]
          const nextLabel = nextIdx !== null ? (apiKeys[nextIdx].nickname || `Key #${nextIdx + 1}`) : 'Server Env Key'
          addRotationLog('ROTATING', `Switching active key from ${keyLabel} to ${nextLabel}...`)
          setAiStatus(`API Call failed. Automatically rotating request to ${nextLabel}...`)
          continue
        }
        throw error
      }
    }
  }

  // Timer Effect
  useEffect(() => {
    let interval = null
    if (isTimerActive && !testEnded) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (timerMode === 'countdown') {
            if (prev <= 1) {
              setIsTimerActive(false)
              setTestEnded(true)
              setStatus('Time is up! The test has been automatically submitted.')
              return 0
            }
            return prev - 1
          } else {
            return prev + 1 // count up in free mode
          }
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerActive, timerMode, testEnded])

  const resetQuiz = () => {
    setAnswers({})
    setAiChecks({})
    setMnemonicStory(null)
    setTestEnded(false)
    setShowOnlyMistakes(false)
    if (timerMode === 'countdown') {
      setTimeLeft(timerDuration)
    } else {
      setTimeLeft(0)
    }
    setIsTimerActive(questions.length > 0)
    setCurrentQuestionIdx(0)
  }

  const parseAndLoadQuestions = (text) => {
    const parsedQuestions = parseQuestions(text)
    setQuestions(parsedQuestions)
    resetQuiz()

    if (!text.trim()) {
      setStatus('No readable text found. If this is a scanned image PDF, OCR is needed first.')
      return parsedQuestions
    }

    if (!parsedQuestions.length) {
      if (hasUnreadablePdfText(text)) {
        setStatus(
          'PDF text is unreadable because of custom font encoding or scanned text. Try AI extract PDF, or use an OCR/Unicode PDF.',
        )
        return parsedQuestions
      }

      setStatus(
        'No objective questions found in the text. Use AI generate Q&A to read the PDF in its original language and create questions.',
      )
      return parsedQuestions
    }

    const missingKeys = parsedQuestions.filter((question) => !question.correctOption).length
    setStatus(
      missingKeys
        ? `${parsedQuestions.length} questions found. ${missingKeys} need an answer key.`
        : `${parsedQuestions.length} questions ready for checking.`,
    )
    return parsedQuestions
  }

  const extractQuestionsWithAi = async (payloadToExtract) => {
    if (!isAiCapable) {
      setAiStatus('Please start npm run api and verify API keys in the drawer.')
      return
    }

    if (!payloadToExtract) {
      setAiStatus('Upload a file first, then AI can generate questions and answers.')
      return
    }

    setIsAiLoading(true)
    setAiStatus('Google AI is analyzing context and generating objective questions...')
    setMnemonicStory(null)

    try {
      const payload = await runWithFailover((key) => extractPdfWithAi(payloadToExtract, languages, key))
      const languageNote = payload.languageSummary ? ` Languages: ${payload.languageSummary}.` : ''
      const contextNote = payload.contextSummary ? ` Context: ${payload.contextSummary}` : ''

      setQuestions(payload.questions || [])
      
      // Setup timer
      if (timerMode === 'countdown') {
        setTimeLeft(timerDuration)
      } else {
        setTimeLeft(0)
      }
      setIsTimerActive(true)
      setTestEnded(false)
      setShowOnlyMistakes(false)
      setCurrentQuestionIdx(0)

      setAnswers({})
      setAiChecks({})

      setStatus(
        payload.questions?.length
          ? `${payload.questions.length} objective questions generated by Google AI.${languageNote}${contextNote}`
          : 'Google AI could not generate questions from this document.',
      )
      setAiStatus(payload.notes || 'AI context analysis and question generation finished.')
    } catch (error) {
      setAiStatus(error.message)
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setIsAiLoading(false)
    setFileName(file.name)
    setPdfPayload(null)
    setAiChecks({})
    setMnemonicStory(null)

    const isImg = file.type?.startsWith('image/')
    setIsPhoto(isImg)

    if (isImg) {
      setPhotoUrl(URL.createObjectURL(file))
      setStatus('Preparing photo for AI analysis...')
    } else {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl)
      }
      setPhotoUrl(null)
      setStatus(isAiCapable ? 'Preparing PDF for AI context analysis...' : 'Reading PDF text...')
    }

    try {
      const base64 = await fileToBase64(file)
      const nextPdfPayload = {
        name: file.name,
        mimeType: file.type || (isImg ? 'image/jpeg' : 'application/pdf'),
        data: base64,
      }
      setPdfPayload(nextPdfPayload)

      let text = ''
      if (!isImg) {
        try {
          text = await extractPdfText(file)
        } catch (textError) {
          text = ''
          setStatus(`Browser text extraction failed: ${textError.message}. AI can still analyze the PDF file directly.`)
        }
      } else {
        text = 'Visual content will be parsed directly by the Gemini API.'
      }

      setRawText(text)

      if (!isAiCapable) {
        setQuestions([])
        resetQuiz()
        setStatus('Google AI is not connected. Start npm run api and verify API keys.')
        setAiStatus('File uploaded, but AI analysis needs the local server at http://127.0.0.1:8787.')
        return
      }

      setStatus('Asking Google AI to understand the document and create objective Q&A...')
      setIsLoading(false)
      await extractQuestionsWithAi(nextPdfPayload)
      return
    } catch (error) {
      setStatus(`File could not be read: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const askAiToExtractPdf = () => extractQuestionsWithAi(pdfPayload)

  const generateMnemonics = async () => {
    if (!questions.length) return
    setIsStoryLoading(true)
    setAiStatus('Google AI is weaving questions into a memorable realistic story...')
    try {
      const storyPayload = await runWithFailover((key) => generateStoryWithAi(questions, key))
      setMnemonicStory(storyPayload)
      setAiStatus('Mnemonic story generated successfully!')
    } catch (error) {
      setAiStatus(`Story generation failed: ${error.message}`)
    } finally {
      setIsStoryLoading(false)
    }
  }

  const askAiToCheckAnswer = async (question, selectedOption) => {
    if (!isAiCapable) {
      setAiStatus('Please start npm run api and verify API keys.')
      return
    }

    setAiChecks((currentChecks) => ({
      ...currentChecks,
      [question.id]: {
        ...(currentChecks[question.id] || {}),
        status: 'checking',
      },
    }))
    setAiStatus(`Google AI is checking question ${question.sourceNumber || question.id}...`)

    try {
      const payload = await runWithFailover((key) => checkAnswerWithAi(question, selectedOption, key))

      setAiChecks((currentChecks) => ({
        ...currentChecks,
        [question.id]: {
          status: 'done',
          correctOption: normalizeChoice(payload.correctOption),
          explanation: payload.explanation,
          confidence: payload.confidence,
        },
      }))
      setAiStatus(`AI checked question ${question.sourceNumber || question.id}.`)
    } catch (error) {
      setAiChecks((currentChecks) => ({
        ...currentChecks,
        [question.id]: {
          ...(currentChecks[question.id] || {}),
          status: 'error',
          error: error.message,
        },
      }))
      setAiStatus(error.message)
    }
  }

  const handleAnswer = (questionId, optionKey) => {
    if (testEnded) {
      alert('The test has ended. Answers cannot be changed.')
      return
    }

    const question = questions.find((item) => item.id === questionId)

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: optionKey,
    }))

    if (question && aiEnabled && isAiCapable) {
      askAiToCheckAnswer(question, optionKey)
    }
  }

  const submitTest = () => {
    setIsTimerActive(false)
    setTestEnded(true)
    setStatus('Test submitted successfully! Review your score and answers.')
  }

  const stats = useMemo(
    () => calculateStats(questions, answers, aiChecks),
    [aiChecks, answers, questions],
  )

  return (
    <main className="min-h-screen">
      <AppHeader
        onFileChange={handleFile}
        stats={stats}
        timeLeft={timeLeft}
        isTimerActive={isTimerActive}
        setIsTimerActive={setIsTimerActive}
        timerMode={timerMode}
        testEnded={testEnded}
        submitTest={submitTest}
        resetQuiz={resetQuiz}
        questionsCount={questions.length}
        theme={theme}
        setTheme={setTheme}
        onOpenApiManager={() => setIsApiManagerOpen(true)}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <Sidebar
          aiConfigured={isAiCapable}
          aiEnabled={aiEnabled}
          aiStatus={aiStatus}
          fileName={fileName}
          isAiLoading={isAiLoading}
          isLoading={isLoading}
          onAiEnabledChange={setAiEnabled}
          onAiExtract={askAiToExtractPdf}
          onParse={() => parseAndLoadQuestions(rawText)}
          pdfPayload={pdfPayload}
          rawText={rawText}
          setRawText={setRawText}
          status={status}
          isPhoto={isPhoto}
          photoUrl={photoUrl}
          timerDuration={timerDuration}
          setTimerDuration={setTimerDuration}
          timerMode={timerMode}
          setTimerMode={setTimerMode}
          languages={languages}
          setLanguages={setLanguages}
        />
        <QuestionsPanel
          aiChecks={aiChecks}
          answers={answers}
          onAnswer={handleAnswer}
          onDownloadSheet={() => downloadAnswerSheet(questions, answers, aiChecks)}
          questions={questions}
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentQuestionIdx={currentQuestionIdx}
          setCurrentQuestionIdx={setCurrentQuestionIdx}
          mnemonicStory={mnemonicStory}
          isStoryLoading={isStoryLoading}
          generateMnemonics={generateMnemonics}
          testEnded={testEnded}
          showOnlyMistakes={showOnlyMistakes}
          setShowOnlyMistakes={setShowOnlyMistakes}
          stats={stats}
        />
      </div>

      <ApiKeyManager
        isOpen={isApiManagerOpen}
        onClose={() => setIsApiManagerOpen(false)}
        apiKeys={apiKeys}
        setApiKeys={setApiKeys}
        autoFailover={autoFailover}
        setAutoFailover={setAutoFailover}
        activeKeyIdx={activeKeyIdx}
        setActiveKeyIdx={setActiveKeyIdx}
        rotationLogs={rotationLogs}
        clearLogs={() => setRotationLogs([])}
      />
    </main>
  )
}

export default App

