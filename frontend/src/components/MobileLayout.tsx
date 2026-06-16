import type { ReactNode } from 'react'

import BottomNav from './BottomNav'
import Header from './Header'

interface Props {
  children: ReactNode
  hideLayout?: boolean
}

// Contenedor mobile-first con cabecera, banner de prototipo y nav inferior.
export default function MobileLayout({ children, hideLayout }: Props) {
  if (hideLayout) {
    return <div className="h-full">{children}</div>
  }

  return (
    <div className="min-h-full bg-slate-100">
      <Header />

      <div className="bg-amber-50 border-b border-amber-200" role="alert" aria-label="Aviso de prototipo académico">
        <p className="mx-auto max-w-lg px-4 py-1.5 text-[11px] leading-snug text-amber-700">
          <strong>Prototipo académico.</strong> No reemplaza el diagnóstico clínico
          profesional. Toda recomendación debe validarse por personal de salud.
        </p>
      </div>

      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">{children}</main>

      <BottomNav />
    </div>
  )
}
