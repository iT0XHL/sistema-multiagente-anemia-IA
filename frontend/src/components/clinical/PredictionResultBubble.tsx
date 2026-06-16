import { motion } from 'framer-motion'
import { Brain, CheckCircle2 } from 'lucide-react'

import { diagnosisColors } from '../../mocks/exampleCase'
import type { AgentRunReport } from '../../types'

interface Props {
  report: AgentRunReport
}

export default function PredictionResultBubble({ report }: Props) {
  const pre = report.preprocessing
  const pred = report.prediction
  if (!pre || !pred) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      role="region"
      aria-label="Resultado de predicción"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
        <Brain size={15} className="text-teal-600" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-700">Agente 3 · Predictivo — Resultado</span>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          <Metric label="Hb observada" value={`${pre.hb_observed}`} />
          <Metric label="Ajuste" value={`${pre.adjustment > 0 ? '+' : ''}${pre.adjustment}`} highlight />
          <Metric label="Hb corregida" value={`${pre.hbc}`} highlight />
        </div>

        <div
          className="rounded-xl p-3 text-center text-white"
          style={{ background: diagnosisColors[pred.diagnosis_code] || '#0d9488' }}
        >
          <p className="text-[10px] opacity-90">Diagnóstico estimado ({pred.model})</p>
          <p className="text-xl font-bold mt-0.5">{pred.diagnosis_label}</p>
          <p className="text-xs opacity-90 mt-0.5">Confianza: {pred.probability}%</p>
        </div>

        {pred.class_probabilities && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500">Probabilidades por clase</p>
            {Object.entries(pred.class_probabilities).map(([cls, prob]) => (
              <div key={cls} className="flex items-center gap-1.5">
                <span className="w-24 text-[10px] text-slate-600 truncate">{cls}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(prob * 100).toFixed(1)}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="h-full rounded-full bg-teal-500"
                  />
                </div>
                <span className="w-8 text-right text-[10px] font-medium text-slate-600">
                  {(prob * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {report.monitoring && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] text-slate-500">
            <span>Pipeline completado</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-teal-600" />
              {report.monitoring.total_elapsed_ms} ms
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border p-1.5 text-center ${highlight ? 'border-teal-200 bg-teal-50' : 'border-slate-200'}`}>
      <span className={`text-sm font-bold ${highlight ? 'text-teal-700' : 'text-slate-700'}`}>{value}</span>
      <span className="text-[9px] text-slate-400">{label}</span>
    </div>
  )
}
