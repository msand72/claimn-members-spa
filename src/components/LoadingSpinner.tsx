import { Loader2 } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary,#1A1A2E)] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-koppar animate-spin" />
    </div>
  )
}
