import { useMemo } from 'react'
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { GlassModal, GlassButton, GlassModalFooter } from './ui'
import { useSubmissionResponses } from '../lib/api/hooks'

interface CVCAnswersModalProps {
  isOpen: boolean
  onClose: () => void
  /** Submission whose answers to fetch — pulled from CVCAssessmentStatus.submission_id (B8). */
  submissionId: string | null
  /** Top-level biomarker category to filter by: vital_energy | stress_load | sleep_quality. */
  category: string
  /** Display label for the modal title (e.g. "Vital Energy", "Stress Load"). */
  categoryLabel: string
}

/**
 * Per-area answers modal on the CVC report. Opens from a biomarker breakdown
 * card and shows the user's actual question-level answers for that biomarker
 * within the displayed CVC submission. Backend B8 endpoint:
 *   GET /members/programs/assessments/submissions/{id}/responses
 */
export function CVCAnswersModal({
  isOpen,
  onClose,
  submissionId,
  category,
  categoryLabel,
}: CVCAnswersModalProps) {
  const { data, isLoading, isError } = useSubmissionResponses(isOpen ? submissionId : null)

  const filteredResponses = useMemo(() => {
    if (!data?.responses) return []
    return data.responses.filter((r) => r.biomarker_category === category)
  }, [data, category])

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${categoryLabel} – Your self-assessment`}
      size="md"
    >
      <div className="space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <ArrowPathIcon className="w-6 h-6 text-koppar animate-spin" />
          </div>
        )}

        {isError && (
          <div className="p-4 rounded-xl bg-tegelrod/10 border border-tegelrod/20 text-sm text-tegelrod flex items-start gap-2">
            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>Could not load your self-assessment. Try again in a moment.</p>
          </div>
        )}

        {!isLoading && !isError && filteredResponses.length === 0 && (
          <p className="text-sm text-kalkvit/50 text-center py-6">
            No self-assessment recorded for this area.
          </p>
        )}

        {!isLoading && !isError && filteredResponses.length > 0 && (
          <div className="space-y-2">
            {filteredResponses.map((r) => {
              const hasNumeric = r.value !== null && r.value !== undefined
              const hasText = !!r.response_text
              return (
                <div
                  key={r.question_id}
                  className="p-3 rounded-xl bg-white/[0.04] border border-white/10"
                >
                  <p className="text-sm text-kalkvit mb-2">
                    {r.question_text || '(no question text)'}
                  </p>

                  {hasNumeric && (
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-xl font-bold text-koppar">
                        {r.value}
                      </span>
                      {r.max_value != null && (
                        <span className="text-xs text-kalkvit/40">/ {r.max_value}</span>
                      )}
                      {(r.scale_min_label || r.scale_max_label) && (
                        <span className="text-[10px] text-kalkvit/40 ml-2">
                          {r.scale_min_label || ''}
                          {r.scale_min_label && r.scale_max_label ? ' — ' : ''}
                          {r.scale_max_label || ''}
                        </span>
                      )}
                    </div>
                  )}

                  {hasText && (
                    <p className="text-sm text-kalkvit/80 italic mt-1">
                      {r.response_text}
                    </p>
                  )}

                  {!hasNumeric && !hasText && (
                    <p className="text-xs text-kalkvit/40 italic">No response</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <GlassModalFooter>
        <GlassButton variant="ghost" onClick={onClose}>
          Close
        </GlassButton>
      </GlassModalFooter>
    </GlassModal>
  )
}
