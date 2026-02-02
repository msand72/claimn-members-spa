import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { SmartPrompt } from '../../lib/api/hooks/useJourney'
import { X, ArrowRight, Bell, AlertTriangle, Info } from 'lucide-react'

interface SmartPromptsProps {
  prompts: SmartPrompt[]
}

const DISMISSED_KEY = 'dismissed_prompts'
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

function getDismissedPrompts(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}')
  } catch {
    return {}
  }
}

function dismissPrompt(type: string) {
  const dismissed = getDismissedPrompts()
  dismissed[type] = Date.now()
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed))
}

function isPromptDismissed(type: string): boolean {
  const dismissed = getDismissedPrompts()
  const dismissedAt = dismissed[type]
  if (!dismissedAt) return false
  return Date.now() - dismissedAt < DISMISS_DURATION_MS
}

const PRIORITY_STYLES = {
  high: {
    bg: 'bg-koppar/10 border-koppar/30',
    icon: AlertTriangle,
    iconColor: 'text-koppar',
  },
  medium: {
    bg: 'bg-white/[0.04] border-white/[0.12]',
    icon: Bell,
    iconColor: 'text-kalkvit/60',
  },
  low: {
    bg: 'bg-white/[0.02] border-white/[0.08]',
    icon: Info,
    iconColor: 'text-kalkvit/40',
  },
}

export function SmartPrompts({ prompts }: SmartPromptsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    const set = new Set<string>()
    prompts.forEach(p => {
      if (isPromptDismissed(p.type)) set.add(p.type)
    })
    return set
  })

  const handleDismiss = useCallback((type: string) => {
    dismissPrompt(type)
    setDismissed(prev => new Set(prev).add(type))
  }, [])

  const visiblePrompts = prompts.filter(p => !dismissed.has(p.type))

  if (visiblePrompts.length === 0) return null

  return (
    <div className="space-y-2">
      {visiblePrompts.map((prompt) => {
        const priority = (prompt as SmartPrompt & { priority?: keyof typeof PRIORITY_STYLES }).priority
        const style = (priority && PRIORITY_STYLES[priority]) || PRIORITY_STYLES.medium
        const Icon = style.icon
        return (
          <div
            key={prompt.type}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${style.bg} transition-all`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${style.iconColor}`} />
            <span className="text-kalkvit/80 text-sm flex-1">{prompt.message}</span>
            <Link
              to={prompt.action_url}
              className="text-koppar text-sm font-medium hover:underline flex items-center gap-1 shrink-0"
            >
              Go <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => handleDismiss(prompt.type)}
              className="p-1 rounded-lg hover:bg-white/[0.05] text-kalkvit/30 hover:text-kalkvit/60 transition-colors shrink-0"
              title="Dismiss for 24 hours"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
