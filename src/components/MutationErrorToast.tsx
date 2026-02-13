import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

/**
 * Global toast that displays mutation errors from React Query.
 * Listens for `mutation-error` CustomEvents dispatched by the
 * QueryClient's global `onError` handler in App.tsx.
 */
export function MutationErrorToast() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const message =
        (e as CustomEvent<{ message: string }>).detail?.message ||
        'Something went wrong. Please try again.'
      setError(message)
    }
    window.addEventListener('mutation-error', handler)
    return () => window.removeEventListener('mutation-error', handler)
  }, [])

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(timer)
  }, [error])

  if (!error) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-tegelrod/20 border border-tegelrod/30 backdrop-blur-md shadow-lg max-w-sm">
        <AlertTriangle className="w-4 h-4 text-tegelrod shrink-0" />
        <p className="text-sm text-kalkvit">{error}</p>
        <button
          onClick={() => setError(null)}
          className="text-kalkvit/40 hover:text-kalkvit shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
