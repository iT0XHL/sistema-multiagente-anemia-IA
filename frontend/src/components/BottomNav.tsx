import { BarChart3, MessageCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'

// El historial se abre desde la cabecera del chat y «Acerca» vive en la barra
// lateral de acciones; por eso la nav inferior se reduce a Chat + Panel.
const items = [
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/dashboard', label: 'Panel', icon: BarChart3 },
]

// Barra de navegación inferior (mobile-first).
export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur" aria-label="Navegación principal">
      <div className="mx-auto grid max-w-xs grid-cols-2 lg:max-w-sm">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={`Ir a ${label}`}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 text-xs transition ${
                isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
