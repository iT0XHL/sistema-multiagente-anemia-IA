interface Props {
  /** Hay agentes ejecutándose: muestra estado «Analizando» en ámbar. */
  running?: boolean
  /** Oculta el texto y deja solo el punto (para espacios reducidos). */
  compact?: boolean
  className?: string
}

/**
 * Indicador de estado del sistema. Punto con latido sutil + etiqueta.
 * Refleja estado local seguro (idle vs. pipeline en ejecución); no consulta
 * al backend.
 */
export default function StatusBadge({ running = false, compact = false, className = '' }: Props) {
  const label = running ? 'Analizando…' : 'Sistema activo'
  const tone = running
    ? 'bg-amber-50 text-amber-700 ring-amber-200/80'
    : 'bg-emerald-50 text-emerald-700 ring-emerald-200/80'
  const dot = running ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ${tone} ${className}`}
      role="status"
      aria-label={`Estado del sistema: ${running ? 'analizando' : 'activo'}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dot} ${running ? 'animate-ping' : 'animate-breathe'}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      {!compact && <span className="text-[10px] font-semibold tracking-wide">{label}</span>}
    </span>
  )
}
