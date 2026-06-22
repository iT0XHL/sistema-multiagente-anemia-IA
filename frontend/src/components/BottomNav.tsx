import { motion } from 'framer-motion'
import { BarChart3, MessageSquareText } from 'lucide-react'
import { NavLink } from 'react-router-dom'

// El historial se abre desde la cabecera del chat y «Acerca» vive en la barra
// lateral de acciones; por eso la nav inferior se reduce a Chat + Panel.
const items = [
  { to: '/chat', label: 'Chat', icon: MessageSquareText },
  { to: '/dashboard', label: 'Panel', icon: BarChart3 },
]

// Barra de navegación inferior (mobile-first) tipo cristal con píldora activa.
export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-white/75 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150"
      aria-label="Navegación principal"
    >
      <div className="mx-auto grid max-w-xs grid-cols-2 gap-1 p-1.5 lg:max-w-sm">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={`Ir a ${label}`}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-colors ${
                isActive ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  // Píldora activa que se desliza entre pestañas (shared layout).
                  <motion.span
                    layoutId="bottomNavPill"
                    className="absolute inset-0 rounded-xl bg-teal-50 ring-1 ring-teal-100"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <motion.span
                  animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  className="relative z-10"
                >
                  <Icon size={20} aria-hidden="true" />
                </motion.span>
                <span className="relative z-10">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
