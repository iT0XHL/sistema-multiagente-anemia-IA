import { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, FlaskConical, Loader2, MapPin, Send, User, Shield, TestTube, Home } from 'lucide-react'

import type { ClinicalFormData } from '../../types'
import { getAltitud, getDistritos, provincias } from '../../data/puno'

interface Props {
  value: ClinicalFormData
  onChange: (patch: Partial<ClinicalFormData>) => void
  onSubmit: () => void
  onLoadExample: () => void
  loading?: boolean
}

export default function ClinicalFormCard({ value, onChange, onSubmit, onLoadExample, loading }: Props) {
  const [errors, setErrors] = useState<string[]>([])
  const formRef = useRef<HTMLDivElement>(null)

  const distritosEESS = value.Prov_EESS ? getDistritos(value.Prov_EESS) : []
  const distritosREN = value.ProvinciaREN ? getDistritos(value.ProvinciaREN) : []

  const handleProvEESS = useCallback((prov: string) => {
    onChange({ Prov_EESS: prov, Dist_EESS: '' })
  }, [onChange])

  const handleProvREN = useCallback((prov: string) => {
    const alt = getAltitud(prov)
    onChange({ ProvinciaREN: prov, DistritoREN: '', AlturaREN: alt ?? 0 })
  }, [onChange])

  const handleDistREN = useCallback((dist: string) => {
    const alt = getAltitud(dist)
    onChange({ DistritoREN: dist, AlturaREN: alt ?? 0 })
  }, [onChange])

  const toggle = (field: keyof ClinicalFormData) => {
    onChange({ [field]: value[field] === 1 ? 0 : 1 } as any)
  }

  const validate = (): boolean => {
    const errs: string[] = []
    if (!value.Prov_EESS) errs.push('Provincia EESS')
    if (!value.Dist_EESS) errs.push('Distrito EESS')
    if (!value.EdadMeses || value.EdadMeses <= 0) errs.push('Edad en meses')
    if (!value.Hemoglobina || value.Hemoglobina <= 0) errs.push('Hemoglobina')
    if (!value.ProvinciaREN) errs.push('Provincia REN')
    if (!value.DistritoREN) errs.push('Distrito REN')
    if (!value.AlturaREN || value.AlturaREN <= 0) errs.push('Altitud de residencia')
    setErrors(errs)
    if (errs.length > 0) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return errs.length === 0
  }

  const handleSubmit = () => {
    if (validate()) onSubmit()
  }

  const SectionTitle = ({ icon: Icon, text }: { icon: any; text: string }) => (
    <p className="form-section-title mt-3 first:mt-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-1.5 mb-2.5">
      <Icon size={12} className="text-teal-600" />
      {text}
    </p>
  )

  const ToggleRow = ({ field, label }: { field: keyof ClinicalFormData; label: string }) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-700">{label}</span>
      <label className="relative inline-block w-9 h-5 cursor-pointer" aria-label={label}>
        <input
          type="checkbox"
          className="peer sr-only"
          checked={value[field] === 1}
          onChange={() => toggle(field)}
          disabled={loading}
        />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-teal-600" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4" />
      </label>
    </div>
  )

  const SelectField = ({ label, value, options, onChange: onChangeFn, placeholder }: { label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder?: string }) => (
    <div>
      <label className="mb-0.5 block text-[10px] font-medium text-slate-500">{label}</label>
      <select
        className={`input text-xs ${value ? 'text-slate-800' : 'text-slate-400'}`}
        value={value}
        onChange={(e) => onChangeFn(e.target.value)}
        disabled={loading}
      >
        <option value="">{placeholder || 'Seleccionar…'}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )

  const InputField = ({ label, value, onChange: onChangeFn, type = 'text', step, placeholder, suffix }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; step?: string; placeholder?: string; suffix?: string }) => (
    <div>
      <label className="mb-0.5 block text-[10px] font-medium text-slate-500">{label}</label>
      <div className="relative">
        <input
          type={type}
          step={step}
          className="input text-xs pr-6"
          value={value || ''}
          onChange={(e) => onChangeFn(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">{suffix}</span>}
      </div>
    </div>
  )

  return (
    <motion.div
      ref={formRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      role="form"
      aria-label="Formulario de caso clínico"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
        <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
          Agente 1 · Registro Clínico
        </span>
        <span className="text-xs text-slate-400 ml-auto">Nuevo caso</span>
      </div>

      <div className="p-3 space-y-1">
        <SectionTitle icon={MapPin} text="Establecimiento de salud" />
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Provincia EESS" value={value.Prov_EESS} options={provincias} onChange={handleProvEESS} />
          <SelectField
            label="Distrito EESS"
            value={value.Dist_EESS}
            options={distritosEESS}
            onChange={(v) => onChange({ Dist_EESS: v })}
            placeholder={value.Prov_EESS ? 'Seleccionar…' : 'Primero elige provincia'}
          />
        </div>

        <SectionTitle icon={User} text="Datos del niño/a" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Sexo</label>
            <select className="input text-xs" value={value.Sexo} onChange={(e) => onChange({ Sexo: e.target.value as 'F' | 'M' })} disabled={loading}>
              <option value="F">Femenino (F)</option>
              <option value="M">Masculino (M)</option>
            </select>
          </div>
          <InputField label="Edad (meses)" value={value.EdadMeses} onChange={(v) => onChange({ EdadMeses: parseFloat(v) || 0 })} type="number" step="0.01" placeholder="ej. 53.62" />
        </div>

        <SectionTitle icon={Shield} text="Programas y controles sociales" />
        <div className="grid grid-cols-2 gap-x-3">
          <ToggleRow field="Juntos" label="Juntos" />
          <ToggleRow field="SIS" label="SIS" />
          <ToggleRow field="Qaliwarma" label="Qali Warma" />
          <ToggleRow field="Cred" label="Control CRED" />
          <ToggleRow field="Suplementacion" label="Suplementación Fe" />
          <ToggleRow field="Consejeria" label="Consejería" />
          <ToggleRow field="Sesion" label="Sesión demostrativa" />
        </div>

        <SectionTitle icon={TestTube} text="Datos clínicos" />
        <InputField label="Hemoglobina observada (g/dL)" value={value.Hemoglobina} onChange={(v) => onChange({ Hemoglobina: parseFloat(v) || 0 })} type="number" step="0.1" placeholder="ej. 13.7" />

        <SectionTitle icon={Home} text="Residencia del niño (REN)" />
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Provincia REN" value={value.ProvinciaREN} options={provincias} onChange={handleProvREN} />
          <SelectField
            label="Distrito REN"
            value={value.DistritoREN}
            options={distritosREN}
            onChange={handleDistREN}
            placeholder={value.ProvinciaREN ? 'Seleccionar…' : 'Primero elige provincia'}
          />
        </div>
        <InputField label="Altitud residencia (m.s.n.m.)" value={value.AlturaREN} onChange={(v) => onChange({ AlturaREN: parseFloat(v) || 0 })} type="number" step="1" placeholder="Automático" suffix="msnm" />

        <SectionTitle icon={Cpu} text="Modelo de Machine Learning" />
        <div className="grid grid-cols-2 gap-2">
          {(['random_forest', 'xgboost'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ Modelo: m })}
              disabled={loading}
              aria-pressed={value.Modelo === m}
              className={`rounded-xl border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${
                value.Modelo === m
                  ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {m === 'random_forest' ? 'Random Forest' : 'XGBoost'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700" role="alert">
              <strong>Campos obligatorios:</strong> {errors.join(', ')}
            </div>
          )}
          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full text-xs py-2.5">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {loading ? 'Procesando...' : 'Analizar caso con agentes'}
          </button>
          <button onClick={onLoadExample} disabled={loading} className="btn-ghost w-full text-xs py-2">
            <FlaskConical size={12} /> Cargar caso ejemplo (Juliaca)
          </button>
        </div>
      </div>
    </motion.div>
  )
}
