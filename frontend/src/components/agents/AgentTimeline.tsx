import { motion } from 'framer-motion'
import { CheckCircle2, Clock, AlertTriangle, Cpu, ArrowRight } from 'lucide-react'

import type { AgentDescriptor } from '../../types'

interface Props {
  agents: AgentDescriptor[]
  currentStep?: number
}

export default function AgentTimeline({ agents, currentStep }: Props) {
  return (
    <div className="p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Cpu size={16} className="text-teal-600" />
        Progreso de agentes
      </h3>
      <div className="relative space-y-0">
        {agents.map((agent, i) => {
          const isActive = agent.status === 'running'
          const isDone = agent.status === 'completed'
          const isError = agent.status === 'error'
          const isLast = i === agents.length - 1

          return (
            <div key={agent.id} className="flex items-start gap-3 pb-4 relative">
              {!isLast && (
                <div className={`absolute left-3 top-8 w-0.5 h-6 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
              <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 z-10 ${
                isDone ? 'border-emerald-500 bg-emerald-50' :
                isError ? 'border-red-500 bg-red-50' :
                isActive ? 'border-teal-500 bg-teal-50' :
                'border-slate-300 bg-white'
              }`}>
                {isDone ? <CheckCircle2 size={12} className="text-emerald-600" /> :
                 isError ? <AlertTriangle size={12} className="text-red-600" /> :
                 isActive ?
                   <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="h-2 w-2 rounded-full bg-teal-600" />
                 : <div className="h-2 w-2 rounded-full bg-slate-300" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-semibold ${isActive ? 'text-teal-700' : isDone ? 'text-emerald-700' : isError ? 'text-red-700' : 'text-slate-500'}`}>
                    {agent.name}
                  </p>
                  {isActive && <span className="text-[10px] text-teal-500">(en progreso)</span>}
                  {isDone && <CheckCircle2 size={10} className="text-emerald-500" />}
                </div>
                <p className="text-[10px] text-slate-400 truncate">{agent.detail || agent.description}</p>
              </div>
            </div>
          )
        })}
      </div>
      {currentStep !== undefined && agents.some(a => a.status === 'completed') && (
        <div className="flex items-center justify-between rounded-xl bg-teal-50 px-3 py-2 text-xs text-teal-700">
          <span>Progreso: {agents.filter(a => a.status === 'completed' || a.status === 'running').length}/{agents.length}</span>
          {currentStep > 0 && currentStep < agents.length && (
            <span className="flex items-center gap-1">
              Siguiente: {agents[currentStep]?.name} <ArrowRight size={12} />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
