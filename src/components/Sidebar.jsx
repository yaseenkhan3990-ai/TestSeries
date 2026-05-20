import SourcePanel from './SourcePanel'
import TextParserPanel from './TextParserPanel'

export default function Sidebar({
  aiConfigured,
  aiEnabled,
  aiStatus,
  fileName,
  isAiLoading,
  isLoading,
  onAiEnabledChange,
  onAiExtract,
  onParse,
  pdfPayload,
  rawText,
  setRawText,
  status,
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
      />
      <TextParserPanel
        isLoading={isLoading}
        onParse={onParse}
        rawText={rawText}
        setRawText={setRawText}
      />
    </aside>
  )
}
