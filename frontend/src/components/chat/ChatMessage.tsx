import { motion } from 'framer-motion'
import { Bot, User, AlertTriangle, Cpu } from 'lucide-react'

import { useTypewriter } from '../../hooks/useTypewriter'
import type { MessageRole } from '../../types'

const roleConfig: Record<MessageRole, { align: string; bg: string; avatar: typeof Bot; avatarBg: string }> = {
  assistant: {
    align: 'justify-start',
    bg: 'bg-white border border-slate-200 rounded-2xl rounded-bl-none',
    avatar: Bot,
    avatarBg: 'bg-teal-600',
  },
  user: {
    align: 'justify-end',
    bg: 'bg-teal-600 text-white rounded-2xl rounded-br-none',
    avatar: User,
    avatarBg: 'bg-teal-500',
  },
  system: {
    align: 'justify-center',
    bg: 'bg-amber-50 border border-amber-200 text-amber-800 rounded-xl',
    avatar: AlertTriangle,
    avatarBg: 'bg-amber-500',
  },
  agent: {
    align: 'justify-start',
    bg: 'bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl rounded-bl-none',
    avatar: Cpu,
    avatarBg: 'bg-slate-500',
  },
}

interface Props {
  role: MessageRole
  content: string | React.ReactNode
  isLast: boolean
}

export default function ChatMessage({ role, content, isLast }: Props) {
  const config = roleConfig[role]
  const Icon = config.avatar
  const isUser = role === 'user'
  const isString = typeof content === 'string'
  const isBot = role === 'assistant' || role === 'agent'

  const { displayed, done } = useTypewriter(
    isBot && isLast && isString ? (content as string) : '',
    isBot && isLast && isString ? 20 : 0
  )

  const displayText = isString
    ? (isBot && isLast ? displayed || content : content)
    : content

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${config.align} gap-2.5 px-4 ${isLast ? '' : 'mb-3'}`}
      role="listitem"
      aria-label={`Mensaje de ${role === 'assistant' ? 'asistente' : role === 'user' ? 'usuario' : role === 'system' ? 'sistema' : 'agente'}`}
    >
      {!isUser && (
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.avatarBg} text-white shadow-sm`} aria-hidden="true">
          <Icon size={15} />
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${config.bg}`}>
        {typeof displayText === 'string' ? (
          <div className="whitespace-pre-wrap">{displayText}</div>
        ) : (
          displayText
        )}
        {!done && isBot && isLast && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-teal-600 animate-pulse align-text-bottom" aria-hidden="true" />
        )}
      </div>
    </motion.div>
  )
}
