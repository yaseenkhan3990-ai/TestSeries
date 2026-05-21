import { useState, useEffect } from 'react'
import { getEffectiveCorrectOption } from '../utils/choices'
import EmptyQuestions from './EmptyQuestions'
import QuestionCard from './QuestionCard'
import Flashcards from './Flashcards'

export default function QuestionsPanel({
  aiChecks,
  answers,
  onAnswer,
  onDownloadSheet,
  questions,
  viewMode,
  setViewMode,
  currentQuestionIdx,
  setCurrentQuestionIdx,
  mnemonicStory,
  isStoryLoading,
  generateMnemonics,
  testEnded,
  showOnlyMistakes,
  setShowOnlyMistakes,
  stats,
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isPausedAudio, setIsPausedAudio] = useState(false)
  const [speechRate, setSpeechRate] = useState(1)

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  // Mistakes filter
  const filteredQuestions = showOnlyMistakes
    ? questions.filter((q) => {
        const correct = getEffectiveCorrectOption(q, aiChecks)
        const selected = answers[q.id]
        return selected && correct && selected !== correct
      })
    : questions

  const currentQuestion = filteredQuestions[currentQuestionIdx] || filteredQuestions[0]

  // Dynamic coaching feedback
  const getCoachingFeedback = () => {
    if (stats.percentage === 100) {
      return {
        grade: 'A+',
        title: '🌟 Star Performer! Perfect Score!',
        text: 'Aapne saare sawalon ke sahi jawab diye hain. Aap is study set ke absolute master hain. Keep it up!',
        color: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      }
    }
    if (stats.percentage >= 80) {
      return {
        grade: 'A',
        title: '🚀 Outstanding Job! Excellent!',
        text: 'Aapka score bohot hi behtareen hai. Kuch hi choti mistakes hui hain, unhe neeche review karein aur 100% target karein.',
        color: 'from-teal-500/20 to-indigo-500/5 text-teal-400 border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.15)]',
      }
    }
    if (stats.percentage >= 50) {
      return {
        grade: 'B',
        title: '📚 Achieved Good Progress! Keep Going!',
        text: 'Aapne adhe se zyada sahi jawab diye hain. Lekin abhi bhi kuch topics ko review karne ki zaroorat hai. Mistakes filter ka use karke revision karein!',
        color: 'from-amber-500/20 to-indigo-500/5 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      }
    }
    return {
      grade: 'C',
      title: '🔍 Needs Revision & Study Focus!',
      text: 'Koi baat nahi! Mnemonic Story ko padhein, answers ke explanations ko samjhein aur revision karne ke baad retake karein. Practice makes perfect!',
      color: 'from-rose-500/20 to-indigo-500/5 text-rose-400 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]',
    }
  }

  const coach = getCoachingFeedback()

  const handleSpeakStory = () => {
    if (!mnemonicStory?.story) return

    // Stop any ongoing speech first
    window.speechSynthesis.cancel()

    // Extract raw text (strip markdown bold highlights)
    const cleanText = mnemonicStory.story
      .replace(/\*\*/g, '')
      .replace(/\[Question \d+ Answer\]/gi, '')
      .trim()

    const utterance = new SpeechSynthesisUtterance(cleanText)
    
    // Auto-detect language
    const hasHindi = /[\u0900-\u097F]/.test(cleanText)
    utterance.lang = hasHindi ? 'hi-IN' : 'en-US'
    utterance.rate = speechRate

    utterance.onend = () => {
      setIsPlayingAudio(false)
      setIsPausedAudio(false)
    }

    utterance.onerror = () => {
      setIsPlayingAudio(false)
      setIsPausedAudio(false)
    }

    window.speechSynthesis.speak(utterance)
    setIsPlayingAudio(true)
    setIsPausedAudio(false)
  }

  const handlePauseSpeech = () => {
    if (isPlayingAudio) {
      if (isPausedAudio) {
        window.speechSynthesis.resume()
        setIsPausedAudio(false)
      } else {
        window.speechSynthesis.pause()
        setIsPausedAudio(true)
      }
    }
  }

  const handleStopSpeech = () => {
    window.speechSynthesis.cancel()
    setIsPlayingAudio(false)
    setIsPausedAudio(false)
  }

  return (
    <section className="space-y-6 animate-slide-up text-[var(--text-main)]">
      {/* Dynamic AI Study Coach Board (Extra Feature) */}
      {testEnded && questions.length > 0 && (
        <div className={`rounded-2xl border bg-gradient-to-br ${coach.color} p-6 space-y-4 animate-slide-up`}>
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900/60 border border-white/10 text-3xl font-black shadow-lg">
              {coach.grade}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-black tracking-wide text-[var(--text-main)]">{coach.title}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-300 dark:text-slate-300 leading-relaxed">{coach.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Header & Mode Selectors */}
      <div className="glass-panel p-6 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/10 light:border-slate-800/10 pb-4">
          <div>
            <h2 className="text-2xl font-black text-[var(--text-main)] tracking-wide flex items-center gap-2">
              <span className="flex h-3.5 w-3.5 rounded-full bg-indigo-500 animate-pulse" />
              Test Series Panel
            </h2>
            <p className="text-sm font-semibold text-[var(--text-muted)] mt-1.5">
              Analyze questions, answer them, and get instant verified results.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mistakes Filter Button (Extra Feature) */}
            {testEnded && questions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowOnlyMistakes(!showOnlyMistakes)
                  setCurrentQuestionIdx(0)
                }}
                className={`rounded-xl px-4 py-2 text-sm font-black border transition ${
                  showOnlyMistakes
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:border-slate-600 light:bg-slate-200 light:text-slate-700 light:border-slate-300'
                }`}
              >
                {showOnlyMistakes ? 'Show All Questions' : '🔍 Mistakes Only'}
              </button>
            )}

            {/* View Mode Switcher */}
            {questions.length > 0 && (
              <div className="flex rounded-xl bg-slate-900/60 p-1 border border-slate-800 light:bg-slate-200/50 light:border-slate-300">
                <button
                  type="button"
                  onClick={() => setViewMode('allAtOnce')}
                  className={`rounded-lg px-4 py-2 text-sm font-black transition ${
                    viewMode === 'allAtOnce' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800'
                  }`}
                >
                  Show All
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('oneByOne')}
                  className={`rounded-lg px-4 py-2 text-sm font-black transition ${
                    viewMode === 'oneByOne' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800'
                  }`}
                >
                  One by One
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('flashcards')}
                  className={`rounded-lg px-4 py-2 text-sm font-black transition ${
                    viewMode === 'flashcards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800'
                  }`}
                >
                  Flashcards 🧠
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onDownloadSheet}
              disabled={!questions.length}
              className="rounded-xl border border-slate-200/10 bg-[#0d1425]/50 px-5 py-2.5 text-sm font-black text-[var(--text-main)] shadow-sm transition hover:border-teal-500 hover:text-teal-400 hover:bg-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-800/40 disabled:text-slate-500 disabled:border-slate-900/10 light:border-slate-300 light:bg-white light:shadow-sm"
            >
              Download sheet
            </button>
          </div>
        </div>

        {/* Story Generator Triggers */}
        {questions.length > 0 && !mnemonicStory && !isStoryLoading && (
          <div className="rounded-2xl bg-gradient-to-r from-teal-500/10 to-indigo-500/10 p-5 border border-teal-500/20 light:border-teal-500/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-black text-teal-400 light:text-teal-600">Struggling to remember these answers?</h4>
              <p className="text-xs text-[var(--text-muted)] font-semibold">Let Google AI weave them into an engaging visual narrative story for easier recall!</p>
            </div>
            <button
              type="button"
              onClick={generateMnemonics}
              className="rounded-xl bg-teal-500 px-5 py-3 text-sm font-black text-white hover:bg-teal-600 shadow-md shadow-teal-500/20 transition active:scale-95 whitespace-nowrap"
            >
              ✨ Make Mnemonic Story
            </button>
          </div>
        )}

        {isStoryLoading && (
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 space-y-4 animate-pulse">
            <div className="h-5 w-48 bg-slate-800 rounded-md light:bg-slate-200" />
            <div className="space-y-2.5">
              <div className="h-4 w-full bg-slate-800 rounded-md light:bg-slate-200" />
              <div className="h-4 w-5/6 bg-slate-800 rounded-md light:bg-slate-200" />
              <div className="h-4 w-4/5 bg-slate-800 rounded-md light:bg-slate-200" />
            </div>
          </div>
        )}

        {/* Display Mnemonic Story */}
        {mnemonicStory && (
          <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/5 p-6 space-y-5 shadow-lg animate-slide-up light:bg-indigo-50/20 light:border-indigo-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/10 light:border-slate-800/10 pb-3 gap-3">
              <h4 className="text-base font-black text-indigo-400 light:text-indigo-600 flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-400 light:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Mnemonic Memory Story (याद रखने की कहानी)
              </h4>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Audio controls */}
                <div className="flex items-center gap-1 rounded-lg bg-slate-900/60 p-1 border border-slate-800 light:bg-slate-200 light:border-slate-300">
                  {!isPlayingAudio ? (
                    <button
                      type="button"
                      onClick={handleSpeakStory}
                      className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-500/10 transition light:text-emerald-600 light:hover:bg-emerald-100"
                      title="Read Aloud Story"
                    >
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handlePauseSpeech}
                        className={`p-1.5 rounded-md transition ${isPausedAudio ? 'text-amber-400' : 'text-indigo-400 hover:bg-indigo-500/10 light:text-indigo-600 light:hover:bg-indigo-100'}`}
                        title={isPausedAudio ? 'Resume Speech' : 'Pause Speech'}
                      >
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {isPausedAudio ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleStopSpeech}
                        className="p-1.5 rounded-md text-rose-400 hover:bg-rose-500/10 transition light:text-rose-600 light:hover:bg-rose-100"
                        title="Stop Speech"
                      >
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 10h6v4H9z" />
                        </svg>
                      </button>
                    </>
                  )}
                  {/* Speed display & selector */}
                  <span className="text-[10px] text-slate-500 px-1 font-bold light:text-slate-600">
                    {speechRate}x
                  </span>
                  <input
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-12 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 light:bg-slate-300"
                    title="Speech Speed"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${mnemonicStory.story}\n\nMnemonics:\n${mnemonicStory.mnemonics.join('\n')}`)
                    alert('Story copied to clipboard!')
                  }}
                  className="text-xs font-black text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-1.5 rounded-lg border border-indigo-500/20 transition light:bg-indigo-500/5 light:text-indigo-600 light:border-indigo-500/10"
                >
                  Copy Story
                </button>
              </div>
            </div>

            <div className="text-sm leading-relaxed text-slate-300 light:text-slate-800 whitespace-pre-wrap font-semibold font-sans space-y-3">
              {mnemonicStory.story.split('\n').map((para, i) => {
                if (!para.trim()) return null;
                // Basic bold markdown parser for visual premiumness
                let parts = para.split('**');
                return (
                  <p key={i} className="mb-3">
                    {parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="text-indigo-400 font-black bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 light:bg-indigo-100 light:text-indigo-700">{part}</strong> : part)}
                  </p>
                );
              })}
            </div>

            {mnemonicStory.mnemonics && mnemonicStory.mnemonics.length > 0 && (
              <div className="pt-4 border-t border-slate-200/10 light:border-slate-200">
                <h5 className="text-xs font-black uppercase tracking-wider text-indigo-400 light:text-indigo-600 mb-3">Memory Hooks (Mnemonics):</h5>
                <ul className="space-y-2">
                  {mnemonicStory.mnemonics.map((hook, idx) => (
                    <li key={idx} className="text-sm text-slate-400 light:text-slate-500 flex items-start gap-2.5">
                      <span className="text-indigo-400 light:text-indigo-600 mt-0.5">💡</span>
                      <span className="font-bold">{hook}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Questions Content */}
      {!filteredQuestions.length ? (
        showOnlyMistakes ? (
          <div className="rounded-2xl border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 p-12 text-center shadow-lg animate-slide-up flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white font-black text-2xl shadow-lg shadow-emerald-500/20 animate-bounce">
              ✓
            </div>
            <h3 className="mt-6 text-lg font-black text-emerald-450 tracking-wide">Perfect Score! No Mistakes!</h3>
            <p className="mx-auto mt-2 max-w-sm text-xs font-semibold leading-relaxed text-slate-400">
              Aapne saare sawalon ke sahi jawab diye hain. Ek bhi galat jawab nahi hai. Brilliant performance!
            </p>
          </div>
        ) : (
          <EmptyQuestions />
        )
      ) : viewMode === 'allAtOnce' ? (
        <div className="space-y-6">
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              aiCheck={aiChecks[question.id]}
              correctOption={getEffectiveCorrectOption(question, aiChecks)}
              onAnswer={onAnswer}
              question={question}
              selected={answers[question.id]}
              disabled={testEnded}
            />
          ))}
        </div>
      ) : viewMode === 'flashcards' ? (
        <Flashcards questions={filteredQuestions} mnemonics={mnemonicStory?.mnemonics} />
      ) : (
        /* One by One Interactive Layout */
        <div className="space-y-6 animate-slide-up">
          {currentQuestion && (
            <QuestionCard
              key={currentQuestion.id}
              aiCheck={aiChecks[currentQuestion.id]}
              correctOption={getEffectiveCorrectOption(currentQuestion, aiChecks)}
              onAnswer={onAnswer}
              question={currentQuestion}
              selected={answers[currentQuestion.id]}
              disabled={testEnded}
            />
          )}

          {/* Paginated Navigation Controls */}
          <div className="glass-panel p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3 justify-between w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIdx === 0}
                className="rounded-xl border border-slate-800 bg-[#0d1425]/50 px-5 py-2.5 text-sm font-black text-slate-300 shadow-sm transition hover:border-indigo-500 hover:text-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-900 disabled:text-slate-500"
              >
                ← Back
              </button>
              <span className="flex items-center text-sm font-black text-slate-400 sm:px-4">
                Question {currentQuestionIdx + 1} of {filteredQuestions.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentQuestionIdx((prev) => Math.min(filteredQuestions.length - 1, prev + 1))}
                disabled={currentQuestionIdx === filteredQuestions.length - 1}
                className="rounded-xl border border-slate-800 bg-[#0d1425]/50 px-5 py-2.5 text-sm font-black text-slate-300 shadow-sm transition hover:border-indigo-500 hover:text-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-900 disabled:text-slate-500"
              >
                Next →
              </button>
            </div>

            {/* Quick-jump navigation dots */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
              {filteredQuestions.map((q, idx) => {
                const isCurrent = filteredQuestions[currentQuestionIdx]?.id === q.id
                const isAnswered = Boolean(answers[q.id])
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`h-9 w-9 rounded-xl text-xs font-black flex items-center justify-center border transition ${
                      isCurrent
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                        : isAnswered
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                          : 'bg-[#0d1425]/50 text-slate-500 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
