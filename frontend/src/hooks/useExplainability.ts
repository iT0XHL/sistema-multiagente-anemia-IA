// Hook useExplainability — obtiene explicaciones SHAP y LIME del caso actual.
import { useCallback, useState } from 'react'

import { getLimeExplanation, getShapExplanation } from '../services/api'
import type { ClinicalCase, ExplanationResult, ModelName, ShapResult } from '../types'

export function useExplainability() {
  const [shap, setShap] = useState<ShapResult | null>(null)
  const [lime, setLime] = useState<ExplanationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compute = useCallback(async (clinicalCase: ClinicalCase, model: ModelName) => {
    setLoading(true)
    setError(null)
    try {
      const [shapRes, limeRes] = await Promise.all([
        getShapExplanation(clinicalCase, model),
        getLimeExplanation(clinicalCase, model),
      ])
      setShap(shapRes)
      setLime(limeRes)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'No se pudo calcular la explicabilidad.')
    } finally {
      setLoading(false)
    }
  }, [])

  const seed = useCallback((shapRes: ShapResult | null, limeRes: ExplanationResult | null) => {
    setShap(shapRes)
    setLime(limeRes)
  }, [])

  return { shap, lime, loading, error, compute, seed }
}
