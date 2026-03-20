import { ArrowPathIcon } from '@heroicons/react/24/outline'

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary,#1A1A2E)] flex items-center justify-center">
      <ArrowPathIcon className="w-10 h-10 text-koppar animate-spin" />
    </div>
  )
}
