import { Bug } from 'lucide-react'
import { useBugReport } from '../contexts/BugReportContext'

export function ReportBugButton() {
  const { openManualReport, pendingError } = useBugReport()

  // Hide during active error boundary fallback to avoid confusion
  if (pendingError) return null

  return (
    <button
      onClick={openManualReport}
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-white/[0.08] backdrop-blur-[16px] border border-white/[0.12] text-kalkvit/60 hover:text-kalkvit hover:bg-white/[0.12] hover:border-white/[0.2] transition-all duration-200 shadow-lg"
      aria-label="Report a bug"
    >
      <Bug className="w-4 h-4" />
      Report a Bug
    </button>
  )
}
