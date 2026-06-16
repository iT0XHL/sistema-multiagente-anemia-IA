import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { useEffect, useRef } from 'react'

import QuickCommands from './QuickCommands'

interface Props {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  onExampleCase: () => void
  onNewCase: () => void
  onAnalyze: () => void
  onViewAgents: () => void
  onDashboard: () => void
  disabled?: boolean
  showActions?: boolean
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onExampleCase,
  onNewCase,
  onAnalyze,
  onViewAgents,
  onDashboard,
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
    <div
      className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-lg"
      role="complementary"
      aria-label="Entrada de chat"
    >
      <div className="mx-auto max-w-4xl px-3 py-3 sm:px-4">
        {showActions && (
          <div className="mb-2.5">
            <QuickCommands
              onExampleCase={onExampleCase}
              onNewCase={onNewCase}
              onAnalyze={onAnalyze}
              onViewAgents={onViewAgents}
              onDashboard={onDashboard}
              disabled={disabled}
            />
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2" role="form" aria-label="Formulario de mensaje">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe un mensaje o un comando (ej. /ayuda)…"
            disabled={disabled}
            aria-label="Escribe un mensaje o comando"
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
