import { BIOMARKER_CONFIGS, type CVCBiomarker } from './constants'

export interface InterpretationResult {
  level: string
  variant: 'success' | 'warning' | 'error' | 'koppar'
  colorClass: string
  description: string
}

// --- Vital Energy (SVS): 1-7, higher is better ---

export function interpretVitalEnergy(score: number): InterpretationResult {
  if (score >= 6.6) return {
    level: 'High',
    variant: 'success',
    colorClass: 'text-skogsgron',
    description: 'You report strong energy and a vibrant sense of aliveness.',
  }
  if (score >= 5.6) return {
    level: 'Above Average',
    variant: 'success',
    colorClass: 'text-skogsgron',
    description: 'Your energy levels are solid, above the general population average.',
  }
  if (score >= 4.6) return {
    level: 'Average',
    variant: 'koppar',
    colorClass: 'text-koppar',
    description: 'Your vitality is in the normal range. There may be room for improvement.',
  }
  if (score >= 3.1) return {
    level: 'Below Average',
    variant: 'warning',
    colorClass: 'text-brand-amber',
    description: 'Your energy is lower than typical. Consider your recovery, nutrition, and purpose alignment.',
  }
  return {
    level: 'Low',
    variant: 'error',
    colorClass: 'text-tegelrod',
    description: 'You report notably low vitality. This is an important area to address with your coach.',
  }
}

// --- Stress Load (PSS-10): 0-40, lower is better ---

export function interpretStressLoad(score: number): InterpretationResult {
  if (score <= 13) return {
    level: 'Low Stress',
    variant: 'success',
    colorClass: 'text-skogsgron',
    description: 'Your perceived stress is low. You feel largely in control of your life demands.',
  }
  if (score <= 26) return {
    level: 'Moderate Stress',
    variant: 'warning',
    colorClass: 'text-brand-amber',
    description: 'You experience a moderate level of stress. Targeted practices can help reduce this.',
  }
  return {
    level: 'High Stress',
    variant: 'error',
    colorClass: 'text-tegelrod',
    description: 'You perceive high stress. Prioritise stress-management strategies and discuss with your coach.',
  }
}

// --- Sleep Quality (PSQI-derived): 0-15, lower is better ---

export function interpretSleepQuality(score: number): InterpretationResult {
  if (score <= 4) return {
    level: 'Good',
    variant: 'success',
    colorClass: 'text-skogsgron',
    description: 'Your sleep quality is good across duration, onset, and disruption dimensions.',
  }
  if (score <= 8) return {
    level: 'Fair',
    variant: 'koppar',
    colorClass: 'text-koppar',
    description: 'Your sleep is adequate but has room for improvement in one or more areas.',
  }
  if (score <= 12) return {
    level: 'Poor',
    variant: 'warning',
    colorClass: 'text-brand-amber',
    description: 'Your sleep quality is concerning. Consider addressing sleep hygiene and evening routines.',
  }
  return {
    level: 'Very Poor',
    variant: 'error',
    colorClass: 'text-tegelrod',
    description: 'Your sleep quality is significantly impaired. This should be a priority focus area.',
  }
}

// --- Dispatcher ---

export function interpretBiomarker(key: CVCBiomarker, score: number): InterpretationResult {
  switch (key) {
    case 'vital_energy': return interpretVitalEnergy(score)
    case 'stress_load': return interpretStressLoad(score)
    case 'sleep_quality': return interpretSleepQuality(score)
  }
}

// --- Vitality Index (0-100%) ---

export function interpretVitalityIndex(percentage: number): InterpretationResult {
  if (percentage >= 80) return {
    level: 'Excellent',
    variant: 'success',
    colorClass: 'text-skogsgron',
    description: 'Your overall vitality is excellent across all biomarkers.',
  }
  if (percentage >= 60) return {
    level: 'Good',
    variant: 'koppar',
    colorClass: 'text-koppar',
    description: 'Your vitality is in a good range with some areas for growth.',
  }
  if (percentage >= 40) return {
    level: 'Fair',
    variant: 'warning',
    colorClass: 'text-brand-amber',
    description: 'Your vitality shows mixed signals. Targeted work can improve your scores.',
  }
  return {
    level: 'Needs Attention',
    variant: 'error',
    colorClass: 'text-tegelrod',
    description: 'Your vitality scores suggest multiple areas need focus. Work with your coach to prioritise.',
  }
}

// --- Normalise a raw score to 0-100% for visual bars ---

export function normalizeScore(key: CVCBiomarker, raw: number): number {
  const config = BIOMARKER_CONFIGS[key]
  const range = config.maxScore - config.minScore
  if (range === 0) return 0
  const pct = ((raw - config.minScore) / range) * 100
  // Invert for "lower is better" so full bar = good
  return config.lowerIsBetter
    ? Math.max(0, Math.min(100, 100 - pct))
    : Math.max(0, Math.min(100, pct))
}

// --- Trend between two scores ---

export type TrendDirection = 'improved' | 'stable' | 'declined'

export function computeTrend(key: CVCBiomarker, previous: number, current: number): TrendDirection {
  const config = BIOMARKER_CONFIGS[key]
  const diff = current - previous
  // Use a small threshold to avoid marking noise as change
  const threshold = (config.maxScore - config.minScore) * 0.05
  if (Math.abs(diff) < threshold) return 'stable'
  if (config.lowerIsBetter) {
    return diff < 0 ? 'improved' : 'declined'
  }
  return diff > 0 ? 'improved' : 'declined'
}
