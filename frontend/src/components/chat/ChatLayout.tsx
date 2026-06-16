import type { ReactNode } from 'react'

import AcademicWarning from './AcademicWarning'
import ChatHeader from './ChatHeader'

interface Props {
  children: ReactNode
  sidebar?: ReactNode
}

export default function ChatLayout({ children, sidebar }: Props) {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <ChatHeader />
      <AcademicWarning />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col min-h-0">
          {children}
        </div>
        {sidebar && (
          <aside className="hidden w-48 flex-shrink-0 border-l border-slate-200 bg-white/50 backdrop-blur lg:block overflow-y-auto">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
