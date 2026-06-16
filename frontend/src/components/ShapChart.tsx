import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { XaiFactor } from '../types'

interface Props {
  factors: XaiFactor[]
  title?: string
  color?: string
}

// Gráfico horizontal de importancia de variables (SHAP / LIME) con Recharts.
export default function ShapChart({ factors, title, color = '#0d9488' }: Props) {
  if (!factors?.length) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        Sin datos de explicabilidad disponibles.
      </p>
    )
  }
  const data = factors.map((f) => ({ name: f.label, value: f.weight_norm }))
  const height = Math.max(180, data.length * 40)

  return (
    <div>
      {title && <p className="mb-2 text-sm font-semibold text-slate-700">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" domain={[0, 1]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11, fill: '#475569' }}
          />
          <Tooltip
            formatter={(v: number) => [v.toFixed(3), 'Importancia']}
            cursor={{ fill: '#f1f5f9' }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={1 - i * 0.12} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
