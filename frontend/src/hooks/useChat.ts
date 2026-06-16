import { useCallback, useRef, useState } from 'react'

import { runAgents } from '../services/api'
import type {
  AgentDescriptor,
  AgentRunReport,
  ChatMessage,
  ChatPhase,
  ClinicalFormData,
  ModelName,
} from '../types'
import { defaultClinicalForm, ejemploJuliaca } from '../types'

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    '👋 ¡Hola! Soy AnemIA.\n\nSoy tu asistente clínico conversacional para el diagnóstico de anemia infantil en la región de Puno, Perú.\n\nUtilizo un sistema de 6 agentes especializados que procesan tus datos clínicos para:\n• Calcular hemoglobina corregida por altitud\n• Estimar diagnóstico con modelo ML\n• Explicar factores influyentes con XAI\n• Proponer recomendaciones referenciales MINSA',
  timestamp: new Date(),
}

const DATA_REQUEST_MESSAGE: ChatMessage = {
  id: 'data_request',
  role: 'assistant',
  content:
    'Por favor, registra los datos del paciente en el formulario clínico. También puedes cargar el caso de ejemplo de Juliaca para una demostración completa.',
  timestamp: new Date(),
}

const DEFAULT_AGENTS: AgentDescriptor[] = [
  { id: 'data_agent', name: 'Registro', description: 'Clínico', icon: 'ClipboardList', status: 'pending', detail: 'Esperando datos...' },
  { id: 'preprocessing_agent', name: 'Contextual', description: 'Altitud / Hbc', icon: 'Mountain', status: 'pending', detail: 'Esperando datos...' },
  { id: 'prediction_agent', name: 'Predictivo', description: 'ML · Diagnóstico', icon: 'Brain', status: 'pending', detail: 'Esperando datos...' },
  { id: 'explainability_agent', name: 'Explicabilidad', description: 'XAI · SHAP', icon: 'Lightbulb', status: 'pending', detail: 'Esperando datos...' },
  { id: 'recommendation_agent', name: 'Terapéutico', description: 'Recomendación', icon: 'Pill', status: 'pending', detail: 'Esperando datos...' },
  { id: 'monitoring_agent', name: 'Coordinador', description: 'Reporte PDF', icon: 'Cpu', status: 'pending', detail: 'Esperando datos...' },
]

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const AGENT_ORDER = DEFAULT_AGENTS.map(a => a.id)

const AGENT_FRIENDLY: Record<string, { number: number; pastMessage: string }> = {
  data_agent: { number: 1, pastMessage: '✅ Datos del paciente validados correctamente.' },
  preprocessing_agent: { number: 2, pastMessage: '✅ Hemoglobina corregida por altitud calculada.' },
  prediction_agent: { number: 3, pastMessage: '✅ Modelo ML ejecutado. Diagnóstico estimado.' },
  explainability_agent: { number: 4, pastMessage: '✅ Explicación SHAP/LIME generada.' },
  recommendation_agent: { number: 5, pastMessage: '✅ Recomendación referencial preparada.' },
  monitoring_agent: { number: 6, pastMessage: '✅ Reporte multiagente consolidado.' },
}

const SCROLL_DELAY_MS = 600

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE, DATA_REQUEST_MESSAGE])
  const [phase, setPhase] = useState<ChatPhase>('awaiting_data')
  const [formData, setFormData] = useState<ClinicalFormData>(defaultClinicalForm)
  const [agents, setAgents] = useState<AgentDescriptor[]>(DEFAULT_AGENTS)
  const [report, setReport] = useState<AgentRunReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [showForm, setShowForm] = useState(true)
  const [showTyping, setShowTyping] = useState(false)
  const [agentStep, setAgentStep] = useState(-1)

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const message: ChatMessage = {
      ...msg,
      id: generateId(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, message])
    return message
  }, [])

  const scrollToBottom = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('chat:scroll'))
    }, SCROLL_DELAY_MS)
  }, [])

  const runAgentAnimation = useCallback(async (agentId: string, elapsedMs: number, statusMessage: string) => {
    setAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, status: 'running', detail: 'Procesando...' } : a
    ))

    const delay = Math.max(400, Math.min(elapsedMs, 1500))
    await new Promise(resolve => setTimeout(resolve, delay))

    const info = AGENT_FRIENDLY[agentId]
    const isError = statusMessage.toLowerCase().includes('error')
    setAgents(prev => prev.map(a =>
      a.id === agentId
        ? { ...a, status: isError ? 'error' : 'completed', detail: statusMessage }
        : a
    ))

    if (info && !isError) {
      addMessage({ role: 'agent', content: `Agente ${info.number} · ${info.pastMessage}` })
      scrollToBottom()
    }
  }, [addMessage, scrollToBottom])

  const submitForm = useCallback(async (data: ClinicalFormData) => {
    setLoading(true)
    setShowForm(false)
    setError(null)
    setAgents(DEFAULT_AGENTS.map(a => ({ ...a, status: 'pending', detail: a.detail })))

    const model: ModelName = data.Modelo === 'xgboost' ? 'xgboost' : 'random_forest'
    const clinicalCase = {
      Prov_EESS: data.Prov_EESS,
      Dist_EESS: data.Dist_EESS,
      Sexo: data.Sexo,
      EdadMeses: data.EdadMeses,
      Juntos: data.Juntos,
      SIS: data.SIS,
      Qaliwarma: data.Qaliwarma,
      Cred: data.Cred,
      Suplementacion: data.Suplementacion,
      Consejeria: data.Consejeria,
      Sesion: data.Sesion,
      Hemoglobina: data.Hemoglobina,
      ProvinciaREN: data.ProvinciaREN,
      DistritoREN: data.DistritoREN,
      AlturaREN: data.AlturaREN,
    }

    const sexoStr = data.Sexo === 'F' ? 'Niña' : 'Niño'
    addMessage({
      role: 'user',
      content: `Registrando paciente:\n${sexoStr}, ${data.EdadMeses} meses\nHb: ${data.Hemoglobina} g/dL · Altitud: ${data.AlturaREN} m.s.n.m.\nModelo: ${model === 'xgboost' ? 'XGBoost' : 'Random Forest'}`,
    })
    scrollToBottom()

    const processingMsg = addMessage({ role: 'assistant', content: 'Estoy procesando el caso clínico con el sistema multiagente...' })

    try {
      const result: AgentRunReport = await runAgents(clinicalCase, model)

      setMessages(prev => prev.filter(m => m.id !== processingMsg.id))

      for (const agentId of AGENT_ORDER) {
        const logEntry = result.agent_logs?.find(l => l.agent === agentId)
        const elapsed = logEntry?.elapsed_ms ?? 500
        const message = logEntry?.message ?? 'Procesado'
        await runAgentAnimation(agentId, elapsed, message)
      }

      if (result.ok) {
        setReport(result)
        setPhase('result')

        addMessage({ role: 'system', content: '✅ El sistema multiagente ha completado el análisis del caso clínico.' })

        if (result.prediction) {
          addMessage({
            role: 'assistant',
            content: `📊 **Resultado del análisis**\n\n**Diagnóstico probable:** ${result.prediction.diagnosis_label}\n**Modelo utilizado:** ${result.prediction.model}\n**Confianza estimada:** ${result.prediction.probability}%\n**Hemoglobina corregida:** ${result.preprocessing?.hbc ?? '—'} g/dL`,
          })
        }

        if (result.explainability) {
          setPhase('explainability')
          const topFactor = result.explainability.top_factor || 'Hemoglobina corregida por altitud'
          addMessage({
            role: 'assistant',
            content: `🔍 **Factores que más influyeron en la predicción**\n\n1. ${topFactor}\n2. Edad del paciente\n3. Altitud del establecimiento\n4. Síntomas reportados`,
          })
        }

        if (result.recommendation) {
          setPhase('recommendation')
          addMessage({
            role: 'assistant',
            content: `💊 **Recomendación referencial**\n\nDerivar el caso para evaluación médica, confirmar con análisis clínico y seguir lineamientos MINSA según severidad.`,
          })
        }

        setPhase('complete')
        addMessage({
          role: 'assistant',
          content: '✅ El caso fue procesado correctamente por el sistema multiagente.\n\nPuedes:\n• Hacer una **nueva consulta**\n• Revisar el **panel** de control\n• Consultar el **historial** de casos',
        })
      } else {
        setError(result.error || 'El pipeline finalizó con errores.')
        addMessage({
          role: 'system',
          content: '⚠ El sistema encontró errores al procesar el caso. Verifica los datos e intenta nuevamente.',
        })
        setShowForm(true)
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || 'Error de conexión con el backend.'
      addMessage({
        role: 'system',
        content: `⚠ Error: ${detail}`,
      })
      setError(`Error de conexión con el backend: ${detail}`)
      setShowForm(true)
    } finally {
      setLoading(false)
    }
  }, [addMessage, runAgentAnimation, scrollToBottom])

  const loadExampleCase = useCallback(() => {
    setFormData({ ...ejemploJuliaca })
    setShowForm(true)
    addMessage({
      role: 'system',
      content: '✅ Caso de ejemplo (Juliaca) cargado. Puedes revisar los datos en el formulario y enviarlos al sistema multiagente.',
    })
    setPhase('awaiting_data')
    scrollToBottom()
  }, [addMessage, scrollToBottom])

  const newConsultation = useCallback(() => {
    if (report || phase !== 'awaiting_data') {
      const ok = window.confirm('¿Deseas iniciar una nueva consulta? Se perderán los datos actuales.')
      if (!ok) return
    }
    setMessages([WELCOME_MESSAGE, DATA_REQUEST_MESSAGE])
    setFormData(defaultClinicalForm)
    setReport(null)
    setError(null)
    setPhase('awaiting_data')
    setShowForm(true)
    setAgents(DEFAULT_AGENTS.map(a => ({ ...a, status: 'pending', detail: a.detail })))
    setAgentStep(-1)
    setInputValue('')
  }, [report, phase])

  const handleSendMessage = useCallback(() => {
    const text = inputValue.trim()
    if (!text || loading) return

    addMessage({ role: 'user', content: text })
    setInputValue('')

    setShowTyping(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      setShowTyping(false)

      const lower = text.toLowerCase()
      if (lower.includes('hola') || lower.includes('buenas') || lower.includes('ayuda')) {
        addMessage({
          role: 'assistant',
          content: '¡Hola! Soy AnemIA, tu asistente clínico. Para comenzar, completa el formulario con los datos del paciente o carga el caso de ejemplo de Juliaca.',
        })
      } else if (lower.includes('ejemplo') || lower.includes('juliaca')) {
        loadExampleCase()
      } else if (lower.includes('nuevo') || lower.includes('nueva consulta')) {
        newConsultation()
      } else {
        addMessage({
          role: 'assistant',
          content: 'He recibido tu mensaje. Si deseas registrar un nuevo caso clínico, completa el formulario clínico con los datos del paciente. También puedes escribir "cargar ejemplo" para una demostración.',
        })
      }
      scrollToBottom()
    }, 1200)
  }, [inputValue, addMessage, loadExampleCase, newConsultation, loading, scrollToBottom])

  return {
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
    agentStep,
    submitForm,
    loadExampleCase,
    newConsultation,
    handleSendMessage,
  }
}
