import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp, Cpu } from 'lucide-react'
import { useEffect, useState } from 'react'

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
}

export default function MobileAgentDrawer({ agents }: Props) {
  const [open, setOpen] = useState(false)
  const displayAgents = agents || DEFAULT_AGENTS

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const activeCount = displayAgents.filter(a => a.status === 'running').length
  const doneCount = displayAgents.filter(a => a.status === 'completed').length
  const panelId = 'mobile-agent-panel'
  const triggerId = 'mobile-agent-trigger'

  return (
    <div className="border-t border-slate-200 bg-white lg:hidden" role="region" aria-label="Panel de agentes">
      <button
        id={triggerId}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open) } }}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-slate-500"
      >
        <div className="flex items-center gap-2">
          <Cpu size={13} className="text-teal-600" aria-hidden="true" />
          <span>Agentes</span>
          {doneCount > 0 && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700" aria-label={`${doneCount} de 6 completados`}>
              {doneCount}/6
            </span>
          )}
          {activeCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] text-teal-700" aria-label="Procesando">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-600" aria-hidden="true" />
              Procesando
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} aria-hidden="true">
          <ChevronUp size={14} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="list"
            aria-label="Estado de los 6 agentes"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-0.5">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
