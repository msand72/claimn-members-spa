import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAlert, GlassInput, GlassSelect } from '../components/ui'
import { SECTION_INFO } from '../lib/assessment/questions'
import type { AssessmentQuestion as LocalAssessmentQuestion } from '../lib/assessment/questions'
import { useSubmitAssessment, useAssessmentQuestions } from '../lib/api/hooks/useAssessments'
import type {
  AssessmentQuestion as ApiAssessmentQuestion,
  ArchetypeId,
  PillarId,
} from '../lib/api/types'
import { ChevronLeft, ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'

const PROGRESS_KEY = 'claimn_assessment_progress'

/** Default 7-point Likert scale for pillar questions */
const DEFAULT_LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Somewhat Disagree' },
  { value: 4, label: 'Neutral' },
  { value: 5, label: 'Somewhat Agree' },
  { value: 6, label: 'Agree' },
  { value: 7, label: 'Strongly Agree' },
]

/**
 * Extended local question with metadata needed for structured submit.
 * _questionKey and _questionType are carried from the API for submission.
 * _pillarCategory identifies the pillar for pillar-type questions.
 * _optionKeys maps option indices to archetype keys for archetype questions.
 * _backgroundOptions stores the original string-value options for background questions.
 * _isTextInput is true for background questions with no options (free text).
 */
interface EnrichedQuestion extends LocalAssessmentQuestion {
  _questionKey: string
  _questionType: 'archetype' | 'pillar' | 'background'
  _pillarCategory?: string
  _optionKeys?: string[] // archetype option_key values
  _backgroundOptions?: { value: string; text: string }[] // background select options
  _isTextInput?: boolean // background question with no options
}

/** Transform API questions to the local format, enriched with submit metadata */
function transformApiQuestions(apiQuestions: ApiAssessmentQuestion[]): EnrichedQuestion[] {
  return apiQuestions
    .sort((a, b) => (a.sort_order ?? a.order ?? 0) - (b.sort_order ?? b.order ?? 0))
    .map((q) => {
      const questionType = q.question_type ?? q.section ?? 'pillar'
      const questionText = q.question_text ?? q.question ?? ''
      const questionKey = q.question_key ?? q.id
      const pillarCategory = q.pillar_category ?? q.pillar

      // Build display options based on question type
      let options: { value: number; label: string }[] = []
      let optionKeys: string[] | undefined
      let backgroundOptions: { value: string; text: string }[] | undefined
      let isTextInput = false

      if (questionType === 'background') {
        // Background questions: options have string values (e.g. "18-24", "Entry Level")
        // They may also come as { value, text } or { option_key, option_text }
        if (q.options && q.options.length > 0) {
          backgroundOptions = q.options.map((opt) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value: (opt as any).value?.toString() ?? opt.option_key ?? opt.option_text ?? '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            text: (opt as any).text ?? opt.option_text ?? opt.label ?? (opt as any).value?.toString() ?? '',
          }))
          // Create numeric index options for the radio button renderer (fallback)
          options = backgroundOptions.map((opt, idx) => ({
            value: idx,
            label: opt.text,
          }))
        } else {
          // No options = text input question (e.g. biggest_challenge, email)
          isTextInput = true
          options = []
        }
      } else if (questionType === 'archetype' && q.options && q.options.length > 0) {
        // Archetype: each option maps to an archetype key
        options = q.options.map((opt, idx) => ({
          value: idx,
          label: opt.option_text ?? opt.label ?? `Option ${idx + 1}`,
        }))
        optionKeys = q.options.map((opt, i) => opt.option_key ?? String(opt.value ?? i))
      } else if (questionType === 'pillar') {
        // Pillar: use API options if they have numeric values, otherwise default Likert
        if (q.options && q.options.length > 0 && typeof q.options[0].value === 'number') {
          options = q.options.map((opt) => ({
            value: opt.value ?? 0,
            label: opt.label ?? opt.option_text ?? '',
          }))
        } else {
          options = DEFAULT_LIKERT_OPTIONS
        }
      } else {
        // Unknown type fallback
        options = DEFAULT_LIKERT_OPTIONS
      }

      return {
        id: q.id,
        section: (questionType === 'archetype' ? 'archetype' : questionType === 'pillar' ? 'pillar' : 'background') as LocalAssessmentQuestion['section'],
        ...(pillarCategory ? { pillar: pillarCategory as LocalAssessmentQuestion['pillar'] } : {}),
        question: questionText,
        options,
        _questionKey: questionKey,
        _questionType: questionType as EnrichedQuestion['_questionType'],
        _pillarCategory: pillarCategory,
        _optionKeys: optionKeys,
        _backgroundOptions: backgroundOptions,
        _isTextInput: isTextInput,
      }
    })
}

export function AssessmentTakePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const assessmentId = searchParams.get('assessmentId') ?? 'five-pillars'
  const returnTo = searchParams.get('returnTo')
  const [currentIndex, setCurrentIndex] = useState(0)
  // answers stores: number (option index) for radio questions, or -1 as sentinel for text/select
  const [answers, setAnswers] = useState<Record<string, number>>({})
  // textAnswers stores string values for background text inputs and selects
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [restoredFromStorage, setRestoredFromStorage] = useState(false)

  const submitMutation = useSubmitAssessment()

  // Fetch questions from API
  const { data: apiQuestions, isLoading: isLoadingQuestions, isError: isQuestionsError } = useAssessmentQuestions(assessmentId)

  const questions: EnrichedQuestion[] = useMemo(() => {
    if (apiQuestions && apiQuestions.length > 0) {
      return transformApiQuestions(apiQuestions)
    }
    return []
  }, [apiQuestions])

  // Restore progress from sessionStorage on mount
  useEffect(() => {
    if (restoredFromStorage || questions.length === 0) return
    try {
      const stored = sessionStorage.getItem(PROGRESS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.assessmentId === assessmentId) {
          if (parsed.answers) setAnswers(parsed.answers)
          if (parsed.textAnswers) setTextAnswers(parsed.textAnswers)
          if (typeof parsed.currentIndex === 'number' && parsed.currentIndex < questions.length) {
            setCurrentIndex(parsed.currentIndex)
          }
        }
      }
    } catch {
      // Ignore corrupt storage
    }
    setRestoredFromStorage(true)
  }, [questions, assessmentId, restoredFromStorage])

  // Persist progress to sessionStorage on each answer change
  useEffect(() => {
    if (!restoredFromStorage) return
    const hasAnswers = Object.keys(answers).length > 0 || Object.keys(textAnswers).length > 0
    if (!hasAnswers) return
    try {
      sessionStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({ assessmentId, answers, textAnswers, currentIndex })
      )
    } catch {
      // Storage full — ignore
    }
  }, [answers, textAnswers, currentIndex, assessmentId, restoredFromStorage])

  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex] as EnrichedQuestion | undefined
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0

  // Compute section counts from the active questions array
  const sectionCounts = useMemo(() => {
    const bg = questions.filter((q) => q.section === 'background').length
    const arch = questions.filter((q) => q.section === 'archetype').length
    const pil = questions.filter((q) => q.section === 'pillar').length
    return { background: bg, archetype: arch, pillar: pil }
  }, [questions])

  // Determine current section
  const getCurrentSection = useCallback(() => {
    if (currentIndex < sectionCounts.background) {
      return 'background'
    } else if (currentIndex < sectionCounts.background + sectionCounts.archetype) {
      return 'archetype'
    }
    return 'pillar'
  }, [currentIndex, sectionCounts])

  const currentSection = getCurrentSection()
  const sectionInfo = {
    ...SECTION_INFO[currentSection],
    questionCount: sectionCounts[currentSection],
  }

  // Get question number within section
  const getQuestionInSection = () => {
    if (currentSection === 'background') {
      return currentIndex + 1
    } else if (currentSection === 'archetype') {
      return currentIndex - sectionCounts.background + 1
    }
    return currentIndex - sectionCounts.background - sectionCounts.archetype + 1
  }

  const handleAnswer = (optionIndex: number) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }))
  }

  const handleTextAnswer = (value: string) => {
    if (!currentQuestion) return
    setTextAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
    // Also mark as answered in the numeric answers map (sentinel value)
    if (value) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: -1, // sentinel: "answered via text/select"
      }))
    } else {
      // Remove if empty
      setAnswers((prev) => {
        const next = { ...prev }
        delete next[currentQuestion.id]
        return next
      })
    }
  }

  const handleSelectAnswer = (value: string) => {
    if (!currentQuestion) return
    setTextAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
    if (value) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: -1, // sentinel
      }))
    } else {
      setAnswers((prev) => {
        const next = { ...prev }
        delete next[currentQuestion.id]
        return next
      })
    }
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
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

    // Build structured submit request
    const archetypeResponses: { questionKey: string; archetype: ArchetypeId }[] = []
    const pillarResponses: { questionKey: string; pillar: PillarId; value: number }[] = []
    const backgroundData: Record<string, string> = {}

    for (const q of questions) {
      const selectedIndex = answers[q.id]
      if (selectedIndex === undefined) continue

      if (q._questionType === 'background') {
        // Background: get the string value
        const textVal = textAnswers[q.id]
        if (textVal) {
          // Map question keys to backend-expected field names
          const key = q._questionKey
          if (key === 'user_email') {
            backgroundData.email = textVal
          } else if (key === 'user_age_range') {
            backgroundData.ageRange = textVal
          } else if (key === 'user_professional_level') {
            backgroundData.professionalLevel = textVal
          } else if (key === 'user_biggest_challenge') {
            backgroundData.biggestChallenge = textVal
          } else {
            backgroundData[key] = textVal
          }
        }
      } else if (q._questionType === 'archetype') {
        // Resolve option index to archetype key
        const archetypeKey = q._optionKeys?.[selectedIndex]
        if (archetypeKey) {
          archetypeResponses.push({
            questionKey: q._questionKey,
            archetype: archetypeKey as ArchetypeId,
          })
        }
      } else if (q._questionType === 'pillar' && q._pillarCategory) {
        // Resolve option index to Likert value (1-7)
        const value = q.options[selectedIndex]?.value
        if (value !== undefined) {
          pillarResponses.push({
            questionKey: q._questionKey,
            pillar: q._pillarCategory as PillarId,
            value,
          })
        }
      }
    }

    // Also store flat answers in sessionStorage as fallback for client-side scoring
    const flatAnswers: Record<string, number | string> = {}
    for (const [questionId, selectedIndex] of Object.entries(answers)) {
      const q = questions.find((qq) => qq.id === questionId)
      if (q) {
        if (q._questionType === 'background') {
          flatAnswers[questionId] = textAnswers[questionId] ?? ''
        } else if (q._questionType === 'archetype' && q._optionKeys) {
          flatAnswers[questionId] = selectedIndex
        } else {
          flatAnswers[questionId] = q.options[selectedIndex]?.value ?? selectedIndex
        }
      }
    }
    sessionStorage.setItem('assessmentAnswers', JSON.stringify(flatAnswers))

    // Submit structured format to API
    submitMutation.mutate(
      {
        assessmentId,
        data: { archetypeResponses, pillarResponses, backgroundData },
      },
      {
        onSuccess: (result) => {
          // Clear progress on successful submit
          sessionStorage.removeItem(PROGRESS_KEY)
          const resultsUrl = returnTo || `/assessment/results?id=${result.id}`
          navigate(resultsUrl)
        },
        onError: () => {
          setSubmitError(
            'Could not save to server. Your results are available locally — you can continue or retry.'
          )
        },
      }
    )
  }

  const handleContinueOffline = () => {
    sessionStorage.removeItem(PROGRESS_KEY)
    navigate(returnTo || '/assessment/results')
  }

  const isAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false
  const isLastQuestion = currentIndex === totalQuestions - 1

  // Show a brief loading state while questions are being fetched
  if (isLoadingQuestions) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-koppar" />
          <p className="text-sm text-kalkvit/60">Loading assessment questions...</p>
        </div>
      </MainLayout>
    )
  }

  // Show error if questions could not be loaded or current question missing
  if (isQuestionsError || questions.length === 0 || !currentQuestion) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-6">
          <div className="p-4 rounded-full bg-red-500/10">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-kalkvit mb-2">
              Assessment Unavailable
            </h2>
            <p className="text-kalkvit/60 text-sm max-w-md">
              We couldn't load the assessment questions. Please try again later or contact support if the problem persists.
            </p>
          </div>
          <div className="flex gap-3">
            <GlassButton variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => navigate(-1)}>
              Go Back
            </GlassButton>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Render the appropriate input for the current question type
  const renderQuestionInput = () => {
    if (!currentQuestion) return null

    // Background: text input (no options)
    if (currentQuestion._isTextInput) {
      return (
        <GlassInput
          value={textAnswers[currentQuestion.id] ?? ''}
          onChange={(e) => handleTextAnswer(e.target.value)}
          placeholder="Your answer..."
          className="w-full"
        />
      )
    }

    // Background: select dropdown (has _backgroundOptions)
    if (currentQuestion._questionType === 'background' && currentQuestion._backgroundOptions) {
      return (
        <GlassSelect
          value={textAnswers[currentQuestion.id] ?? ''}
          onChange={(e) => handleSelectAnswer(e.target.value)}
          className="w-full"
        >
          <option value="">Select...</option>
          {currentQuestion._backgroundOptions.map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.text}
            </option>
          ))}
        </GlassSelect>
      )
    }

    // Archetype + Pillar: radio-style buttons
    return (
      <div className="space-y-3">
        {currentQuestion.options.map((option, idx) => {
          const isSelected = answers[currentQuestion.id] === idx
          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-all',
                isSelected
                  ? 'border-koppar bg-koppar/10 text-kalkvit'
                  : 'border-white/10 bg-white/[0.04] text-kalkvit/80 hover:border-koppar/30 hover:bg-white/[0.06]'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                    isSelected
                      ? 'border-koppar bg-koppar'
                      : 'border-kalkvit/30'
                  )}
                >
                  {isSelected && (
                    <Check className="w-3 h-3 text-kalkvit" />
                  )}
                </div>
                <span className="text-sm">{option.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

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
          {renderQuestionInput()}
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

        {/* Quick Jump */}
        <div className="mt-8 flex flex-wrap gap-1 justify-center">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-koppar scale-125'
                  : answers[questions[index].id] !== undefined
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

export default AssessmentTakePage
