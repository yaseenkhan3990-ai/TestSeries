import SourcePanel from './SourcePanel'

export default function Sidebar({
  aiConfigured,
  aiEnabled,
  aiStatus,
  fileName,
  isAiLoading,
  isLoading,
  onAiEnabledChange,
  onAiExtract,
  pdfPayload,
  status,
  isPhoto,
  photoUrl,
  timerDuration,
  setTimerDuration,
  timerMode,
  setTimerMode,
  languages,
  setLanguages,
}) {
  return (
    <aside className="space-y-6">
      <SourcePanel
        aiConfigured={aiConfigured}
        aiEnabled={aiEnabled}
        aiStatus={aiStatus}
        fileName={fileName}
        isAiLoading={isAiLoading}
        isLoading={isLoading}
        onAiEnabledChange={onAiEnabledChange}
        onAiExtract={onAiExtract}
        pdfPayload={pdfPayload}
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
    </aside>
  )
}
