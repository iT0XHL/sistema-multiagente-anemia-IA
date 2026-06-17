import type { ReactNode } from 'react'

import AcademicWarning from './AcademicWarning'
import ChatHeader from './ChatHeader'

interface Props {
  children: ReactNode
  /** Panel de resultados fijo en escritorio (≥ lg). */
  panel?: ReactNode
  title?: string
  onOpenHistory?: () => void
  onOpenResults?: () => void
  showResultsButton?: boolean
  agentsDone?: number
  agentsTotal?: number
  running?: boolean
}

export default function ChatLayout({
  children,
  panel,
  title,
  onOpenHistory,
  onOpenResults,
  showResultsButton,
  agentsDone,
  agentsTotal,
  running,
}: Props) {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <ChatHeader
        title={title}
        onOpenHistory={onOpenHistory}
        onOpenResults={onOpenResults}
        showResultsButton={showResultsButton}
        agentsDone={agentsDone}
        agentsTotal={agentsTotal}
        running={running}
      />
      <AcademicWarning />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        {panel && (
          <aside className="hidden w-80 flex-shrink-0 border-l border-slate-200 bg-white lg:flex lg:flex-col xl:w-96">
            {panel}
          </aside>
        )}
      </div>
    </div>
  )
}
