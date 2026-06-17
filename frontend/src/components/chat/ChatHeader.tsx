import { motion } from 'framer-motion'
import { HeartPulse, History, PanelRight } from 'lucide-react'

interface Props {
  title?: string
  onOpenHistory?: () => void
  /** Abre la barra de acciones (solo móvil/tablet; en desktop es panel fijo). */
  onOpenResults?: () => void
  showResultsButton?: boolean
  /** Progreso de agentes para el badge del botón de acciones. */
  agentsDone?: number
  agentsTotal?: number
  running?: boolean
}

export default function ChatHeader({
  title,
  onOpenHistory,
  onOpenResults,
  showResultsButton,
  agentsDone = 0,
  agentsTotal = 6,
  running,
}: Props) {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-lg shadow-teal-900/20" role="banner">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        {onOpenHistory && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onOpenHistory}
            aria-label="Abrir historial de consultas"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur transition hover:bg-white/20"
          >
            <History size={18} />
          </motion.button>
        )}

        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur" aria-hidden="true">
          <HeartPulse size={18} className="text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold leading-tight tracking-tight sm:text-base">
            AnemIA <span className="font-light text-teal-200">·</span> Asistente Clínico
          </h1>
          <p className="truncate text-[10px] text-teal-200 sm:text-[11px]">
            {title || 'Sistema Multiagente · Diagnóstico de Anemia Infantil · Puno, Perú'}
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur md:flex" aria-label="Estado del sistema: activo">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-medium text-emerald-200">Sistema activo</span>
        </div>

        {showResultsButton && onOpenResults && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onOpenResults}
            aria-label="Abrir acciones del caso"
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur transition hover:bg-white/20 lg:hidden"
          >
            <PanelRight size={18} />
            {agentsDone > 0 && (
              <span className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${running ? 'bg-amber-400 text-amber-900' : 'bg-emerald-400 text-emerald-900'}`}>
                {agentsDone}/{agentsTotal}
              </span>
            )}
          </motion.button>
        )}
      </div>
    </header>
  )
}
