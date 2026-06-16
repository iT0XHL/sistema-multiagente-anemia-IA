// Hook usePrediction — ejecuta el pipeline multiagente completo.
import { useCallback, useState } from 'react'

import { runAgents } from '../services/api'
import type { AgentRunReport, ClinicalCase, ModelName } from '../types'

export function usePrediction() {
  const [report, setReport] = useState<AgentRunReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (clinicalCase: ClinicalCase, model: ModelName) => {
    setLoading(true)
    setError(null)
    try {
      const result = await runAgents(clinicalCase, model)
      setReport(result)
      if (!result.ok) setError(result.error || 'El pipeline finalizó con errores.')
      return result
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || 'Error desconocido'
      setError(`No se pudo conectar con el backend: ${detail}`)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setReport(null)
    setError(null)
  }, [])

  return { report, loading, error, run, reset }
}
