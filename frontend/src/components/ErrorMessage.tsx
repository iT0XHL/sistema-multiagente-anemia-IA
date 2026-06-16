import { AlertTriangle } from 'lucide-react'

interface Props {
  message: string
}

// Banner de error reutilizable.
export default function ErrorMessage({ message }: Props) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
      <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}
