import { Cpu } from 'lucide-react'

import type { AgentDescriptor } from '../../types'
import AgentStatusItem from './AgentStatusItem'

const DEFAULT_AGENTS: AgentDescriptor[] = [
  { id: 'data_agent', name: 'Registro', description: 'Clínico', icon: 'ClipboardList', status: 'pending' },
  { id: 'preprocessing_agent', name: 'Contextual', description: 'Altitud / Hbc', icon: 'Mountain', status: 'pending' },
  { id: 'prediction_agent', name: 'Predictivo', description: 'ML · Diagnóstico', icon: 'Brain', status: 'pending' },
  { id: 'explainability_agent', name: 'Explicabilidad', description: 'XAI · SHAP', icon: 'Lightbulb', status: 'pending' },
  { id: 'recommendation_agent', name: 'Terapéutico', description: 'Recomendación', icon: 'Pill', status: 'pending' },
  { id: 'monitoring_agent', name: 'Coordinador', description: 'Reporte PDF', icon: 'Cpu', status: 'pending' },
]

interface Props {
  agents?: AgentDescriptor[]
  compact?: boolean
}

export default function AgentSidebar({ agents, compact }: Props) {
  const displayAgents = agents || DEFAULT_AGENTS

  return (
    <div className={compact ? 'py-2' : 'p-3'}>
      <div className={`flex items-center gap-2 mb-3 ${compact ? 'px-4 py-2' : ''}`}>
        <Cpu size={14} className="text-teal-600" aria-hidden="true" />
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Agentes del sistema
        </h3>
      </div>
      <div className="space-y-0.5">
        {displayAgents.map((agent, i) => (
          <AgentStatusItem
            key={agent.id}
            index={i}
            name={agent.name}
            description={agent.description}
            status={agent.status}
            detail={agent.detail}
          />
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          <span className="text-teal-600 font-medium">UNA Puno · 2024</span>
          <br />
          Prototipo de investigación
        </p>
      </div>
    </div>
  )
}
