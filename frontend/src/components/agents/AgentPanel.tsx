import { motion } from 'framer-motion'
import { Activity, Cpu } from 'lucide-react'

import { diagnosisColors } from '../../mocks/exampleCase'
import type { AgentDescriptor, AgentRunReport, ClinicalFormData } from '../../types'
import AgentTimeline from './AgentTimeline'

interface Props {
  agents: AgentDescriptor[]
  formData: ClinicalFormData
  report: AgentRunReport | null
}

export default function AgentPanel({ agents, formData, report }: Props) {
  const done = agents.filter((a) => a.status === 'completed').length
  const running = agents.some((a) => a.status === 'running')
  const total = agents.length
  const pct = Math.round((done / total) * 100)

  const hasCase = Boolean(formData.Hemoglobina && formData.AlturaREN && formData.EdadMeses)
  const modelLabel = formData.Modelo === 'xgboost' ? 'XGBoost' : 'Random Forest'

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera + progreso global */}
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-teal-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-700">Sistema multiagente</h2>
          <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-slate-500">
            {running && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" aria-hidden="true" />
            )}
            {done}/{total}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-teal-500"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Resumen del caso */}
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <Activity size={12} className="text-teal-600" />
          Resumen del caso
        </h3>
        {hasCase ? (
          <dl className="space-y-1.5 text-xs">
            <Row label="Establecimiento" value={[formData.Dist_EESS, formData.Prov_EESS].filter(Boolean).join(', ') || '—'} />
            <Row label="Sexo / Edad" value={`${formData.Sexo === 'F' ? 'Niña' : 'Niño'} · ${formData.EdadMeses} meses`} />
            <Row label="Hb observada" value={`${formData.Hemoglobina} g/dL`} />
            <Row label="Altitud" value={`${formData.AlturaREN} m.s.n.m.`} />
            <Row label="Modelo ML" value={modelLabel} />
            {report?.preprocessing && (
              <Row label="Hb corregida" value={`${report.preprocessing.hbc} g/dL`} highlight />
            )}
            {report?.prediction && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Diagnóstico</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ background: diagnosisColors[report.prediction.diagnosis_code] || '#0d9488' }}
                >
                  {report.prediction.diagnosis_label}
                </span>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-xs leading-relaxed text-slate-400">
            Registra los datos del paciente o carga el caso de ejemplo para ver aquí el resumen clínico.
          </p>
        )}
      </div>

      {/* Línea de tiempo de agentes */}
      <div className="flex-1 overflow-y-auto">
        <AgentTimeline agents={agents} />
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <p className="text-[10px] leading-relaxed text-slate-400">
          <span className="font-medium text-teal-600">UNA Puno · 2024</span>
          <br />
          Prototipo de investigación
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex-shrink-0 text-slate-500">{label}</dt>
      <dd className={`truncate text-right font-medium ${highlight ? 'text-teal-700' : 'text-slate-700'}`}>{value}</dd>
    </div>
  )
}
