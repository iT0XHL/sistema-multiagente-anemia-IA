import type { AgentLogEntry } from './agent'

export interface ModelStatus {
  name: string
  trained: boolean
  metrics?: {
    accuracy: number
    f1_macro: number
    f1_weighted: number
  }
  trained_at?: string
}

export interface DashboardData {
  total_predictions: number
  by_diagnosis: Record<string, number>
  by_model: Record<string, number>
  recent_logs: AgentLogEntry[]
  database: string
}
