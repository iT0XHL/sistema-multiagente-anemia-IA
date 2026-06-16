import { diagnosisColors } from '../mocks/exampleCase'
import type { AgentRunReport } from '../types'
import AnimatedCard from './AnimatedCard'

interface Props {
  report: AgentRunReport
}

// Tarjeta de resultado: Hbc, diagnóstico y recomendación.
export default function PredictionResultCard({ report }: Props) {
  const pre = report.preprocessing
  const pred = report.prediction
  if (!pre || !pred) return null

  return (
    <AnimatedCard delay={0.1}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Resultado</p>

      <div className="mt-2 grid grid-cols-3 items-center gap-2">
        <Metric label="Hb observada" value={`${pre.hb_observed}`} />
        <div className="text-center text-xs text-slate-400">
          ajuste
          <div className="font-bold text-red-500">{pre.adjustment}</div>
        </div>
        <Metric label="Hbc corregida" value={`${pre.hbc}`} highlight />
      </div>

      <div
        className="mt-4 rounded-xl p-3 text-center text-white"
        style={{ background: diagnosisColors[pred.diagnosis_code] }}
      >
        <p className="text-sm opacity-90">Diagnóstico estimado ({pred.model})</p>
        <p className="text-2xl font-bold">{pred.diagnosis_label}</p>
        <p className="text-sm opacity-90">Probabilidad {pred.probability}%</p>
      </div>

      {report.recommendation && (
        <div className="mt-3 rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-semibold text-slate-700">{report.recommendation.title}</p>
          <ul className="mt-1 space-y-1 text-xs text-slate-500">
            {report.recommendation.items.slice(0, 3).map((it, i) => (
              <li key={i}>• {it}</li>
            ))}
          </ul>
        </div>
      )}
    </AnimatedCard>
  )
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-2 text-center ${
        highlight ? 'border-brand-300 bg-brand-50' : 'border-slate-200'
      }`}
    >
      <div className={`text-lg font-bold ${highlight ? 'text-brand-700' : 'text-slate-700'}`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  )
}
