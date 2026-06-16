import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Clock, Database, RefreshCw } from 'lucide-react'

import { getAgentLogs } from '../services/api'
import { pageTransition } from '../pageTransition'
import { useEffect, useState } from 'react'
import type { AgentLogEntry } from '../types'

export default function History() {
  const [logs, setLogs] = useState<AgentLogEntry[]>([])
  const [dbStatus, setDbStatus] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAgentLogs()
      setLogs(data.logs || [])
      setDbStatus(data.database || 'unknown')
    } catch {
      setError('No se pudo conectar con el backend. Verifica que el servidor esté ejecutándose.')
      setLogs([])
      setDbStatus('unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Historial de consultas</h2>
            <p className="text-sm text-slate-500 mt-1">
              Registro de casos clínicos procesados por el sistema multiagente.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn-ghost text-xs"
            aria-label="Actualizar historial"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Database size={14} className={dbStatus === 'connected' ? 'text-emerald-600' : 'text-slate-400'} />
          <span className={`text-xs ${dbStatus === 'connected' ? 'text-emerald-700' : 'text-slate-500'}`}>
            {dbStatus === 'connected' ? 'PostgreSQL conectado' : dbStatus === 'unavailable' ? 'Base de datos no disponible' : 'Verificando...'}
          </span>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
            {error}
          </div>
        )}

        {loading && !error && (
          <div className="mt-8 flex flex-col items-center gap-2 text-slate-400">
            <Clock size={24} className="animate-pulse" />
            <p className="text-sm">Cargando historial...</p>
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-center">
            <Clock size={32} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">Sin registros aún</p>
            <p className="mt-1 text-xs text-slate-400">
              Los casos procesados aparecerán aquí una vez que el sistema multiagente complete análisis.
            </p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-4 space-y-2">
            {logs.map((log, i) => (
              <div
                key={`${log.run_id ?? ''}_${log.agent}_${i}`}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {log.status === 'ok' ? (
                      <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle size={14} className="flex-shrink-0 text-red-500" />
                    )}
                    <span className="text-sm font-medium text-slate-700 truncate">{log.agent}</span>
                  </div>
                  <span className="flex-shrink-0 text-[10px] text-slate-400">{log.elapsed_ms} ms</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 truncate">{log.message}</p>
                {log.created_at && (
                  <p className="mt-1 text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString('es-PE')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
