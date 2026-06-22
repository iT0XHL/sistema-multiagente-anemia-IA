import { motion } from 'framer-motion'
import { Activity, Database } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import AnimatedCard from '../components/AnimatedCard'
import DashboardCard from '../components/DashboardCard'
import LoadingAnimation from '../components/LoadingAnimation'
import { useDashboard } from '../hooks/useDashboard'
import { diagnosisColors } from '../mocks/exampleCase'
import { pageTransition } from '../pageTransition'

const labelToCode: Record<string, string> = {
  Normal: 'Normal',
  'Anemia Leve': 'AnemiaLeve',
  'Anemia Moderada': 'AnemiaModerada',
  'Anemia Severa': 'AnemiaSevera',
}

export default function Dashboard() {
  const { data, models, loading } = useDashboard()

  if (loading) return <LoadingAnimation label="Cargando panel…" />

  const pieData = Object.entries(data?.by_diagnosis ?? {}).map(([name, value]) => ({ name, value }))

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Panel de control</h2>

      <div className="grid grid-cols-2 gap-3">
        <DashboardCard
          title="Predicciones registradas"
          value={data?.total_predictions ?? 0}
          icon={<Activity size={18} />}
        />
        <AnimatedCard delay={0.05}>
          <div className="flex items-center gap-2">
            <Database size={18} className="text-slate-400" />
            <span
              className={`chip ${
                data?.database === 'connected'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {data?.database === 'connected' ? 'PostgreSQL OK' : 'Sin base de datos'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Estado de persistencia</p>
        </AnimatedCard>
      </div>

      {pieData.length > 0 && (
        <AnimatedCard delay={0.1}>
          <p className="mb-2 text-sm font-semibold text-slate-700">Distribución por diagnóstico</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                {pieData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={diagnosisColors[labelToCode[entry.name] || entry.name] || '#64748b'}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </AnimatedCard>
      )}

      <AnimatedCard delay={0.15}>
        <p className="mb-2 text-sm font-semibold text-slate-700">Modelos</p>
        <div className="space-y-2">
          {models.map((m) => (
            <div
              key={m.name}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-2 text-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">{m.name}</span>
              {m.trained ? (
                <span className="text-xs text-slate-500">
                  acc {m.metrics?.accuracy ?? '—'} · F1 {m.metrics?.f1_macro ?? '—'}
                </span>
              ) : (
                <span className="chip bg-amber-100 text-amber-700">sin entrenar</span>
              )}
            </div>
          ))}
        </div>
      </AnimatedCard>

      <AnimatedCard delay={0.2}>
        <p className="mb-2 text-sm font-semibold text-slate-700">Logs recientes</p>
        {data?.recent_logs?.length ? (
          <div className="space-y-1">
            {data.recent_logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{log.agent}</span>
                <span className={log.status === 'ok' ? 'text-emerald-600' : 'text-red-500'}>
                  {log.status} · {log.elapsed_ms} ms
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Aún no hay registros de ejecución.</p>
        )}
      </AnimatedCard>
    </motion.div>
  )
}
