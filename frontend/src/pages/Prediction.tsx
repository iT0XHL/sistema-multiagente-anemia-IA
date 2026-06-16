import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import { useCaseContext } from '../CaseContext'
import AnimatedCard from '../components/AnimatedCard'
import ErrorMessage from '../components/ErrorMessage'
import ModelSelector from '../components/ModelSelector'
import PredictionForm from '../components/PredictionForm'
import PredictionResultCard from '../components/PredictionResultCard'
import { usePrediction } from '../hooks/usePrediction'
import { exampleCase } from '../mocks/exampleCase'
import { pageTransition } from '../pageTransition'
import type { ClinicalCase } from '../types'

export default function Prediction() {
  const { clinicalCase, setClinicalCase, model, setModel, setReport } = useCaseContext()
  const { report, loading, error, run } = usePrediction()
  const navigate = useNavigate()

  const update = (patch: Partial<ClinicalCase>) =>
    setClinicalCase({ ...clinicalCase, ...patch })

  const onSubmit = async () => {
    const result = await run(clinicalCase, model)
    if (result) setReport(result)
  }

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Evaluación clínica</h2>

      <AnimatedCard>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Modelo predictivo
        </p>
        <ModelSelector value={model} onChange={setModel} />
      </AnimatedCard>

      <PredictionForm
        value={clinicalCase}
        onChange={update}
        onSubmit={onSubmit}
        onLoadExample={() => setClinicalCase(exampleCase)}
        loading={loading}
      />

      {error && <ErrorMessage message={error} />}

      {report?.ok && (
        <>
          <PredictionResultCard report={report} />
          <div className="flex gap-2">
            <button onClick={() => navigate('/explainability')} className="btn-ghost flex-1">
              Ver explicabilidad
            </button>
            <button onClick={() => navigate('/agents')} className="btn-ghost flex-1">
              Ver agentes
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}
