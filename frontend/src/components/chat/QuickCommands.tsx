import { motion } from 'framer-motion'
import { BarChart3, Cpu, FilePlus2, FlaskConical, Sparkles } from 'lucide-react'

interface Props {
  onExampleCase: () => void
  onNewCase: () => void
  onAnalyze: () => void
  onViewAgents: () => void
  onDashboard: () => void
  disabled?: boolean
}

const baseChip =
  'flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ' +
  'transition disabled:opacity-40 disabled:cursor-not-allowed'

export default function QuickCommands({
  onExampleCase,
  onNewCase,
  onAnalyze,
  onViewAgents,
  onDashboard,
  disabled,
}: Props) {
  const actions = [
    { key: 'example', label: 'Cargar caso ejemplo', icon: FlaskConical, onClick: onExampleCase, primary: true },
    { key: 'new', label: 'Nuevo caso', icon: FilePlus2, onClick: onNewCase },
    { key: 'analyze', label: 'Analizar con agentes', icon: Sparkles, onClick: onAnalyze, primary: true },
    { key: 'agents', label: 'Ver agentes', icon: Cpu, onClick: onViewAgents },
    { key: 'dashboard', label: 'Ver dashboard', icon: BarChart3, onClick: onDashboard },
  ]

  return (
    <div
      className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
      role="toolbar"
      aria-label="Acciones rápidas"
    >
      {actions.map(({ key, label, icon: Icon, onClick, primary }) => (
        <motion.button
          key={key}
          type="button"
          onClick={onClick}
          disabled={disabled}
          whileTap={{ scale: 0.95 }}
          aria-label={label}
          className={
            baseChip +
            (primary
              ? ' border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100'
              : ' border-slate-200 bg-white text-slate-600 hover:bg-slate-50')
          }
        >
          <Icon size={13} aria-hidden="true" />
          {label}
        </motion.button>
      ))}
    </div>
  )
}
