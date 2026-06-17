import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ChatActionsSidebar from '../components/chat/ChatActionsSidebar'
import ChatInput from '../components/chat/ChatInput'
import ChatLayout from '../components/chat/ChatLayout'
import ChatMessage from '../components/chat/ChatMessage'
import ConversationDrawer from '../components/chat/ConversationDrawer'
import TypingIndicator from '../components/chat/TypingIndicator'
import ClinicalFormCard from '../components/clinical/ClinicalFormCard'
import ClinicalResultPanel from '../components/clinical/ClinicalResultPanel'
import ExplainabilityBubble from '../components/clinical/ExplainabilityBubble'
import PredictionResultBubble from '../components/clinical/PredictionResultBubble'
import RecommendationBubble from '../components/clinical/RecommendationBubble'
import ReportCard from '../components/clinical/ReportCard'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Drawer from '../components/ui/Drawer'
import { useChat } from '../hooks/useChat'
import { useIsDesktop } from '../hooks/useMediaQuery'

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
    title,
    submitForm,
    loadExampleCase,
    startNewConversation,
    loadConversation,
    conversationId,
    handleSendMessage,
  } = useChat()

  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const reduce = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)   // Drawer de acciones (móvil)
  const [resultsOpen, setResultsOpen] = useState(false)   // Resultados a pantalla completa
  const [confirmNewOpen, setConfirmNewOpen] = useState(false)

  const agentsDone = agents.filter((a) => a.status === 'completed').length
  const running = agents.some((a) => a.status === 'running')
  const hasData = !!report || phase !== 'awaiting_data'

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
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

  // El comando «ver agentes» (chip o /agentes) abre los resultados a pantalla completa.
  useEffect(() => {
    const open = () => setResultsOpen(true)
    window.addEventListener('agents:open', open)
    return () => window.removeEventListener('agents:open', open)
  }, [])

  const requestNewConsultation = useCallback(() => {
    if (hasData) setConfirmNewOpen(true)
    else startNewConversation()
  }, [hasData, startNewConversation])

  // Acción de chat: ejecuta y cierra el drawer de acciones (relevante en móvil).
  const chatAction = useCallback((fn: () => void) => {
    fn()
    setActionsOpen(false)
  }, [])

  const openResults = useCallback(() => {
    setActionsOpen(false)
    setResultsOpen(true)
  }, [])

  const goTo = useCallback((path: string) => {
    setActionsOpen(false)
    navigate(path)
  }, [navigate])

  const sidebar = (
    <ChatActionsSidebar
      onExampleCase={() => chatAction(loadExampleCase)}
      onNewCase={() => chatAction(requestNewConsultation)}
      onAnalyze={() => chatAction(() => submitForm(formData))}
      onViewAgents={openResults}
      onDashboard={() => goTo('/dashboard')}
      onAbout={() => goTo('/about')}
      disabled={loading}
    />
  )

  return (
    <>
      <ChatLayout
        title={title}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenResults={() => setActionsOpen(true)}
        showResultsButton
        agentsDone={agentsDone}
        agentsTotal={agents.length}
        running={running}
        panel={sidebar}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
            <div className="mx-auto w-full max-w-3xl space-y-2 px-2 pb-2 pt-3 sm:px-4">
              {messages.map((msg, i) => (
                <ChatMessage key={msg.id} role={msg.role} content={msg.content} isLast={i === messages.length - 1} />
              ))}

              <AnimatePresence>{showTyping && <TypingIndicator />}</AnimatePresence>

              {showForm && (phase === 'awaiting_data' || phase === 'idle') && (
                <div className="px-2 pb-1 pt-2 sm:px-4">
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
                <div className="px-2 pb-1 pt-2 sm:px-4">
                  <PredictionResultBubble report={report} />
                </div>
              )}

              {report?.explainability && (
                <div className="px-2 pb-1 pt-2 sm:px-4">
                  <ExplainabilityBubble shap={report.explainability.shap} lime={report.explainability.lime} />
                </div>
              )}

              {report?.recommendation && (
                <div className="px-2 pb-1 pt-2 sm:px-4">
                  <RecommendationBubble recommendation={report.recommendation} diagnosisLabel={report.prediction?.diagnosis_label} />
                </div>
              )}

              {report?.ok && (
                <div className="px-2 pb-1 pt-2 sm:px-4">
                  <ReportCard report={report} />
                </div>
              )}

              {error && (
                <div className="px-2 pt-2 sm:px-4">
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
                </div>
              )}

              <div className="h-4" />
            </div>
          </div>

          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSendMessage}
            disabled={loading}
          />
        </div>
      </ChatLayout>

      {/* Barra de acciones como drawer en móvil/tablet (en desktop es fija). */}
      {!isDesktop && (
        <Drawer open={actionsOpen} onClose={() => setActionsOpen(false)} side="right" widthClass="w-[88%] max-w-xs" ariaLabel="Acciones del caso clínico">
          {sidebar}
        </Drawer>
      )}

      {/* Resultados clínicos a PANTALLA COMPLETA (al pulsar «Ver agentes»).
          Montaje condicional con animación de ENTRADA: cerrar = desmontar
          (evita el «stuck-exit» de AnimatePresence con hijos animados anidados). */}
      {resultsOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-white"
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.2, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-label="Resultados clínicos"
        >
          <ClinicalResultPanel report={report} agents={agents} onBack={() => setResultsOpen(false)} />
        </motion.div>
      )}

      <ConversationDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        activeId={conversationId}
        onSelect={(id) => void loadConversation(id)}
        onNew={requestNewConsultation}
      />

      <ConfirmDialog
        open={confirmNewOpen}
        title="Iniciar nueva consulta"
        message="La consulta actual quedará guardada en el historial. ¿Deseas comenzar una nueva?"
        confirmLabel="Nueva consulta"
        onConfirm={() => {
          setConfirmNewOpen(false)
          startNewConversation()
        }}
        onCancel={() => setConfirmNewOpen(false)}
      />
    </>
  )
}
