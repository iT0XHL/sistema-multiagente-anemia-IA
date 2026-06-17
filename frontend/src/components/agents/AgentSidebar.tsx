import { Cpu } from 'lucide-react'

import type { AgentDescriptor } from '../../types'
import AgentStatusItem from './AgentStatusItem'

interface Props {
  agents: AgentDescriptor[]
}

export default function AgentSidebar({ agents }: Props) {
  const done = agents.filter((a) => a.status === 'completed').length
  const running = agents.some((a) => a.status === 'running')

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-teal-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-700">Sistema multiagente</h2>
          <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-slate-500">
            {running && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" aria-hidden="true" />
            )}
            {done}/{agents.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-500"
            style={{ width: `${Math.round((done / agents.length) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3" role="list" aria-label="Estado de los agentes">
        {agents.map((agent, i) => (
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

      <div className="border-t border-slate-100 px-4 py-3">
        <p className="text-[10px] leading-relaxed text-slate-400">
          <span className="font-medium text-teal-600">UNA Puno · 2024</span>
          <br />
          Prototipo de investigación
        </p>
      </div>
    </div>
  )
}
