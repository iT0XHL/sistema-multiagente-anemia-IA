import { useCallback, useEffect, useRef } from 'react'

import MobileAgentDrawer from '../components/agents/MobileAgentDrawer'
import AgentSidebar from '../components/agents/AgentSidebar'
import ChatInput from '../components/chat/ChatInput'
import ChatLayout from '../components/chat/ChatLayout'
import ChatMessage from '../components/chat/ChatMessage'
import TypingIndicator from '../components/chat/TypingIndicator'
import ClinicalFormCard from '../components/clinical/ClinicalFormCard'
import ExplainabilityBubble from '../components/clinical/ExplainabilityBubble'
import PredictionResultBubble from '../components/clinical/PredictionResultBubble'
import RecommendationBubble from '../components/clinical/RecommendationBubble'
import ReportCard from '../components/clinical/ReportCard'
import { useChat } from '../hooks/useChat'

export default function Chat() {
  const {
    messages,
    phase,
    formData,
    setFormData,
    agents,
    report,
    loading,
    error,
    inputValue,
    setInputValue,
    showForm,
    showTyping,
    submitForm,
    loadExampleCase,
    newConsultation,
    handleSendMessage,
  } = useChat()

  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, showTyping, showForm, report, scrollToBottom])

  useEffect(() => {
    const handler = () => scrollToBottom()
    window.addEventListener('chat:scroll', handler)
    return () => window.removeEventListener('chat:scroll', handler)
  }, [scrollToBottom])

  return (
    <ChatLayout
      sidebar={<AgentSidebar agents={agents} />}
    >
      <div className="flex flex-1 flex-col min-h-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          <div className="mx-auto max-w-3xl pt-3 pb-2 space-y-2">
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                isLast={i === messages.length - 1}
              />
            ))}

            {showTyping && <TypingIndicator />}

            {showForm && (phase === 'awaiting_data' || phase === 'idle') && (
              <div className="px-4 pt-2 pb-1">
                <ClinicalFormCard
                  value={formData}
                  onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
                  onSubmit={() => submitForm(formData)}
                  onLoadExample={loadExampleCase}
                  loading={loading}
                />
              </div>
            )}

            {report?.ok && report.prediction && (
              <div className="px-4 pt-2 pb-1">
                <PredictionResultBubble report={report} />
              </div>
            )}

            {report?.explainability && (
              <div className="px-4 pt-2 pb-1">
                <ExplainabilityBubble
                  shap={report.explainability.shap}
                  lime={report.explainability.lime}
                />
              </div>
            )}

            {report?.recommendation && (
              <div className="px-4 pt-2 pb-1">
                <RecommendationBubble
                  recommendation={report.recommendation}
                  diagnosisLabel={report.prediction?.diagnosis_label}
                />
              </div>
            )}

            {report?.ok && (
              <div className="px-4 pt-2 pb-1">
                <ReportCard report={report} />
              </div>
            )}

            {error && (
              <div className="px-4 pt-2">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {error}
                </div>
              </div>
            )}

            <div className="h-4" />
          </div>
        </div>

        <MobileAgentDrawer agents={agents} />

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSendMessage}
          onExampleCase={loadExampleCase}
          onNewConsultation={newConsultation}
          disabled={loading}
          showActions={phase === 'awaiting_data' || phase === 'complete' || phase === 'idle'}
        />
      </div>
    </ChatLayout>
  )
}
