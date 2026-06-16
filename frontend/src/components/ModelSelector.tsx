import { TreePine, Zap } from 'lucide-react'

import type { ModelName } from '../types'

interface Props {
  value: ModelName
  onChange: (m: ModelName) => void
}

const options: { id: ModelName; label: string; icon: typeof Zap; desc: string }[] = [
  { id: 'random_forest', label: 'Random Forest', icon: TreePine, desc: 'Ensamble de árboles' },
  { id: 'xgboost', label: 'XGBoost', icon: Zap, desc: 'Gradient boosting' },
]

// Selector del modelo de ML a usar en la inferencia.
export default function ModelSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(({ id, label, icon: Icon, desc }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
              active
                ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <Icon size={18} className={active ? 'text-brand-600' : 'text-slate-400'} />
            <span className="mt-1 text-sm font-semibold text-slate-700">{label}</span>
            <span className="text-[11px] text-slate-400">{desc}</span>
          </button>
        )
      })}
    </div>
  )
}
