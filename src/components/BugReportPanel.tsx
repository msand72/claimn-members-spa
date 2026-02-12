import { useState } from 'react'
import { Camera, ChevronDown, ChevronRight, Trash2, Loader2 } from 'lucide-react'
import { useBugReport } from '../contexts/BugReportContext'
import { GlassModal, GlassModalFooter } from './ui/GlassModal'
import { GlassButton } from './ui/GlassButton'
import { cn } from '../lib/utils'

export function BugReportPanel() {
  const {
    isModalOpen,
    isManualReport,
    pendingError,
    screenshot,
    isSubmitting,
    closeModal,
    captureScreenshot,
    setScreenshot,
    submitReport,
  } = useBugReport()

  const [description, setDescription] = useState('')
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  const descriptionRequired = isManualReport
  const isValid = !descriptionRequired || description.trim().length >= 10

  const handleSubmit = async () => {
    if (!isValid) return
    await submitReport(description || null, screenshot !== null)
    setDescription('')
    setShowErrorDetails(false)
  }

  const handleClose = () => {
    setDescription('')
    setShowErrorDetails(false)
    closeModal()
  }

  const handleCaptureScreenshot = async () => {
    setIsCapturing(true)
    await captureScreenshot()
    setIsCapturing(false)
  }

  return (
    <GlassModal
      isOpen={isModalOpen}
      onClose={handleClose}
      title="Report a Bug"
      description={
        isManualReport
          ? 'Describe the issue you encountered.'
          : 'Help us fix this issue.'
      }
      size="lg"
    >
      <div className="space-y-4">
        {/* Screenshot section */}
        {isManualReport && !screenshot ? (
          <div>
            <GlassButton
              variant="secondary"
              icon={isCapturing ? Loader2 : Camera}
              onClick={handleCaptureScreenshot}
              disabled={isCapturing}
              className={cn(isCapturing && '[&_svg]:animate-spin')}
            >
              {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
            </GlassButton>
          </div>
        ) : screenshot ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-kalkvit/60 font-medium">
                Screenshot captured
              </span>
              <button
                onClick={() => setScreenshot(null)}
                className="flex items-center gap-1 text-xs text-tegelrod/70 hover:text-tegelrod transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            </div>
            <div className="rounded-lg border border-white/10 overflow-hidden bg-black/20">
              <img
                src={screenshot}
                alt="Error screenshot"
                className="w-full max-h-48 object-contain"
              />
            </div>
          </div>
        ) : null}

        {/* Description */}
        <div>
          <label
            htmlFor="bug-description"
            className="block text-sm font-medium text-kalkvit/80 mb-1.5"
          >
            {isManualReport ? 'What went wrong?' : 'What were you trying to do?'}
            {descriptionRequired && (
              <span className="text-tegelrod ml-1">*</span>
            )}
          </label>
          <textarea
            id="bug-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              isManualReport
                ? 'Describe the bug or unexpected behavior...'
                : 'Optional: describe what you were doing when the error occurred...'
            }
            rows={3}
            className={cn(
              'w-full rounded-xl px-4 py-3 text-sm text-kalkvit',
              'bg-white/[0.06] border border-white/[0.12]',
              'placeholder:text-kalkvit/30',
              'focus:outline-none focus:border-koppar/50 focus:ring-1 focus:ring-koppar/30',
              'resize-none transition-colors'
            )}
          />
          {descriptionRequired && description.length > 0 && description.length < 10 && (
            <p className="text-xs text-tegelrod/70 mt-1">
              Minimum 10 characters required
            </p>
          )}
        </div>

        {/* Error details (auto mode only) */}
        {!isManualReport && pendingError && (
          <div>
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="flex items-center gap-1.5 text-xs text-kalkvit/50 hover:text-kalkvit/70 transition-colors"
            >
              {showErrorDetails ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              Error details
            </button>
            {showErrorDetails && (
              <div className="mt-2 rounded-lg bg-black/30 border border-white/5 p-3 overflow-auto max-h-40">
                <p className="text-xs font-mono text-tegelrod/80 break-all">
                  {pendingError.error.message}
                </p>
                {pendingError.error.stack && (
                  <pre className="text-[11px] font-mono text-kalkvit/40 mt-2 whitespace-pre-wrap break-all">
                    {pendingError.error.stack
                      .split('\n')
                      .slice(1, 6)
                      .join('\n')}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <GlassModalFooter>
        <GlassButton variant="ghost" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </GlassButton>
        <GlassButton
          variant="primary"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </span>
          ) : (
            'Send Report'
          )}
        </GlassButton>
      </GlassModalFooter>
    </GlassModal>
  )
}
