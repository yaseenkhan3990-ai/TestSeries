import { useState } from 'react'
import { getAiHealth } from '../services/aiService'

function ApiKeyManager({
  isOpen,
  onClose,
  apiKeys,
  setApiKeys,
  autoFailover,
  setAutoFailover,
  activeKeyIdx,
  setActiveKeyIdx,
  rotationLogs,
  clearLogs,
}) {
  const [testingIdx, setTestingIdx] = useState(null)
  const [testResults, setTestResults] = useState({})

  const handleKeyChange = (index, value) => {
    const updated = [...apiKeys]
    updated[index] = {
      ...updated[index],
      key: value,
      status: value.trim() ? 'untested' : 'empty',
    }
    setApiKeys(updated)
  }

  const handleNicknameChange = (index, value) => {
    const updated = [...apiKeys]
    updated[index] = {
      ...updated[index],
      nickname: value,
    }
    setApiKeys(updated)
  }

  const testKeyStatus = async (index) => {
    const keyConfig = apiKeys[index]
    if (!keyConfig.key.trim()) return

    setTestingIdx(index)
    setTestResults((prev) => ({ ...prev, [index]: { checking: true } }))

    try {
      const response = await getAiHealth(keyConfig.key)
      const isConfigured = response.configured

      setTestResults((prev) => ({
        ...prev,
        [index]: {
          checking: false,
          success: isConfigured,
          message: isConfigured ? 'Valid Gemini Key!' : 'Server rejected the key.',
        },
      }))

      const updated = [...apiKeys]
      updated[index] = {
        ...updated[index],
        status: isConfigured ? 'active' : 'invalid',
      }
      setApiKeys(updated)
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [index]: {
          checking: false,
          success: false,
          message: error.message || 'Key check failed.',
        },
      }))

      const updated = [...apiKeys]
      updated[index] = {
        ...updated[index],
        status: 'invalid',
      }
      setApiKeys(updated)
    } finally {
      setTestingIdx(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Main Slide Panel */}
      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-slate-200/10 bg-[#0d1423] text-slate-100 shadow-2xl transition-all duration-300 dark:border-slate-800/50 light:bg-slate-50 light:text-slate-800 light:border-slate-300/30">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/10 p-6 light:border-slate-300/30">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-sans">
              API Keys Control Room
            </h2>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
              Manage up to 10 fallback Gemini API keys for non-stop test generation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/10 hover:text-white light:hover:bg-slate-200 light:hover:text-slate-800"
            title="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Keys Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Failover Policy Switch */}
          <div className="flex items-center justify-between rounded-xl bg-slate-800/40 p-4 border border-slate-200/5 light:bg-slate-200/50 light:border-slate-300/40">
            <div>
              <h3 className="text-sm font-semibold">Auto-Failover / Rotation</h3>
              <p className="text-xs text-slate-400 light:text-slate-500">
                If the active API key hits limits, automatically fallback to the next valid key.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoFailover}
                onChange={(e) => setAutoFailover(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 light:bg-slate-300"></div>
            </label>
          </div>

          {/* Key Slots List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-wide text-slate-300 light:text-slate-600 uppercase">
              API Slots (1-10)
            </h3>

            {apiKeys.map((item, idx) => {
              const isActive = activeKeyIdx === idx
              const result = testResults[idx]

              return (
                <div
                  key={idx}
                  className={`relative rounded-xl border p-4 transition-all duration-200 ${
                    isActive
                      ? 'border-cyan-500/50 bg-cyan-950/20 light:border-cyan-400/50 light:bg-cyan-50/50'
                      : 'border-slate-200/5 bg-slate-900/40 hover:border-slate-200/10 light:border-slate-300/30 light:bg-white'
                  }`}
                >
                  {/* Badge & Selection Switch */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 light:bg-slate-200">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`API Key #${idx + 1} Name (e.g. Personal, Work)`}
                        value={item.nickname || ''}
                        onChange={(e) => handleNicknameChange(idx, e.target.value)}
                        className="bg-transparent text-xs font-semibold focus:outline-none text-slate-200 placeholder-slate-500 w-44 light:text-slate-800 light:placeholder-slate-400"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Active indicator */}
                      <button
                        onClick={() => setActiveKeyIdx(idx)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase transition-all ${
                          isActive
                            ? 'bg-cyan-500 text-[#0d1423]'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200 light:bg-slate-100 light:text-slate-500'
                        }`}
                      >
                        {isActive ? 'Active Key' : 'Select'}
                      </button>

                      {/* Status pill */}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                          item.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.status === 'invalid'
                            ? 'bg-rose-500/20 text-rose-400'
                            : item.status === 'exhausted'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-800 text-slate-400 light:bg-slate-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Input and Test Button */}
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="AI_API_KEY_..."
                      value={item.key || ''}
                      onChange={(e) => handleKeyChange(idx, e.target.value)}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none light:border-slate-300 light:bg-slate-50 light:text-slate-900"
                    />
                    <button
                      onClick={() => testKeyStatus(idx)}
                      disabled={!item.key.trim() || testingIdx === idx}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-30 light:bg-slate-200 light:text-slate-700 light:hover:bg-slate-300"
                    >
                      {testingIdx === idx ? 'Testing...' : 'Test'}
                    </button>
                  </div>

                  {/* Test Feedback */}
                  {result && (
                    <div className={`mt-2 text-[10px] ${result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {result.checking ? (
                        <span className="flex items-center gap-1 text-slate-400">
                          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Verifying API key configuration...
                        </span>
                      ) : (
                        result.message
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Failover / Rotation Logs */}
          <div className="rounded-xl border border-slate-200/5 bg-slate-950/40 p-4 light:border-slate-300/30 light:bg-white">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Key Fallback & Rotation Logs
              </h4>
              {rotationLogs.length > 0 && (
                <button
                  onClick={clearLogs}
                  className="text-[10px] text-slate-500 hover:text-slate-300 light:hover:text-slate-800"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {rotationLogs.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No key rotation events have occurred yet.</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto text-[10px]">
                {rotationLogs.map((log, lIdx) => (
                  <div key={lIdx} className="flex flex-col border-b border-slate-800/40 pb-1.5 light:border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300 light:text-slate-700">{log.timestamp}</span>
                      <span className="font-bold text-cyan-400">{log.event}</span>
                    </div>
                    <p className="text-slate-400 mt-0.5 light:text-slate-500">{log.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default ApiKeyManager
