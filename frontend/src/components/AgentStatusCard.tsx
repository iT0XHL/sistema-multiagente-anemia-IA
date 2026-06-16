import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, type LucideIcon } from 'lucide-react'

import type { AgentLogEntry } from '../types'

interface Props {
  index: number
  label: string
  sub: string
  icon: LucideIcon
  log?: AgentLogEntry
  active?: boolean
}

// Tarjeta de estado de un agente individual.
export default function AgentStatusCard({ index, label, sub, icon: Icon, log, active }: Props) {
  const done = log?.status === 'ok'
  const error = log?.status === 'error'
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        error
          ? 'border-red-200 bg-red-50'
          : done
            ? 'border-brand-200 bg-brand-50'
            : 'border-slate-200 bg-white'
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          done ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
        }`}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-700">
          Agente {index + 1} · {label}
        </p>
        <p className="text-[11px] text-slate-400">{log?.message || sub}</p>
      </div>
      {done && <CheckCircle2 size={18} className="text-brand-600" />}
      {error && <XCircle size={18} className="text-red-500" />}
      {!log && active && <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />}
      {log && <span className="text-[10px] text-slate-400">{log.elapsed_ms} ms</span>}
    </motion.div>
  )
}
