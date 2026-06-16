import { motion } from 'framer-motion'
import { FlaskConical, RotateCcw, Send } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  onExampleCase: () => void
  onNewConsultation: () => void
  disabled?: boolean
  showActions?: boolean
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onExampleCase,
  onNewConsultation,
  disabled,
  showActions,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-lg" role="complementary" aria-label="Entrada de chat">
      <div className="mx-auto max-w-3xl px-4 py-3">
        {showActions && (
          <div className="mb-2 flex items-center justify-center gap-3" role="toolbar" aria-label="Acciones rápidas">
            <button
              onClick={onExampleCase}
              disabled={disabled}
              className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 transition disabled:opacity-40"
              aria-label="Cargar caso de ejemplo de Juliaca"
            >
              <FlaskConical size={12} aria-hidden="true" />
              Cargar caso ejemplo (Juliaca)
            </button>
            <button
              onClick={onNewConsultation}
              disabled={disabled}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition disabled:opacity-40"
              aria-label="Iniciar nueva consulta"
            >
              <RotateCcw size={12} aria-hidden="true" />
              Nueva consulta
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2" role="form" aria-label="Formulario de mensaje">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe un mensaje o pregunta..."
            disabled={disabled}
            aria-label="Escribe un mensaje"
            className="flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:opacity-50"
          />
          <motion.button
            type="submit"
            disabled={!value.trim() || disabled}
            whileTap={{ scale: 0.9 }}
            aria-label="Enviar mensaje"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-40"
          >
            <Send size={16} aria-hidden="true" />
          </motion.button>
        </form>
      </div>
    </div>
  )
}
