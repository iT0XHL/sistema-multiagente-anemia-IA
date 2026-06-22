import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface Props {
  message: string
}

// Banner de error reutilizable.
export default function ErrorMessage({ message }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
    >
      <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </motion.div>
  )
}
