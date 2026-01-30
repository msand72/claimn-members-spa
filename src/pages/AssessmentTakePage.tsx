import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAlert } from '../components/ui'
import { ASSESSMENT_QUESTIONS, SECTION_INFO } from '../lib/assessment/questions'
import { useSubmitAssessment } from '../lib/api/hooks/useAssessments'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

export function AssessmentTakePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const assessmentId = searchParams.get('assessmentId') ?? 'default'
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const submitMutation = useSubmitAssessment()

  const totalQuestions = ASSESSMENT_QUESTIONS.length
  const currentQuestion = ASSESSMENT_QUESTIONS[currentIndex]
  const progress = ((currentIndex + 1) / totalQuestions) * 100

  // Determine current section
  const getCurrentSection = useCallback(() => {
    if (currentIndex < SECTION_INFO.background.questionCount) {
      return 'background'
    } else if (currentIndex < SECTION_INFO.background.questionCount + SECTION_INFO.archetype.questionCount) {
      return 'archetype'
    }
    return 'pillar'
  }, [currentIndex])

  const currentSection = getCurrentSection()
  const sectionInfo = SECTION_INFO[currentSection]

  // Get question number within section
  const getQuestionInSection = () => {
    if (currentSection === 'background') {
      return currentIndex + 1
    } else if (currentSection === 'archetype') {
      return currentIndex - SECTION_INFO.background.questionCount + 1
    }
    return currentIndex - SECTION_INFO.background.questionCount - SECTION_INFO.archetype.questionCount + 1
  }

  const handleAnswer = (value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      // Submit assessment and navigate to results
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = () => {
    setSubmitError(null)

    // Always store in sessionStorage as fallback
    sessionStorage.setItem('assessmentAnswers', JSON.stringify(answers))

    // Submit to API
    submitMutation.mutate(
      { assessmentId, data: { answers } },
      {
        onSuccess: (result) => {
          // Navigate with the result ID from API
          navigate(`/assessment/results?id=${result.id}`)
        },
        onError: () => {
          // API failed — fall back to client-side results
          setSubmitError(
            'Could not save to server. Your results are available locally — you can continue or retry.'
          )
        },
      }
    )
  }

  const handleContinueOffline = () => {
    // Navigate without result ID — results page will use sessionStorage fallback
    navigate('/assessment/results')
  }

  const isAnswered = answers[currentQuestion.id] !== undefined
  const isLastQuestion = currentIndex === totalQuestions - 1

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-kalkvit/60">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-sm font-medium text-koppar">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-koppar to-brandAmber rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Section Info */}
        <div className="mb-6">
          <span className="text-xs text-koppar font-medium uppercase tracking-wider">
            {sectionInfo.title} ({getQuestionInSection()}/{sectionInfo.questionCount})
          </span>
          <p className="text-sm text-kalkvit/50 mt-1">{sectionInfo.description}</p>
        </div>

        {/* Question Card */}
        <GlassCard variant="elevated" className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-kalkvit mb-6">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all',
                  answers[currentQuestion.id] === option.value
                    ? 'border-koppar bg-koppar/10 text-kalkvit'
                    : 'border-white/10 bg-white/[0.04] text-kalkvit/80 hover:border-koppar/30 hover:bg-white/[0.06]'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                      answers[currentQuestion.id] === option.value
                        ? 'border-koppar bg-koppar'
                        : 'border-kalkvit/30'
                    )}
                  >
                    {answers[currentQuestion.id] === option.value && (
                      <Check className="w-3 h-3 text-kalkvit" />
                    )}
                  </div>
                  <span className="text-sm">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Submit Error */}
        {submitError && (
          <GlassAlert
            variant="error"
            title="Submission failed"
            onClose={() => setSubmitError(null)}
            className="mb-4"
          >
            {submitError}
            <div className="mt-3 flex gap-3">
              <GlassButton variant="primary" onClick={handleSubmit} className="text-xs">
                Retry
              </GlassButton>
              <GlassButton variant="ghost" onClick={handleContinueOffline} className="text-xs">
                Continue offline
              </GlassButton>
            </div>
          </GlassAlert>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <GlassButton
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentIndex === 0 || submitMutation.isPending}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </GlassButton>

          <GlassButton
            variant="primary"
            onClick={handleNext}
            disabled={!isAnswered || submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                Submitting
                <Loader2 className="w-5 h-5 animate-spin" />
              </>
            ) : isLastQuestion ? (
              <>
                Complete Assessment
                <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </GlassButton>
        </div>

        {/* Quick Jump (Optional) */}
        <div className="mt-8 flex flex-wrap gap-1 justify-center">
          {ASSESSMENT_QUESTIONS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-koppar scale-125'
                  : answers[ASSESSMENT_QUESTIONS[index].id] !== undefined
                    ? 'bg-skogsgron/60 hover:bg-skogsgron'
                    : 'bg-white/20 hover:bg-white/40'
              )}
              title={`Question ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  )
}

export default AssessmentTakePage;
