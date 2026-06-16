import type { ReactNode } from 'react'

import AnimatedCard from './AnimatedCard'

interface Props {
  title: string
  value: ReactNode
  subtitle?: string
  delay?: number
}

// Tarjeta de métrica para el dashboard.
export default function DashboardCard({ title, value, subtitle, delay = 0 }: Props) {
  return (
    <AnimatedCard delay={delay}>
      <p className="text-3xl font-bold text-brand-700">{value}</p>
      <p className="text-xs font-medium text-slate-600">{title}</p>
      {subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>}
    </AnimatedCard>
  )
}
