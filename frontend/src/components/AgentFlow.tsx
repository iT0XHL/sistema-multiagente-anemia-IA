import {
  Brain,
  ClipboardList,
  FileText,
  Lightbulb,
  Mountain,
  Pill,
} from 'lucide-react'

import type { AgentLogEntry } from '../types'
import AgentStatusCard from './AgentStatusCard'

const AGENTS = [
  { key: 'data_agent', label: 'Registro Clínico', sub: 'Validación', icon: ClipboardList },
  { key: 'preprocessing_agent', label: 'Clínico-Contextual', sub: 'Hbc / Altitud', icon: Mountain },
  { key: 'prediction_agent', label: 'Predictivo ML', sub: 'Diagnóstico', icon: Brain },
  { key: 'explainability_agent', label: 'Explicabilidad', sub: 'SHAP / LIME', icon: Lightbulb },
  { key: 'recommendation_agent', label: 'Terapéutico', sub: 'MINSA', icon: Pill },
  { key: 'monitoring_agent', label: 'Coordinador', sub: 'Auditoría', icon: FileText },
]

interface Props {
  logs?: AgentLogEntry[]
  active?: boolean
}

// Flujo visual animado de los 6 agentes y su estado.
export default function AgentFlow({ logs = [], active = false }: Props) {
  const byKey = new Map(logs.map((l) => [l.agent, l]))
  return (
    <div className="space-y-2">
      {AGENTS.map((agent, i) => (
        <AgentStatusCard
          key={agent.key}
          index={i}
          label={agent.label}
          sub={agent.sub}
          icon={agent.icon}
          log={byKey.get(agent.key)}
          active={active}
        />
      ))}
    </div>
  )
}
