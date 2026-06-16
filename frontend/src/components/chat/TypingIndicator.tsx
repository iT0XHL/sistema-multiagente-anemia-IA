import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-2.5 px-4 mb-3"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm" aria-hidden="true">
        <Bot size={15} />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-none bg-white border border-slate-200 px-4 py-3 shadow-sm">
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
          className="h-2 w-2 rounded-full bg-teal-500"
        />
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
          className="h-2 w-2 rounded-full bg-teal-500"
        />
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
          className="h-2 w-2 rounded-full bg-teal-500"
        />
      </div>
    </motion.div>
  )
}
