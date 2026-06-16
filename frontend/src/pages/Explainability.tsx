import { motion } from 'framer-motion'
import { Info, Loader2, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

import { useCaseContext } from '../CaseContext'
import AnimatedCard from '../components/AnimatedCard'
import ErrorMessage from '../components/ErrorMessage'
import LimePanel from '../components/LimePanel'
import ShapChart from '../components/ShapChart'
import { useExplainability } from '../hooks/useExplainability'
import { pageTransition } from '../pageTransition'

export default function Explainability() {
  const { clinicalCase, model, report } = useCaseContext()
  const { shap, lime, loading, error, compute, seed } = useExplainability()

  // Si venimos de una predicción, reutiliza la explicabilidad ya calculada.
  useEffect(() => {
    if (report?.explainability) {
      seed(report.explainability.shap, report.explainability.lime)
    }
  }, [report, seed])

  const hasData = shap?.global?.length || shap?.local?.factors?.length || lime?.factors?.length

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Explicabilidad (XAI)</h2>
        <button
          onClick={() => compute(clinicalCase, model)}
          disabled={loading}
          className="btn-ghost text-xs"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Calcular
        </button>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
        <Info size={16} className="mt-0.5 flex-shrink-0" />
        SHAP cuantifica la contribución de cada variable al diagnóstico; LIME aproxima
        localmente la decisión del modelo para este caso individual.
      </p>

      {error && <ErrorMessage message={error} />}

      {!hasData && !loading && (
        <AnimatedCard>
          <p className="text-center text-sm text-slate-400">
            Ejecuta una predicción o pulsa <strong>Calcular</strong> para generar las
            explicaciones del caso actual.
          </p>
        </AnimatedCard>
      )}

      {shap?.global?.length ? (
        <AnimatedCard>
          <ShapChart factors={shap.global} title="SHAP · Importancia global" color="#1d4ed8" />
        </AnimatedCard>
      ) : null}
      {shap?.local?.factors?.length ? (
        <AnimatedCard delay={0.05}>
          <ShapChart
            factors={shap.local.factors}
            title={`SHAP · Importancia local (${shap.local.method})`}
            color="#0d9488"
          />
        </AnimatedCard>
      ) : null}
      {lime?.factors?.length ? (
        <AnimatedCard delay={0.1}>
          <LimePanel lime={lime} />
        </AnimatedCard>
      ) : null}
    </motion.div>
  )
}
