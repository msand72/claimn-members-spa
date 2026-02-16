import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { sanitizeRedirect } from '../lib/url-validation'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAlert, GlassInput } from '../components/ui'
import type { AssessmentQuestion as LocalAssessmentQuestion } from '../lib/assessment/questions'
import { useSubmitAssessment, useAssessmentQuestions } from '../lib/api/hooks/useAssessments'
import type {
  AssessmentQuestion as ApiAssessmentQuestion,
  PillarId,
} from '../lib/api/types'
import { Check, Loader2, AlertCircle, ChevronUp } from 'lucide-react'
import { cn } from '../lib/utils'
import { useTheme } from '../contexts/ThemeContext'
import { PILLARS } from '../lib/constants'

const PROGRESS_KEY = 'claimn_assessment_progress'

/** Pillar display names for section headers */
const PILLAR_NAMES: Record<string, string> = {
  identity: 'Identity & Purpose',
  emotional: 'Emotional & Mental Ability',
  physical: 'Physical & Vitality',
  connection: 'Connection & Leadership',
  mission: 'Mission & Mastery',
}

/** Pillar accent colors */
const PILLAR_COLORS: Record<string, string> = {
  identity: 'text-koppar',
  emotional: 'text-oliv',
  physical: 'text-jordbrun',
  connection: 'text-kalkvit/80',
  mission: 'text-koppar',
}

/** Big Five dimension display names */
const BIG5_NAMES: Record<string, string> = {
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  openness: 'Openness',
  agreeableness: 'Agreeableness',
  neuroticism: 'Neuroticism',
}

/** Big Five dimension descriptions */
const BIG5_DESCRIPTIONS: Record<string, string> = {
  conscientiousness: 'How you approach structure, discipline, and follow-through',
  extraversion: 'How you engage with people and draw energy from social situations',
  openness: 'How you relate to new ideas, experiences, and unconventional thinking',
  agreeableness: 'How you balance your own needs with the needs of others',
  neuroticism: 'How you experience and respond to stress and emotional pressure',
}

/**
 * Extended local question with metadata needed for structured submit.
 */
interface EnrichedQuestion extends LocalAssessmentQuestion {
  _questionKey: string
  _questionType: 'archetype' | 'pillar' | 'background'
  _pillarCategory?: string
  _optionKeys?: string[]
  _backgroundOptions?: { value: string; text: string }[]
  _isTextInput?: boolean
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

      let options: { value: number; label: string }[] = []
      let optionKeys: string[] | undefined
      let backgroundOptions: { value: string; text: string }[] | undefined
      let isTextInput = false

      if (questionType === 'background') {
        if (q.options && q.options.length > 0) {
          backgroundOptions = q.options.map((opt) => ({
            value: opt.option_value ?? opt.value?.toString() ?? opt.option_text ?? '',
            text: opt.option_text ?? opt.label ?? opt.option_value ?? opt.value?.toString() ?? '',
          }))
          options = backgroundOptions.map((opt, idx) => ({
            value: idx,
            label: opt.text,
          }))
        } else {
          isTextInput = true
          options = []
        }
      } else if (questionType === 'archetype' && q.options && q.options.length > 0) {
        options = q.options.map((opt, idx) => ({
          value: idx,
          label: opt.option_text ?? opt.label ?? `Option ${idx + 1}`,
        }))
        optionKeys = q.options.map((opt, i) => opt.option_value ?? String(opt.value ?? i))
      } else if (questionType === 'pillar') {
        if (q.options && q.options.length > 0 && typeof q.options[0].value === 'number') {
          options = q.options.map((opt) => ({
            value: Number(opt.value) || 0,
            label: opt.label ?? opt.option_text ?? '',
          }))
        } else {
          options = [
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
            { value: 5, label: '5' },
            { value: 6, label: '6' },
            { value: 7, label: '7' },
          ]
        }
      } else {
        options = [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
          { value: 6, label: '6' },
          { value: 7, label: '7' },
        ]
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
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [searchParams] = useSearchParams()
  const assessmentId = searchParams.get('assessmentId') ?? 'five-pillars'
  const returnTo = sanitizeRedirect(searchParams.get('returnTo'), '/assessment/results')
  const formRef = useRef<HTMLFormElement>(null)

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

  // Separate questions by type
  const backgroundQuestions = useMemo(() => questions.filter((q) => q._questionType === 'background'), [questions])
  const archetypeQuestions = useMemo(() => questions.filter((q) => q._questionType === 'archetype'), [questions])
  const pillarQuestions = useMemo(() => questions.filter((q) => q._questionType === 'pillar'), [questions])

  // Group pillar questions by pillar category
  const pillarsByCategory = useMemo(() => {
    const groups: Record<string, EnrichedQuestion[]> = {}
    for (const q of pillarQuestions) {
      const cat = q._pillarCategory || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(q)
    }
    return groups
  }, [pillarQuestions])

  // Detect Big Five format: archetype questions with a Big5 dimension as pillar_category
  const BIG5_DIMS = ['conscientiousness', 'extraversion', 'openness', 'agreeableness', 'neuroticism']
  const isBig5Archetype = archetypeQuestions.length > 0 &&
    archetypeQuestions.some(q => BIG5_DIMS.includes(q._pillarCategory || ''))

  // Group archetype questions by Big Five dimension (when Big Five format)
  const archetypesByDimension = useMemo(() => {
    if (!isBig5Archetype) return {}
    const groups: Record<string, EnrichedQuestion[]> = {}
    for (const q of archetypeQuestions) {
      const dim = q._pillarCategory || 'other'
      if (!groups[dim]) groups[dim] = []
      groups[dim].push(q)
    }
    return groups
  }, [archetypeQuestions, isBig5Archetype])

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
        JSON.stringify({ assessmentId, answers, textAnswers })
      )
    } catch {
      // Storage full — ignore
    }
  }, [answers, textAnswers, assessmentId, restoredFromStorage])

  // Progress calculation
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0
  const isComplete = answeredCount === totalQuestions && totalQuestions > 0

  // Answer handlers
  const handleAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleTextAnswer = (questionId: string, value: string) => {
    setTextAnswers((prev) => ({ ...prev, [questionId]: value }))
    if (value) {
      setAnswers((prev) => ({ ...prev, [questionId]: -1 }))
    } else {
      setAnswers((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }
  }

  const handleSelectAnswer = (questionId: string, value: string) => {
    setTextAnswers((prev) => ({ ...prev, [questionId]: value }))
    if (value) {
      setAnswers((prev) => ({ ...prev, [questionId]: -1 }))
    } else {
      setAnswers((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }
  }

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isComplete) return

    setSubmitError(null)

    const archetypeResponses: { questionKey: string; archetype?: string; value?: string; pillar_category?: string }[] = []
    const pillarResponses: { questionKey: string; pillar: PillarId; value: number }[] = []
    const backgroundData: Record<string, string> = {}

    for (const q of questions) {
      const selectedIndex = answers[q.id]
      if (selectedIndex === undefined) continue

      if (q._questionType === 'background') {
        const textVal = textAnswers[q.id]
        if (textVal) {
          backgroundData[q._questionKey] = textVal
        }
      } else if (q._questionType === 'archetype') {
        if (q._optionKeys && q._optionKeys.length > 0) {
          // Old forced-choice format
          const archetypeKey = q._optionKeys[selectedIndex]
          if (archetypeKey) {
            archetypeResponses.push({
              questionKey: q._questionKey,
              archetype: archetypeKey,
            })
          }
        } else {
          // Big Five Likert format — send value + dimension
          const likertValue = q.options[selectedIndex]?.value
          if (likertValue !== undefined) {
            archetypeResponses.push({
              questionKey: q._questionKey,
              value: String(likertValue),
              pillar_category: q._pillarCategory || '',
            })
          }
        }
      } else if (q._questionType === 'pillar' && q._pillarCategory) {
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

    // Store flat answers for client-side fallback scoring
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

    submitMutation.mutate(
      {
        assessmentId,
        data: { archetypeResponses, pillarResponses, backgroundData },
      },
      {
        onSuccess: () => {
          sessionStorage.removeItem(PROGRESS_KEY)
          navigate(returnTo)
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

  // Loading state
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

  // Error state
  if (isQuestionsError || questions.length === 0) {
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
              We couldn&apos;t load the assessment questions. Please try again later or contact support.
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

  // Running pillar question number across all pillar categories
  let pillarQuestionNumber = 0

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Sticky Progress Bar */}
        <div className={cn(
          'sticky top-0 z-20 -mx-4 px-4 pt-2 pb-4 bg-gradient-to-b',
          isLight
            ? 'from-[#f5f0e8] via-[#f5f0e8]/95 to-transparent'
            : 'from-charcoal via-charcoal/95 to-transparent'
        )}>
          <GlassCard variant="base" className="!p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-sm font-semibold text-kalkvit">
                Progress
              </span>
              <span className="text-sm text-kalkvit/60">
                {answeredCount} / {totalQuestions} questions
              </span>
            </div>
            <div className={cn(
              'w-full rounded-full h-2.5 overflow-hidden',
              isLight ? 'bg-black/10' : 'bg-white/10'
            )}>
              <div
                className="bg-gradient-to-r from-koppar to-jordbrun h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-kalkvit/40 text-center">
              Complete all questions to unlock your personalized results
            </p>
          </GlassCard>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 mt-4">
          {/* ============================================= */}
          {/* Background Section */}
          {/* ============================================= */}
          {backgroundQuestions.length > 0 && (
            <GlassCard variant="elevated">
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-kalkvit mb-2">
                  Background Information
                </h2>
                <p className="text-kalkvit/60">
                  Please provide some basic information to personalize your results and create your unique profile.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {backgroundQuestions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-semibold text-kalkvit mb-2">
                      {q.question}
                    </label>
                    {q._isTextInput ? (
                      <GlassInput
                        value={textAnswers[q.id] ?? ''}
                        onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                        placeholder="Your answer..."
                        className="w-full"
                      />
                    ) : q._backgroundOptions ? (
                      <select
                        value={textAnswers[q.id] ?? ''}
                        onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                        className={cn(
                        'w-full px-4 py-3 border rounded-xl text-kalkvit focus:border-koppar/50 focus:outline-none transition-colors appearance-none cursor-pointer',
                        isLight ? 'bg-white border-black/10' : 'bg-white/[0.06] border-white/10'
                      )}
                      >
                        <option value="" className={isLight ? 'bg-white text-charcoal' : 'bg-charcoal text-kalkvit'}>Select...</option>
                        {q._backgroundOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className={isLight ? 'bg-white text-charcoal' : 'bg-charcoal text-kalkvit'}>
                            {opt.text}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* ============================================= */}
          {/* Archetype Section */}
          {/* ============================================= */}
          {archetypeQuestions.length > 0 && (
            <GlassCard variant="elevated">
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-kalkvit mb-2">
                  Personality Profile
                </h2>
                <p className="text-kalkvit/60">
                  Rate each statement from 1 (not true at all) to 7 (completely true)
                </p>
              </div>

              {isBig5Archetype ? (
                /* Big Five Likert scale — grouped by dimension */
                <div className="space-y-8">
                  {Object.entries(archetypesByDimension).map(([dimension, dimQuestions]) => {
                    return (
                      <div key={dimension} className="border-t border-white/10 pt-6 first:border-t-0 first:pt-0">
                        <div className="mb-4">
                          <h3 className="font-display text-xl font-semibold text-koppar">
                            {BIG5_NAMES[dimension] || dimension}
                          </h3>
                          {BIG5_DESCRIPTIONS[dimension] && (
                            <p className="text-sm text-kalkvit/40 mt-1">
                              {BIG5_DESCRIPTIONS[dimension]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-6">
                          {dimQuestions.map((q, index) => {
                            const selectedIndex = answers[q.id]
                            return (
                              <div key={q.id} className="bg-white/[0.04] rounded-xl p-4">
                                <div className="mb-3">
                                  <span className="inline-block bg-koppar text-kalkvit text-xs font-bold px-2.5 py-1 rounded mb-2">
                                    Question {index + 1}
                                  </span>
                                  <p className="text-kalkvit/90">{q.question}</p>
                                </div>

                                {/* Scale labels */}
                                <div className="flex justify-between text-xs text-kalkvit/40 mb-2 px-1">
                                  <span>Not true at all</span>
                                  <span>Completely true</span>
                                </div>

                                {/* 1-7 Scale */}
                                <div className="flex gap-2">
                                  {q.options.map((option, idx) => {
                                    const isSelected = selectedIndex === idx
                                    return (
                                      <label
                                        key={idx}
                                        className={cn(
                                          'flex-1 flex items-center justify-center h-12 rounded-lg border-2 cursor-pointer transition-all font-display text-lg font-semibold',
                                          isSelected
                                            ? 'border-koppar bg-koppar text-kalkvit shadow-md scale-105'
                                            : 'border-white/10 bg-white/[0.04] text-kalkvit/60 hover:border-koppar/40 hover:bg-koppar/5'
                                        )}
                                      >
                                        <input
                                          type="radio"
                                          name={q.id}
                                          checked={isSelected}
                                          onChange={() => handleAnswer(q.id, idx)}
                                          className="sr-only"
                                        />
                                        {option.value}
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Legacy forced-choice — vertical radio list */
                <div className="space-y-8">
                  {archetypeQuestions.map((q, index) => (
                    <div key={q.id} className="border-l-4 border-koppar pl-5 py-2">
                      <h3 className="font-display text-lg font-semibold text-kalkvit mb-4">
                        {index + 1}. {q.question}
                      </h3>
                      <div className="space-y-3">
                        {q.options.map((option, idx) => {
                          const isSelected = answers[q.id] === idx
                          return (
                            <label
                              key={idx}
                              className={cn(
                                'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                                isSelected
                                  ? 'border-koppar bg-koppar/10'
                                  : 'border-white/10 hover:border-koppar/30 hover:bg-white/[0.04]'
                              )}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={isSelected}
                                onChange={() => handleAnswer(q.id, idx)}
                                className="sr-only"
                              />
                              <div
                                className={cn(
                                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                  isSelected ? 'border-koppar bg-koppar' : 'border-kalkvit/30'
                                )}
                              >
                                {isSelected && <Check className="w-3 h-3 text-kalkvit" />}
                              </div>
                              <span className="text-sm text-kalkvit/80">{option.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}

          {/* ============================================= */}
          {/* Pillar Section */}
          {/* ============================================= */}
          {pillarQuestions.length > 0 && (
            <GlassCard variant="elevated">
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-kalkvit mb-2">
                  Five Pillar Development Assessment
                </h2>
                <p className="text-kalkvit/60">
                  Rate each statement from 1 (not true at all) to 7 (completely true)
                </p>
              </div>

              <div className="space-y-8">
                {Object.entries(pillarsByCategory).map(([pillarId, pillarQs]) => (
                  <div key={pillarId} className="border-t border-white/10 pt-6 first:border-t-0 first:pt-0">
                    <h3 className={cn('font-display text-xl font-semibold mb-4', PILLAR_COLORS[pillarId] || 'text-koppar')}>
                      {PILLAR_NAMES[pillarId] || PILLARS[pillarId as keyof typeof PILLARS]?.name || pillarId}
                    </h3>

                    <div className="space-y-6">
                      {pillarQs.map((q) => {
                        pillarQuestionNumber++
                        const selectedIndex = answers[q.id]

                        return (
                          <div key={q.id} className="bg-white/[0.04] rounded-xl p-4">
                            <div className="mb-3">
                              <span className="inline-block bg-koppar text-kalkvit text-xs font-bold px-2.5 py-1 rounded mb-2">
                                Question {pillarQuestionNumber}
                              </span>
                              <p className="text-kalkvit/90">
                                {q.question}
                              </p>
                            </div>

                            {/* Scale labels */}
                            <div className="flex justify-between text-xs text-kalkvit/40 mb-2 px-1">
                              <span>Not true at all</span>
                              <span>Completely true</span>
                            </div>

                            {/* 1-7 Scale */}
                            <div className="flex gap-2">
                              {q.options.map((option, idx) => {
                                const isSelected = selectedIndex === idx
                                return (
                                  <label
                                    key={idx}
                                    className={cn(
                                      'flex-1 flex items-center justify-center h-12 rounded-lg border-2 cursor-pointer transition-all font-display text-lg font-semibold',
                                      isSelected
                                        ? 'border-koppar bg-koppar text-kalkvit shadow-md scale-105'
                                        : 'border-white/10 bg-white/[0.04] text-kalkvit/60 hover:border-koppar/40 hover:bg-koppar/5'
                                    )}
                                  >
                                    <input
                                      type="radio"
                                      name={q.id}
                                      checked={isSelected}
                                      onChange={() => handleAnswer(q.id, idx)}
                                      className="sr-only"
                                    />
                                    {option.value}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* ============================================= */}
          {/* Submit Error */}
          {/* ============================================= */}
          {submitError && (
            <GlassAlert
              variant="error"
              title="Submission failed"
              onClose={() => setSubmitError(null)}
            >
              {submitError}
              <div className="mt-3 flex gap-3">
                <GlassButton variant="primary" onClick={() => formRef.current?.requestSubmit()} className="text-xs">
                  Retry
                </GlassButton>
                <GlassButton variant="ghost" onClick={handleContinueOffline} className="text-xs">
                  Continue offline
                </GlassButton>
              </div>
            </GlassAlert>
          )}

          {/* ============================================= */}
          {/* Submit Button */}
          {/* ============================================= */}
          <GlassCard variant="elevated" className="text-center">
            <button
              type="submit"
              disabled={!isComplete || submitMutation.isPending}
              className={cn(
                'font-display font-semibold px-12 py-4 rounded-xl text-lg transition-all',
                isComplete && !submitMutation.isPending
                  ? 'bg-koppar text-kalkvit hover:bg-koppar/90 hover:-translate-y-0.5 shadow-lg cursor-pointer'
                  : 'bg-white/10 text-kalkvit/30 cursor-not-allowed'
              )}
            >
              {submitMutation.isPending ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Your Results...
                </span>
              ) : isComplete ? (
                'Complete Assessment'
              ) : (
                `Complete All Questions (${answeredCount}/${totalQuestions})`
              )}
            </button>
            <p className="mt-3 text-sm text-kalkvit/40">
              Your results will be generated instantly upon completion
            </p>
          </GlassCard>
        </form>

        {/* Scroll to top button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-koppar/80 text-kalkvit shadow-lg hover:bg-koppar transition-all z-30"
          title="Back to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>
    </MainLayout>
  )
}

export default AssessmentTakePage
