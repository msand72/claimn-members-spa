import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import {
  GlassCard,
  GlassButton,
  GlassBadge,
} from '../components/ui'
import {
  useProgramAssessment,
  useSubmitProgramAssessment,
} from '../lib/api/hooks'
import type {
  ProgramAssessmentQuestion,
  ProgramAssessmentResult,
} from '../lib/api/types'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ClipboardCheck,
  Trophy,
  Circle,
} from 'lucide-react'
import { cn } from '../lib/utils'

function ScaleQuestion({
  question,
  value,
  onChange,
}: {
  question: ProgramAssessmentQuestion
  value: number | undefined
  onChange: (val: number) => void
}) {
  const min = question.scale_min ?? 1
  const max = question.scale_max ?? 10
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-kalkvit/40 mb-2">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {points.map((point) => (
          <button
            key={point}
            type="button"
            onClick={() => onChange(point)}
            className={cn(
              'w-10 h-10 rounded-xl text-sm font-medium transition-all',
              value === point
                ? 'bg-koppar text-white shadow-lg shadow-koppar/20'
                : 'bg-white/[0.06] text-kalkvit/60 hover:bg-white/[0.1] hover:text-kalkvit'
            )}
          >
            {point}
          </button>
        ))}
      </div>
    </div>
  )
}

function MultipleChoiceQuestion({
  question,
  value,
  onChange,
}: {
  question: ProgramAssessmentQuestion
  value: string | undefined
  onChange: (val: string) => void
}) {
  const options = question.options ?? []

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const optionValue = option.value
        const isSelected = value === optionValue
        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={cn(
              'w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3',
              isSelected
                ? 'bg-koppar/10 border-koppar/30 text-kalkvit'
                : 'bg-white/[0.04] border-white/[0.08] text-kalkvit/70 hover:bg-white/[0.06] hover:border-white/[0.12]'
            )}
          >
            <div className="flex-shrink-0">
              {isSelected ? (
                <CheckCircle className="w-5 h-5 text-koppar" />
              ) : (
                <Circle className="w-5 h-5 text-kalkvit/30" />
              )}
            </div>
            <span className="text-sm">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function TextQuestion({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (val: string) => void
}) {
  return (
    <textarea
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-sm text-kalkvit placeholder:text-kalkvit/30 focus:outline-none focus:border-koppar/40 resize-none min-h-[120px]"
      placeholder="Type your answer..."
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function BooleanQuestion({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (val: string) => void
}) {
  return (
    <div className="flex gap-3">
      {[
        { val: 'true', label: 'Yes' },
        { val: 'false', label: 'No' },
      ].map((opt) => (
        <button
          key={opt.val}
          type="button"
          onClick={() => onChange(opt.val)}
          className={cn(
            'flex-1 py-3 rounded-xl text-sm font-medium transition-all border',
            value === opt.val
              ? 'bg-koppar/10 border-koppar/30 text-kalkvit'
              : 'bg-white/[0.04] border-white/[0.08] text-kalkvit/60 hover:bg-white/[0.06]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function QuestionCard({
  question,
  index,
  total,
  value,
  onChange,
}: {
  question: ProgramAssessmentQuestion
  index: number
  total: number
  value: string | number | undefined
  onChange: (val: string | number) => void
}) {
  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-kalkvit/40">
          Question {index + 1} of {total}
        </span>
        {question.category && (
          <GlassBadge variant="default">{question.category}</GlassBadge>
        )}
      </div>
      <h3 className="font-medium text-kalkvit mb-4">{question.text}</h3>

      {question.question_type === 'scale' && (
        <ScaleQuestion
          question={question}
          value={typeof value === 'number' ? value : undefined}
          onChange={onChange}
        />
      )}
      {question.question_type === 'multiple_choice' && (
        <MultipleChoiceQuestion
          question={question}
          value={typeof value === 'string' ? value : undefined}
          onChange={(val) => onChange(val)}
        />
      )}
      {question.question_type === 'text' && (
        <TextQuestion
          value={typeof value === 'string' ? value : undefined}
          onChange={(val) => onChange(val)}
        />
      )}
      {question.question_type === 'boolean' && (
        <BooleanQuestion
          value={typeof value === 'string' ? value : undefined}
          onChange={(val) => onChange(val)}
        />
      )}
    </GlassCard>
  )
}

function ResultsView({
  result,
  programId,
}: {
  result: ProgramAssessmentResult
  programId: string
}) {
  const scorePercent =
    result.max_score && result.max_score > 0
      ? Math.round((result.score ?? 0) / result.max_score * 100)
      : null

  return (
    <div className="space-y-6">
      <GlassCard variant="elevated" className="text-center">
        <Trophy className="w-12 h-12 text-koppar mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-kalkvit mb-2">
          Assessment Complete
        </h2>
        <p className="text-kalkvit/60 mb-6">
          Your responses have been recorded.
        </p>

        {result.score !== null && (
          <div className="inline-flex flex-col items-center p-6 rounded-2xl bg-white/[0.06] mb-6">
            <span className="font-display text-4xl font-bold text-koppar">
              {result.score}
              {result.max_score && (
                <span className="text-xl text-kalkvit/40">/{result.max_score}</span>
              )}
            </span>
            {scorePercent !== null && (
              <span className="text-sm text-kalkvit/50 mt-1">{scorePercent}%</span>
            )}
            {result.passed !== null && (
              <GlassBadge
                variant={result.passed ? 'success' : 'error'}
                className="mt-2"
              >
                {result.passed ? 'Passed' : 'Below passing score'}
              </GlassBadge>
            )}
          </div>
        )}

        <Link to={`/programs/${programId}`}>
          <GlassButton variant="primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Program
          </GlassButton>
        </Link>
      </GlassCard>
    </div>
  )
}

export function ProgramAssessmentPage() {
  const { id: programId, assessmentId } = useParams<{
    id: string
    assessmentId: string
  }>()
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [submittedResult, setSubmittedResult] =
    useState<ProgramAssessmentResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    data: assessment,
    isLoading,
    error,
  } = useProgramAssessment(assessmentId || '')
  const submitMutation = useSubmitProgramAssessment()

  const questions = useMemo(
    () =>
      (assessment?.questions ?? []).slice().sort(
        (a, b) => a.sequence_order - b.sequence_order
      ),
    [assessment]
  )

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length
  const allAnswered = answeredCount === questions.length && questions.length > 0
  const progressPercent =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0

  const handleAnswer = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    if (!assessmentId || !programId || !allAnswered) return
    setIsSubmitting(true)
    try {
      const result = await submitMutation.mutateAsync({
        assessmentId,
        programId,
        data: { answers },
      })
      setSubmittedResult(result)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-koppar animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (error || !assessment) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto">
          <Link
            to={programId ? `/programs/${programId}` : '/programs'}
            className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Program
          </Link>
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Assessment not found</h3>
            <p className="text-kalkvit/50 text-sm">
              This assessment may not be available yet or the link is incorrect.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  // If already completed, show a message and redirect back
  if (assessment.is_completed && !submittedResult) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto">
          <Link
            to={`/programs/${programId}`}
            className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Program
          </Link>
          <GlassCard variant="base" className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-skogsgron mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Already Completed</h3>
            <p className="text-kalkvit/50 text-sm mb-6">
              You've already completed this assessment on{' '}
              {assessment.completed_at
                ? new Date(assessment.completed_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'a previous date'}
              .
            </p>
            <Link to={`/programs/${programId}`}>
              <GlassButton variant="secondary">
                <ArrowLeft className="w-4 h-4" />
                Back to Program
              </GlassButton>
            </Link>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  // Show results after submission
  if (submittedResult) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto">
          <ResultsView result={submittedResult} programId={programId || ''} />
        </div>
      </MainLayout>
    )
  }

  const typeLabels: Record<string, string> = {
    baseline: 'Baseline Assessment',
    midline: 'Midline Assessment',
    final: 'Final Assessment',
    custom: 'Assessment',
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          to={`/programs/${programId}`}
          className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Program
        </Link>

        {/* Assessment Header */}
        <GlassCard variant="elevated" className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="w-5 h-5 text-koppar" />
            <GlassBadge variant="koppar">
              {typeLabels[assessment.type] || 'Assessment'}
            </GlassBadge>
            {assessment.is_required && (
              <GlassBadge variant="warning">Required</GlassBadge>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
            {assessment.name}
          </h1>
          <p className="text-kalkvit/60 mb-4">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
            {assessment.passing_score !== null &&
              ` \u00b7 Passing score: ${assessment.passing_score}${
                assessment.total_possible_score
                  ? `/${assessment.total_possible_score}`
                  : ''
              }`}
          </p>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-kalkvit/50">
                {answeredCount} of {questions.length} answered
              </span>
              <span className="text-koppar font-semibold">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  allAnswered
                    ? 'bg-skogsgron'
                    : 'bg-gradient-to-r from-koppar to-brand-amber'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Questions */}
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            total={questions.length}
            value={answers[question.id]}
            onChange={(val) => handleAnswer(question.id, val)}
          />
        ))}

        {/* Submit */}
        {questions.length > 0 && (
          <div className="flex justify-end mt-6 mb-8">
            <GlassButton
              variant="primary"
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Assessment
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </GlassButton>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ProgramAssessmentPage
