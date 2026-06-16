import { FlaskConical, Loader2, Send } from 'lucide-react'

import type { ClinicalCase } from '../types'
import AnimatedCard from './AnimatedCard'

const TOGGLES: { key: keyof ClinicalCase; label: string }[] = [
  { key: 'Juntos', label: 'Juntos' },
  { key: 'SIS', label: 'SIS' },
  { key: 'Qaliwarma', label: 'Qali Warma' },
  { key: 'Cred', label: 'Control CRED' },
  { key: 'Suplementacion', label: 'Suplementación Fe' },
  { key: 'Consejeria', label: 'Consejería' },
  { key: 'Sesion', label: 'Sesión demostrativa' },
]

interface Props {
  value: ClinicalCase
  onChange: (patch: Partial<ClinicalCase>) => void
  onSubmit: () => void
  onLoadExample: () => void
  loading?: boolean
}

// Formulario de ingreso de datos clínicos.
export default function PredictionForm({ value, onChange, onSubmit, onLoadExample, loading }: Props) {
  return (
    <AnimatedCard delay={0.05}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Datos del paciente
        </p>
        <button
          onClick={onLoadExample}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600"
        >
          <FlaskConical size={14} /> Caso ejemplo (Juliaca)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Sexo">
          <select
            className="input"
            value={value.Sexo}
            onChange={(e) => onChange({ Sexo: e.target.value as 'F' | 'M' })}
          >
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
          </select>
        </Field>
        <Field label="Edad (meses)">
          <input
            type="number"
            step="0.01"
            className="input"
            value={value.EdadMeses || ''}
            onChange={(e) => onChange({ EdadMeses: parseFloat(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Hemoglobina (g/dL)">
          <input
            type="number"
            step="0.1"
            className="input"
            value={value.Hemoglobina || ''}
            onChange={(e) => onChange({ Hemoglobina: parseFloat(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Altitud (m.s.n.m.)">
          <input
            type="number"
            className="input"
            value={value.AlturaREN || ''}
            onChange={(e) => onChange({ AlturaREN: parseFloat(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Provincia REN">
          <input
            className="input"
            value={value.ProvinciaREN || ''}
            onChange={(e) => onChange({ ProvinciaREN: e.target.value })}
          />
        </Field>
        <Field label="Distrito REN">
          <input
            className="input"
            value={value.DistritoREN || ''}
            onChange={(e) => onChange({ DistritoREN: e.target.value })}
          />
        </Field>
      </div>

      <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Programas y controles
      </p>
      <div className="grid grid-cols-2 gap-x-4">
        {TOGGLES.map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-slate-600">{label}</span>
            <input
              type="checkbox"
              className="h-4 w-8 accent-brand-600"
              checked={Boolean(value[key])}
              onChange={(e) =>
                onChange({ [key]: e.target.checked ? 1 : 0 } as Partial<ClinicalCase>)
              }
            />
          </label>
        ))}
      </div>

      <button onClick={onSubmit} disabled={loading} className="btn-primary mt-4 w-full">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {loading ? 'Procesando pipeline…' : 'Enviar caso al sistema'}
      </button>
    </AnimatedCard>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      {children}
    </div>
  )
}
