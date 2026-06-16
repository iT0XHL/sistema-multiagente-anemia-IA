import { Lightbulb } from 'lucide-react'

import type { ExplanationResult } from '../types'
import ShapChart from './ShapChart'

interface Props {
  lime: ExplanationResult | null
}

// Panel de explicación local LIME.
export default function LimePanel({ lime }: Props) {
  if (!lime?.factors?.length) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        Aún no hay explicación LIME para este caso.
      </p>
    )
  }
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb size={16} className="text-violet-600" />
        <span className="text-sm font-semibold text-slate-700">
          LIME · Explicación local ({lime.method})
        </span>
      </div>
      <ShapChart factors={lime.factors} color="#7c3aed" />
      <p className="mt-2 text-[11px] italic text-slate-400">
        LIME aproxima localmente la decisión del modelo perturbando el caso individual.
      </p>
    </div>
  )
}
