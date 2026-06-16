// ============================================================
//  Contexto que comparte el último reporte multiagente y el caso
//  clínico entre las páginas (Predicción → Explicabilidad → Agentes).
// ============================================================
import { createContext, useContext, useState, type ReactNode } from 'react'

import { exampleCase } from './mocks/exampleCase'
import type { AgentRunReport, ClinicalCase, ModelName } from './types'

interface CaseCtx {
  clinicalCase: ClinicalCase
  setClinicalCase: (c: ClinicalCase) => void
  model: ModelName
  setModel: (m: ModelName) => void
  report: AgentRunReport | null
  setReport: (r: AgentRunReport | null) => void
}

const Ctx = createContext<CaseCtx | null>(null)

export function CaseProvider({ children }: { children: ReactNode }) {
  const [clinicalCase, setClinicalCase] = useState<ClinicalCase>(exampleCase)
  const [model, setModel] = useState<ModelName>('random_forest')
  const [report, setReport] = useState<AgentRunReport | null>(null)
  return (
    <Ctx.Provider
      value={{ clinicalCase, setClinicalCase, model, setModel, report, setReport }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useCaseContext() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCaseContext debe usarse dentro de CaseProvider')
  return ctx
}
