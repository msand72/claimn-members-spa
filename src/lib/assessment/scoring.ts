// Assessment Scoring Engine - Client-side fallback
// Scale: 1-7 Likert (matching PHP original and claimn-web reference)
// Primary scoring is done server-side; this is for offline fallback only

import { PILLARS, ARCHETYPE_BIG5_TEMPLATES, ARCHETYPE_DISPLAY_NAMES, BIG5_DIMENSIONS } from '../constants'
import type { Archetype, PillarId, Big5Dimension } from '../constants'

export interface PillarScore {
  raw: number
  level: 'low' | 'moderate' | 'high'
  percentage: number
}

export interface ArchetypeScores {
  [key: string]: number
}

export interface Insight {
  type: string
  title: string
  insight: string
  priority?: string
  pillar?: string
  archetype?: string
  score?: number
  level?: string
  [key: string]: unknown
}

export interface AssessmentResult {
  id: string
  primary_archetype: Archetype
  secondary_archetype: Archetype | null
  archetype_scores: ArchetypeScores
  pillar_scores: Record<PillarId, PillarScore>
  consistency_score: number
  micro_insights: Insight[]
  integration_insights: Insight[]
  created_at: string
}

// =====================================================
// Big Five Scoring Functions
// =====================================================

// Max possible Euclidean distance in 5D space with 1-7 scale
const MAX_POSSIBLE_DISTANCE = Math.sqrt(5 * Math.pow(7 - 1, 2)) // sqrt(180) ≈ 13.42

export interface Big5Profile {
  C: number
  E: number
  O: number
  A: number
  N: number
}

export interface Big5ArchetypeScores {
  big5_profile: Big5Profile
  archetype_match: Record<string, number>
}

// Compute Big Five dimension averages from archetype question responses
export function computeBig5Profile(
  answers: Record<string, number | string>,
  questions: { id: string; question_type?: string; pillar_category?: string; is_reverse_scored?: boolean }[]
): Big5Profile {
  const dimensionMap: Record<string, string> = {
    conscientiousness: 'C',
    extraversion: 'E',
    openness: 'O',
    agreeableness: 'A',
    neuroticism: 'N',
  }

  const dimensionValues: Record<string, number[]> = { C: [], E: [], O: [], A: [], N: [] }

  for (const question of questions) {
    if (question.question_type !== 'archetype') continue
    const dim = dimensionMap[question.pillar_category || '']
    if (!dim) continue

    const rawValue = Number(answers[question.id])
    if (isNaN(rawValue) || rawValue < 1 || rawValue > 7) continue

    const value = question.is_reverse_scored ? 8 - rawValue : rawValue
    dimensionValues[dim].push(value)
  }

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 4.0

  return {
    C: Math.round(avg(dimensionValues.C) * 10) / 10,
    E: Math.round(avg(dimensionValues.E) * 10) / 10,
    O: Math.round(avg(dimensionValues.O) * 10) / 10,
    A: Math.round(avg(dimensionValues.A) * 10) / 10,
    N: Math.round(avg(dimensionValues.N) * 10) / 10,
  }
}

// Calculate Euclidean distance between user profile and archetype template
function euclideanDistance(profile: Big5Profile, template: Record<Big5Dimension, number>): number {
  return Math.sqrt(
    Math.pow(profile.C - template.conscientiousness, 2) +
    Math.pow(profile.E - template.extraversion, 2) +
    Math.pow(profile.O - template.openness, 2) +
    Math.pow(profile.A - template.agreeableness, 2) +
    Math.pow(profile.N - template.neuroticism, 2)
  )
}

// Calculate match percentages for all archetypes from a Big Five profile
export function calculateArchetypeMatches(profile: Big5Profile): Record<string, number> {
  const matches: Record<string, number> = {}
  for (const [archetype, template] of Object.entries(ARCHETYPE_BIG5_TEMPLATES)) {
    const distance = euclideanDistance(profile, template)
    matches[archetype] = Math.round((1 - distance / MAX_POSSIBLE_DISTANCE) * 100)
  }
  return matches
}

// Calculate consistency score — profile fit confidence
// High value = user's Big Five profile closely matches a known archetype template
export function calculateConsistencyScore(archetypeMatchOrScores: Record<string, number> | Big5ArchetypeScores): number {
  let matchPercentages: number[]

  if ('big5_profile' in archetypeMatchOrScores) {
    matchPercentages = Object.values(archetypeMatchOrScores.archetype_match)
  } else {
    matchPercentages = Object.values(archetypeMatchOrScores)
  }

  if (matchPercentages.length === 0) return 0.0

  const bestMatch = Math.max(...matchPercentages)
  // Normalize: a 100% match = 1.0 consistency, scale linearly
  const consistency = bestMatch / 100
  return Math.round(consistency * 100) / 100
}

// Calculate pillar score from responses (1-7 Likert scale)
export function calculatePillarScore(responses: number[]): PillarScore {
  if (responses.length === 0) {
    return { raw: 0, level: 'low', percentage: 0 }
  }

  const sum = responses.reduce((a, b) => a + b, 0)
  const raw = Math.round((sum / responses.length) * 10) / 10

  let level: 'low' | 'moderate' | 'high'
  if (raw <= 3.5) {
    level = 'low'
  } else if (raw <= 5.5) {
    level = 'moderate'
  } else {
    level = 'high'
  }

  const percentage = Math.round((raw / 7) * 100) // 1-7 scale → 0-100

  return { raw, level, percentage }
}

// Determine primary and secondary archetypes
export function determineArchetypes(
  archetypeScores: ArchetypeScores
): { primary: Archetype; secondary: Archetype | null } {
  const sorted = Object.entries(archetypeScores).sort((a, b) => b[1] - a[1])

  const primary = sorted[0][0] as Archetype
  const secondary = sorted[1] && sorted[1][1] > 0 ? (sorted[1][0] as Archetype) : null

  return { primary, secondary }
}

// Generate micro insights for low-scoring pillars
export function generateMicroInsights(
  primary: Archetype,
  pillarScores: Record<PillarId, PillarScore>
): Insight[] {
  const insights: Insight[] = []

  // Sort pillars by score (lowest first)
  const sortedPillars = Object.entries(pillarScores).sort((a, b) => a[1].raw - b[1].raw)

  let insightCount = 0
  for (const [pillar, data] of sortedPillars) {
    if (insightCount >= 3) break

    // Skip high-scoring pillars unless no low/moderate pillars exist
    if (data.level === 'high' && insightCount === 0 && sortedPillars.length > 1) {
      continue
    }

    const pillarInfo = PILLARS[pillar as PillarId]
    insights.push({
      type: 'pillar_analysis',
      pillar,
      archetype: primary,
      title: `${pillarInfo.name} Development Focus`,
      insight: getPillarInsight(primary, pillar as PillarId, data.level),
      score: data.raw,
      level: data.level,
      priority: data.level === 'low' ? 'high' : data.level === 'moderate' ? 'medium' : 'low',
    })
    insightCount++
  }

  if (insights.length === 0) {
    insights.push({
      type: 'general',
      title: 'Strong Foundation',
      insight:
        'Your assessment shows solid development across all key areas. Focus on integration and leveraging your strengths for maximum impact.',
      priority: 'medium',
    })
  }

  return insights
}

// Get pillar-specific insight based on archetype and level
function getPillarInsight(archetype: Archetype, pillar: PillarId, level: string): string {
  const pillarName = PILLARS[pillar].name

  const archetypeInsights: Record<string, Record<string, Record<string, string>>> = {
    achiever: {
      identity: {
        low: 'As an Achiever, your drive for results is strong, but clarity on your core values will help direct that energy more purposefully.',
        moderate:
          'Your achievement orientation is well-established. Deepening your purpose clarity will amplify your impact.',
        high: 'Your clear sense of purpose fuels your achievements effectively.',
      },
      emotional: {
        low: 'High achievers often neglect emotional processing. Building stress resilience will prevent burnout.',
        moderate:
          'Your emotional awareness is developing. Continue building resilience practices.',
        high: 'Strong emotional regulation supports your ambitious goals.',
      },
      physical: {
        low: 'Your achievement drive may be outpacing your physical foundation. Optimize sleep and recovery.',
        moderate: 'Good physical awareness. Fine-tune your energy management for peak performance.',
        high: 'Your physical optimization supports sustained high performance.',
      },
      connection: {
        low: 'Achievers can become isolated. Intentional relationship building will expand your impact.',
        moderate: 'Your connections are growing. Deepen key relationships strategically.',
        high: 'Strong relationships amplify your ability to achieve meaningful goals.',
      },
      mission: {
        low: 'Channel your achievement energy into deliberate skill development.',
        moderate: 'Your mastery path is progressing. Focus on flow state cultivation.',
        high: 'Your pursuit of mastery aligns well with your achievement orientation.',
      },
    },
  }

  // Default insights if specific archetype not found
  const defaultInsights: Record<string, Record<string, string>> = {
    identity: {
      low: `Your ${pillarName} foundation needs attention. Start with values clarification exercises.`,
      moderate: `Your ${pillarName} is developing well. Continue deepening your understanding.`,
      high: `Strong ${pillarName} foundation. Leverage this strength in other areas.`,
    },
    emotional: {
      low: 'Building emotional resilience will support all other areas of development.',
      moderate: 'Continue developing your emotional regulation practices.',
      high: 'Your emotional intelligence is a significant asset.',
    },
    physical: {
      low: 'Physical optimization is foundational. Prioritize sleep and nutrition protocols.',
      moderate: 'Good physical awareness. Fine-tune for optimal performance.',
      high: 'Your physical foundation supports sustained excellence.',
    },
    connection: {
      low: 'Intentional relationship development will multiply your effectiveness.',
      moderate: 'Your relationship skills are growing. Deepen key connections.',
      high: 'Strong connections provide support and opportunities.',
    },
    mission: {
      low: 'Focus on skill development and deliberate practice foundations.',
      moderate: 'Continue building mastery through structured practice.',
      high: 'Your mastery orientation drives continuous improvement.',
    },
  }

  return (
    archetypeInsights[archetype]?.[pillar]?.[level] || defaultInsights[pillar]?.[level] || ''
  )
}

// Generate integration insights
// Supports both Big Five archetype_match format and legacy vote-count format
export function generateIntegrationInsights(
  primary: Archetype,
  secondary: Archetype | null,
  archetypeScores: ArchetypeScores | Big5ArchetypeScores,
  pillarScores: Record<PillarId, PillarScore>
): Insight[] {
  const insights: Insight[] = []

  // Sort pillars by score
  const sortedPillars = Object.entries(pillarScores).sort((a, b) => b[1].raw - a[1].raw)
  const highestPillar = sortedPillars[0]
  const lowestPillar = sortedPillars[sortedPillars.length - 1]
  const gap = highestPillar[1].raw - lowestPillar[1].raw

  // High-Low Gap Analysis
  if (gap >= 2.5 && highestPillar[1].raw >= 5.0 && lowestPillar[1].raw <= 4.0) {
    insights.push({
      type: 'pillar_synergy',
      title: 'Pillar Gap Analysis',
      insight: `Your strength in ${PILLARS[highestPillar[0] as PillarId].name} (${highestPillar[1].raw}/7) can be leveraged to develop ${PILLARS[lowestPillar[0] as PillarId].name} (${lowestPillar[1].raw}/7). Apply the same systematic approach that created your strength.`,
      priority: 'high',
    })
  }

  // Dual archetype integration
  if (secondary) {
    insights.push({
      type: 'dual_integration',
      title: `${primary} + ${secondary} Synergy`,
      insight: `Your combination of ${primary} and ${secondary} traits creates unique strengths. Learn to integrate both approaches situationally for maximum effectiveness.`,
    })
  }

  // Archetype dominance analysis
  if ('big5_profile' in archetypeScores) {
    // Big Five format: use match percentages
    const matches = Object.entries(archetypeScores.archetype_match).sort((a, b) => b[1] - a[1])
    const primaryMatch = matches[0]?.[1] ?? 0
    const secondaryMatch = matches[1]?.[1] ?? 0
    const dominanceGap = primaryMatch - secondaryMatch

    if (dominanceGap < 10) {
      insights.push({
        type: 'archetype_balance',
        title: 'Blended Profile',
        insight: `Your top two archetypes are closely matched (${primaryMatch}% vs ${secondaryMatch}%), indicating a versatile personality. You draw from multiple strengths depending on context.`,
      })
    } else if (primaryMatch >= 75) {
      insights.push({
        type: 'archetype_dominance',
        title: 'Strong Archetype Focus',
        insight: `Your ${primary} match (${primaryMatch}%) shows a clear personality orientation. This focused identity allows deep mastery but consider developing complementary traits.`,
      })
    }
  } else {
    // Legacy vote-count format
    const primaryScore = (archetypeScores as ArchetypeScores)[primary] || 0
    const totalResponses = Object.values(archetypeScores as ArchetypeScores).reduce((a, b) => a + b, 0)
    const primaryPercent = totalResponses > 0 ? Math.round((primaryScore / totalResponses) * 100) : 0

    if (primaryPercent >= 70) {
      insights.push({
        type: 'archetype_dominance',
        title: 'Strong Archetype Focus',
        insight: `Your ${primary} dominance (${primaryPercent}%) creates clear directional focus. This concentrated identity allows for deep mastery but consider developing complementary traits to avoid rigidity.`,
      })
    }
  }

  return insights.slice(0, 5)
}

// Helper to capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Calculate pillar scores from assessment answers (1-7 Likert scale)
// Used as client-side fallback when API scoring is unavailable
export function calculatePillarScores(
  answers: Record<string, number>,
  questions: { id: string; section?: string; question_type?: string; pillar?: string; pillar_category?: string }[]
): Record<PillarId, number> {
  // Build pillar groups dynamically from questions array
  const pillarAnswers: Record<string, number[]> = {}
  for (const question of questions) {
    // Support both old format (section='pillar') and new format (question_type='pillar')
    const isPillarQuestion = question.question_type === 'pillar' || question.section === 'pillar'
    const pillarKey = question.pillar_category || question.pillar

    if (isPillarQuestion && pillarKey) {
      if (!pillarAnswers[pillarKey]) {
        pillarAnswers[pillarKey] = []
      }
      if (answers[question.id] !== undefined) {
        pillarAnswers[pillarKey].push(answers[question.id])
      }
    }
  }

  // Calculate percentage for each pillar (1-7 Likert scale to 0-100)
  const scores: Record<PillarId, number> = {} as Record<PillarId, number>
  for (const [pillarId, pillarAnswerList] of Object.entries(pillarAnswers)) {
    if (pillarAnswerList.length > 0) {
      const sum = pillarAnswerList.reduce((a, b) => a + b, 0)
      const avg = sum / pillarAnswerList.length
      scores[pillarId as PillarId] = Math.round((avg / 7) * 100) // 1-7 → 0-100
    } else {
      scores[pillarId as PillarId] = 0
    }
  }

  return scores
}

// Determine archetypes from answers
// Supports both Big Five Likert format (question keys start with big5_) and legacy forced-choice
export function determineArchetypesFromAnswers(
  answers: Record<string, number | string>,
  questions: { id: string; section?: string; question_type?: string; pillar_category?: string; is_reverse_scored?: boolean }[]
): string[] {
  const archetypeQuestions = questions.filter(
    q => q.question_type === 'archetype' || q.section === 'archetype'
  )

  // Detect format: Big Five if any archetype question has a Big Five pillar_category
  const isBig5 = archetypeQuestions.some(q =>
    BIG5_DIMENSIONS.includes(q.pillar_category as Big5Dimension)
  )

  if (isBig5) {
    // Big Five scoring: compute profile → match to templates
    const profile = computeBig5Profile(answers, questions)
    const matches = calculateArchetypeMatches(profile)
    const sorted = Object.entries(matches)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => ARCHETYPE_DISPLAY_NAMES[key] || capitalize(key))
    return sorted.length > 0 ? sorted : ['The Integrator']
  }

  // Legacy forced-choice scoring
  const archetypeScores: Record<string, number> = {
    achiever: 0, optimizer: 0, networker: 0, grinder: 0, philosopher: 0,
  }

  for (const question of archetypeQuestions) {
    if (answers[question.id] === undefined) continue
    const answerValue = String(answers[question.id]).toLowerCase()
    if (answerValue in archetypeScores) {
      archetypeScores[answerValue]++
    } else {
      const numVal = Number(answers[question.id])
      const archetypeKeys = Object.keys(archetypeScores)
      if (numVal >= 1 && numVal <= 5) {
        archetypeScores[archetypeKeys[numVal - 1]]++
      }
    }
  }

  const sorted = Object.entries(archetypeScores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 0)
    .map(([key]) => ARCHETYPE_DISPLAY_NAMES[key] || capitalize(key))

  return sorted.length > 0 ? sorted : ['The Achiever']
}

// Generate simple micro insights for pillar scores (percentage-based)
export function generateSimpleMicroInsights(
  pillarScores: Record<PillarId, number>
): Record<PillarId, string> {
  const insights: Record<PillarId, string> = {} as Record<PillarId, string>

  for (const [pillarId, score] of Object.entries(pillarScores)) {
    const pillar = PILLARS[pillarId as PillarId]
    if (score >= 75) {
      insights[pillarId as PillarId] = `Strong foundation in ${pillar.name}. Continue leveraging this strength to support other areas.`
    } else if (score >= 42) {
      insights[pillarId as PillarId] = `${pillar.name} shows room for growth. Consider focused protocols to strengthen this area.`
    } else {
      insights[pillarId as PillarId] = `${pillar.name} is a key growth opportunity. Prioritize development here for maximum impact.`
    }
  }

  return insights
}

// Generate integration insights (simplified)
export function generateSimpleIntegrationInsights(
  pillarScores: Record<PillarId, number>,
  archetypes: string[]
): string[] {
  const insights: string[] = []

  // Sort pillars by score
  const sortedPillars = Object.entries(pillarScores).sort((a, b) => b[1] - a[1])
  const strongest = sortedPillars[0]
  const weakest = sortedPillars[sortedPillars.length - 1]

  // Gap insight
  if (strongest[1] - weakest[1] >= 30) {
    insights.push(
      `Your strength in ${PILLARS[strongest[0] as PillarId].name} (${strongest[1]}%) can be leveraged to develop ${PILLARS[weakest[0] as PillarId].name} (${weakest[1]}%).`
    )
  }

  // Archetype insight
  if (archetypes.length > 0) {
    insights.push(
      `As ${archetypes[0]}, focus on approaches that align with your natural tendencies for sustainable growth.`
    )
  }

  // Balance insight
  const pillarValues = Object.values(pillarScores)
  const avgScore = pillarValues.length > 0 ? pillarValues.reduce((a, b) => a + b, 0) / pillarValues.length : 0
  if (avgScore >= 60) {
    insights.push(
      'Your overall scores indicate a solid foundation. Focus on integration and synergy between pillars.'
    )
  } else {
    insights.push(
      'Building foundational habits in your growth areas will create momentum across all pillars.'
    )
  }

  return insights
}
