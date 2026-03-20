import { Link } from 'react-router-dom'
import { GlassCard, GlassButton, GlassBadge } from '../../components/ui'
import { ClipboardDocumentCheckIcon, CheckCircleIcon, MinusIcon, ArrowPathIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'
import type { ProgramAssessment, ProgramAssessmentResult, CVCAssessmentStatus } from '../../lib/api/types'

interface AssessmentsTabProps {
  programId: string
  assessments: ProgramAssessment[]
  assessmentResults: ProgramAssessmentResult[]
  cvcAssessments: CVCAssessmentStatus[]
  completedAssessments: number
  isLoading: boolean
}

export function AssessmentsTab({
  programId,
  assessments,
  assessmentResults,
  cvcAssessments,
  completedAssessments,
  isLoading,
}: AssessmentsTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
      </div>
    )
  }

  if (assessments.length > 0) {
    return (
      <div className="space-y-4">
        {/* Progress summary */}
        <GlassCard variant="base">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-kalkvit flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-koppar" />
              Assessment Progress
            </h3>
            <span className="text-sm text-kalkvit/50">
              {completedAssessments} of {assessments.length} completed
            </span>
          </div>
          <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                completedAssessments === assessments.length
                  ? 'bg-skogsgron'
                  : 'bg-gradient-to-r from-koppar to-brand-amber'
              )}
              style={{
                width: `${assessments.length > 0 ? Math.round((completedAssessments / assessments.length) * 100) : 0}%`,
              }}
            />
          </div>
        </GlassCard>

        {/* Assessment cards */}
        {assessments.map((assessment) => {
          const result = assessmentResults.find(
            (r) => r.assessment_id === assessment.id
          )
          const cvcData = cvcAssessments.find(
            (c: CVCAssessmentStatus) => c.assessment_id === assessment.id
          )
          const typeLabels: Record<string, string> = {
            baseline: 'Baseline',
            midline: 'Midline',
            final: 'Final',
            custom: 'Custom',
          }
          const categoryLabels: Record<string, string> = {
            vital_energy: 'Vital Energy',
            stress_load: 'Stress Load',
            sleep_quality: 'Sleep Quality',
          }
          // Max scale per biomarker for progress bar width
          const categoryMaxScales: Record<string, number> = {
            vital_energy: 7,   // SVS avg 1-7
            stress_load: 40,   // PSS sum 0-40
            sleep_quality: 15, // PSQI composite 0-15
          }
          const lowerIsBetter: Record<string, boolean> = {
            stress_load: true,
            sleep_quality: true,
          }

          return (
            <GlassCard key={assessment.id} variant="base" className="group">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                    assessment.is_completed
                      ? 'bg-skogsgron/20 text-skogsgron'
                      : 'bg-koppar/20 text-koppar'
                  )}
                >
                  {assessment.is_completed ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <MinusIcon className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-kalkvit">
                      {assessment.name}
                    </h4>
                    <GlassBadge
                      variant={assessment.is_completed ? 'success' : 'koppar'}
                    >
                      {typeLabels[assessment.type] || assessment.type}
                    </GlassBadge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-kalkvit/50 mb-3">
                    <span>{assessment.question_count} questions</span>
                    {assessment.is_required && (
                      <span className="text-koppar">Required</span>
                    )}
                    {cvcData?.scores ? (
                      <span className="text-koppar font-medium">
                        {Math.round(cvcData.scores.percentage_score)}% vitality
                      </span>
                    ) : result && result.score !== null ? (
                      <span className="text-skogsgron">
                        Score: {result.score}
                        {result.max_score ? `/${result.max_score}` : ''}
                      </span>
                    ) : null}
                    {assessment.is_completed && assessment.completed_at && (
                      <span>
                        Completed{' '}
                        {new Date(assessment.completed_at).toLocaleDateString(
                          'en-US',
                          { month: 'short', day: 'numeric' }
                        )}
                      </span>
                    )}
                  </div>

                  {/* CVC Category Breakdown */}
                  {cvcData?.scores?.category_scores && (
                    <div className="mb-3 space-y-1.5">
                      {Object.entries(cvcData.scores.category_scores).map(([key, raw]) => {
                        const value = Number(raw) || 0
                        const maxScale = categoryMaxScales[key] || 7
                        const isInverse = lowerIsBetter[key]
                        // For "lower is better", invert the bar: full bar = 0, empty = maxScale
                        const barPercent = isInverse
                          ? Math.min(((maxScale - value) / maxScale) * 100, 100)
                          : Math.min((value / maxScale) * 100, 100)
                        return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] text-kalkvit/50 w-20 shrink-0">
                            {categoryLabels[key] || key}
                          </span>
                          <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                isInverse
                                  ? 'bg-gradient-to-r from-skogsgron to-oliv'
                                  : 'bg-gradient-to-r from-koppar to-brandAmber'
                              )}
                              style={{ width: `${barPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-kalkvit/40 w-8 text-right">
                            {value.toFixed(1)}
                          </span>
                        </div>
                        )
                      })}
                    </div>
                  )}

                  {!assessment.is_completed ? (
                    <Link to={`/programs/${programId}/assessment/${assessment.id}`}>
                      <GlassButton variant="primary" className="text-sm">
                        Take Assessment
                        <ArrowRightIcon className="w-4 h-4" />
                      </GlassButton>
                    </Link>
                  ) : (
                    <GlassBadge variant="success">
                      <CheckCircleIcon className="w-3 h-3" />
                      Completed
                    </GlassBadge>
                  )}
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>
    )
  }

  return (
    <GlassCard variant="base" className="text-center py-12">
      <ClipboardDocumentCheckIcon className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
      <p className="text-kalkvit/50 text-sm">
        No assessments available for this program yet.
      </p>
    </GlassCard>
  )
}
