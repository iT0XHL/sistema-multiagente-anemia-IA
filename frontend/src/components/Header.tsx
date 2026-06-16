import { HeartPulse } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-lg shadow-teal-900/20" role="banner">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        <button onClick={() => navigate('/chat')} className="flex items-center gap-3 flex-1 min-w-0" aria-label="Ir al chat">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 shadow-inner" aria-hidden="true">
            <HeartPulse size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">AnemIA <span className="font-light text-teal-200">·</span> Asistente Clínico</h1>
            <p className="text-[11px] text-teal-200 truncate">
              Sistema Multiagente · Diagnóstico de Anemia Infantil · Puno, Perú
            </p>
          </div>
        </button>
        <div className="flex flex-shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur" aria-label="Estado del sistema: activo">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-medium text-emerald-200">Sistema activo</span>
        </div>
      </div>
    </header>
  )
}
