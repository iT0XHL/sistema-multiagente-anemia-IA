import { motion, useReducedMotion } from 'framer-motion'
import {
  BarChart3, ChevronRight, Cpu, FilePlus2, FlaskConical, Info, Sparkles, Zap,
  ClipboardList, BookOpen, type LucideIcon,
} from 'lucide-react'

import { staggerContainer, staggerItem } from '../../lib/motion'
import BrandLogo from '../brand/BrandLogo'
import StatusBadge from '../ui/StatusBadge'

interface Props {
  onExampleCase: () => void
  onNewCase: () => void
  onAnalyze: () => void
  onViewAgents: () => void
  onDashboard: () => void
  onAbout: () => void
  disabled?: boolean
}

interface Action {
  key: string
  label: string
  hint: string
  icon: LucideIcon
  onClick: () => void
}

interface Group {
  title: string
  icon: LucideIcon
  items: Action[]
}

/**
 * Barra lateral de acciones del caso clínico. Agrupa las acciones en
 * «Acciones rápidas», «Resultados» e «Información»; la acción principal
 * (Analizar con agentes) se presenta como CTA destacada arriba.
 * En escritorio es el panel fijo (≥ lg); en móvil se monta dentro de un Drawer.
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

  const groups: Group[] = [
    {
      title: 'Acciones rápidas',
      icon: Zap,
      items: [
        { key: 'example', label: 'Cargar caso ejemplo', hint: 'Datos reales de Juliaca', icon: FlaskConical, onClick: onExampleCase },
        { key: 'new', label: 'Nuevo caso', hint: 'Reiniciar la consulta', icon: FilePlus2, onClick: onNewCase },
      ],
    },
    {
      title: 'Resultados',
      icon: ClipboardList,
      items: [
        { key: 'agents', label: 'Ver agentes y XAI', hint: 'Pipeline, SHAP/LIME y PDF', icon: Cpu, onClick: onViewAgents },
        { key: 'dashboard', label: 'Ver dashboard', hint: 'Métricas globales', icon: BarChart3, onClick: onDashboard },
      ],
    },
    {
      title: 'Información',
      icon: BookOpen,
      items: [
        { key: 'about', label: 'Acerca del proyecto', hint: 'Marco normativo y método', icon: Info, onClick: onAbout },
      ],
    },
  ]

  return (
    <nav className="flex h-full flex-col bg-transparent" aria-label="Acciones del caso clínico">
      <div className="flex items-center gap-2.5 border-b border-slate-200/70 px-4 py-3.5">
        <BrandLogo size={30} showWordmark={false} idle={false} title="AnemIA" />
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight text-slate-800">Panel del caso</p>
          <p className="text-[11px] text-slate-400">Acciones y resultados</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {/* CTA principal destacada */}
        <PrimaryAction onClick={onAnalyze} disabled={disabled} reduce={!!reduce} />

        <motion.div
          variants={reduce ? undefined : staggerContainer(0.05, 0.08)}
          initial={reduce ? false : 'hidden'}
          animate="visible"
        >
          {groups.map((group) => (
            <section key={group.title} className="mt-4 first:mt-5">
              <p className="eyebrow mb-2 px-1">
                <group.icon size={12} className="text-teal-600" aria-hidden="true" />
                {group.title}
              </p>
              <ul className="space-y-1.5">
                {group.items.map((a) => (
                  <motion.li key={a.key} variants={reduce ? undefined : staggerItem}>
                    <ActionRow action={a} disabled={disabled} reduce={!!reduce} />
                  </motion.li>
                ))}
              </ul>
            </section>
          ))}
        </motion.div>
      </div>

      <div className="border-t border-slate-200/70 px-4 py-3">
        <StatusBadge />
      </div>
    </nav>
  )
}

function PrimaryAction({ onClick, disabled, reduce }: { onClick: () => void; disabled?: boolean; reduce: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={reduce || disabled ? undefined : { y: -2 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.985 }}
      aria-label="Analizar caso con agentes"
      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-teal-600 px-3.5 py-3 text-left text-white shadow-glow transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
    >
      {/* Borde animado sutil de la acción principal */}
      {!reduce && !disabled && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-white/30"
          animate={{ opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
        <Sparkles size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-tight">Analizar con agentes</span>
        <span className="block truncate text-[11px] font-medium text-teal-50/90">Ejecutar el pipeline multiagente</span>
      </span>
      <ChevronRight size={18} className="flex-shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </motion.button>
  )
}

function ActionRow({ action, disabled, reduce }: { action: Action; disabled?: boolean; reduce: boolean }) {
  const { label, hint, icon: Icon, onClick } = action
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={reduce || disabled ? undefined : { x: 3 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      aria-label={label}
      className="group flex w-full items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-left shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/40 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-teal-100 group-hover:text-teal-700">
        <Icon size={16} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-700 group-hover:text-slate-900">{label}</span>
        <span className="block truncate text-[11px] text-slate-400">{hint}</span>
      </span>
      <ChevronRight size={15} className="flex-shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-400" aria-hidden="true" />
    </motion.button>
  )
}
