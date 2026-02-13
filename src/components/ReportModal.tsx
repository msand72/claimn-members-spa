import { useState } from 'react'
import { GlassModal, GlassModalFooter } from './ui/GlassModal'
import { GlassSelect, GlassTextarea } from './ui/GlassInput'
import { GlassButton } from './ui/GlassButton'
import { REPORT_REASONS } from '../lib/constants'
import type { ReportRequest } from '../lib/api/types'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ReportRequest) => void
  isPending: boolean
  title?: string
}

export function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  title = 'Report Content',
}: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')

  const handleSubmit = () => {
    if (!reason) return
    onSubmit({ reason, details: details.trim() || undefined })
  }

  const handleClose = () => {
    setReason('')
    setDetails('')
    onClose()
  }

  return (
    <GlassModal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4">
        <GlassSelect
          label="Reason"
          options={[{ value: '', label: 'Select a reason...' }, ...REPORT_REASONS]}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {reason && (
          <GlassTextarea
            label="Additional details (optional)"
            placeholder="Provide any additional context..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
          />
        )}
      </div>
      <GlassModalFooter>
        <GlassButton variant="ghost" onClick={handleClose} disabled={isPending}>
          Cancel
        </GlassButton>
        <GlassButton variant="primary" onClick={handleSubmit} disabled={!reason || isPending}>
          {isPending ? 'Submitting...' : 'Submit Report'}
        </GlassButton>
      </GlassModalFooter>
    </GlassModal>
  )
}
