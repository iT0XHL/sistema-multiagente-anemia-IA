import { motion } from 'framer-motion'
import { Loader2, Play } from 'lucide-react'

import { useCaseContext } from '../CaseContext'
import AgentFlow from '../components/AgentFlow'
import AnimatedCard from '../components/AnimatedCard'
import DashboardCard from '../components/DashboardCard'
import ErrorMessage from '../components/ErrorMessage'
import { usePrediction } from '../hooks/usePrediction'
import { pageTransition } from '../pageTransition'

export default function Agents() {
  const { clinicalCase, model, report, setReport } = useCaseContext()
  const { loading, error, run } = usePrediction()

  const rerun = async () => {
    const result = await run(clinicalCase, model)
    if (result) setReport(result)
  }

  const mon = report?.monitoring

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Sistema multiagente</h2>
        <button onClick={rerun} disabled={loading} className="btn-ghost text-xs">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Ejecutar
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {mon && (
        <div className="grid grid-cols-3 gap-2">
          <DashboardCard title="Agentes" value={mon.agents_run} />
          <DashboardCard title="Tiempo total" value={`${mon.total_elapsed_ms} ms`} />
          <DashboardCard title="Errores" value={mon.errors} />
        </div>
      )}

      <AnimatedCard>
        <AgentFlow logs={report?.agent_logs} active={loading} />
      </AnimatedCard>

      {report?.run_id && (
        <p className="text-center text-[11px] text-slate-400">
          run_id: {report.run_id} · {report.ok ? 'pipeline completado' : 'finalizó con errores'}
        </p>
      )}
    </motion.div>
  )
}
