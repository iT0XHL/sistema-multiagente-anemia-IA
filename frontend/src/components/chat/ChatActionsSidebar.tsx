import { motion, useReducedMotion } from 'framer-motion'
import {
  BarChart3, ChevronRight, Cpu, FilePlus2, FlaskConical, Info, Sparkles,
  type LucideIcon,
} from 'lucide-react'

interface Props {
  onExampleCase: () => void
  onNewCase: () => void
  onAnalyze: () => void
  onViewAgents: () => void
  onDashboard: () => void
  onAbout: () => void
  disabled?: boolean
}

type Tone = 'primary' | 'default'

interface Action {
  key: string
  label: string
  hint: string
  icon: LucideIcon
  onClick: () => void
  tone: Tone
}

/**
 * Barra lateral de acciones del chat. Reemplaza la fila de «chips» que estaba
 * sobre el input: agrupa las acciones del caso clínico como opciones verticales.
 * En escritorio es el panel fijo (≥ lg); en móvil se monta dentro de un Drawer.
 * `Acerca` se ubica al pie como acceso extra.
 */
export default function ChatActionsSidebar({
  onExampleCase,
  onNewCase,
  onAnalyze,
  onViewAgents,
  onDashboard,
  onAbout,
  disabled,
}: Props) {
  const reduce = useReducedMotion()

  const actions: Action[] = [
    { key: 'example', label: 'Cargar caso ejemplo', hint: 'Datos de Juliaca', icon: FlaskConical, onClick: onExampleCase, tone: 'primary' },
    { key: 'new', label: 'Nuevo caso', hint: 'Reiniciar la consulta', icon: FilePlus2, onClick: onNewCase, tone: 'default' },
    { key: 'analyze', label: 'Analizar con agentes', hint: 'Ejecutar el pipeline', icon: Sparkles, onClick: onAnalyze, tone: 'primary' },
    { key: 'agents', label: 'Ver agentes', hint: 'Resultados, XAI y PDF', icon: Cpu, onClick: onViewAgents, tone: 'default' },
    { key: 'dashboard', label: 'Ver dashboard', hint: 'Métricas globales', icon: BarChart3, onClick: onDashboard, tone: 'default' },
  ]

  return (
    <nav className="flex h-full flex-col bg-white" aria-label="Acciones del caso clínico">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <Sparkles size={15} className="text-teal-600" />
        <h2 className="text-sm font-semibold text-slate-700">Acciones</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-2">
          {actions.map((a, i) => (
            <li key={a.key}>
              <ActionButton action={a} index={i} disabled={disabled} reduce={!!reduce} />
            </li>
          ))}
        </ul>
      </div>

      {/* Acceso extra: «Acerca» al pie de la barra lateral. */}
      <div className="border-t border-slate-200 px-3 py-3">
        <motion.button
          type="button"
          onClick={onAbout}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          aria-label="Ir a Acerca del proyecto"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Info size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">Acerca</span>
            <span className="block truncate text-[11px] text-slate-400">El proyecto y su marco normativo</span>
          </span>
          <ChevronRight size={15} className="flex-shrink-0 text-slate-300" />
        </motion.button>
      </div>
    </nav>
  )
}

function ActionButton({
  action, index, disabled, reduce,
}: { action: Action; index: number; disabled?: boolean; reduce: boolean }) {
  const { label, hint, icon: Icon, onClick, tone } = action
  const primary = tone === 'primary'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      initial={reduce ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={reduce ? { duration: 0 } : { delay: 0.03 * index, duration: 0.22, ease: 'easeOut' }}
      whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
      aria-label={label}
      className={
        'group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ' +
        'disabled:cursor-not-allowed disabled:opacity-40 ' +
        (primary
          ? 'border-teal-200 bg-teal-50/70 hover:border-teal-300 hover:bg-teal-50'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50')
      }
    >
      <span
        className={
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition ' +
          (primary ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200')
        }
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-semibold ${primary ? 'text-teal-800' : 'text-slate-700'}`}>{label}</span>
        <span className="block truncate text-[11px] text-slate-400">{hint}</span>
      </span>
      <ChevronRight
        size={15}
        className={`flex-shrink-0 transition group-hover:translate-x-0.5 ${primary ? 'text-teal-400' : 'text-slate-300'}`}
      />
    </motion.button>
  )
}
