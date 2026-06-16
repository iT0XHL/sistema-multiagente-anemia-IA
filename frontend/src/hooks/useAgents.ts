// Hook useAgents — historial de ejecución de agentes (logs).
import { useCallback, useEffect, useState } from 'react'

import { getAgentLogs } from '../services/api'
import type { AgentLogEntry } from '../types'

export function useAgents(autoLoad = true) {
  const [logs, setLogs] = useState<AgentLogEntry[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { logs } = await getAgentLogs()
      setLogs(logs)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoLoad) refresh()
  }, [autoLoad, refresh])

  return { logs, loading, refresh }
}
