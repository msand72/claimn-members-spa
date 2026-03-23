import { SparklesIcon } from '@heroicons/react/24/outline'

const QUICK_PROMPTS = [
  'How am I doing?',
  'Suggest a protocol',
  'Review my week',
  'Help me with a goal',
]

interface ChatQuickChipsProps {
  onSelect: (text: string) => void
  disabled?: boolean
}

export function ChatQuickChips({ onSelect, disabled }: ChatQuickChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
      {QUICK_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-koppar/10 border border-koppar/20 text-sm text-koppar hover:bg-koppar/20 transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          {prompt}
        </button>
      ))}
    </div>
  )
}
