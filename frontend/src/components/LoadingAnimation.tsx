import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface Props {
  label?: string
}

// Animación de carga reutilizable.
export default function LoadingAnimation({ label = 'Cargando…' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400"
    >
      <Loader2 className="animate-spin" size={28} />
      <span className="text-sm">{label}</span>
    </motion.div>
  )
}
