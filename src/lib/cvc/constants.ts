export type CVCBiomarker = 'vital_energy' | 'stress_load' | 'sleep_quality'

export interface BiomarkerConfig {
  key: CVCBiomarker
  label: string
  instrument: string
  fullName: string
  maxScore: number
  minScore: number
  lowerIsBetter: boolean
  description: string
}

export const BIOMARKER_CONFIGS: Record<CVCBiomarker, BiomarkerConfig> = {
  vital_energy: {
    key: 'vital_energy',
    label: 'Vital Energy',
    instrument: 'SVS',
    fullName: 'Subjective Vitality Scale',
    maxScore: 7,
    minScore: 1,
    lowerIsBetter: false,
    description: 'Measures your subjective sense of energy, aliveness, and vitality.',
  },
  stress_load: {
    key: 'stress_load',
    label: 'Stress Load',
    instrument: 'PSS-10',
    fullName: 'Perceived Stress Scale',
    maxScore: 40,
    minScore: 0,
    lowerIsBetter: true,
    description: 'Measures how unpredictable, uncontrollable, and overloaded you find your life.',
  },
  sleep_quality: {
    key: 'sleep_quality',
    label: 'Sleep Quality',
    instrument: 'PSQI',
    fullName: 'Pittsburgh Sleep Quality Index (adapted)',
    maxScore: 15,
    minScore: 0,
    lowerIsBetter: true,
    description: 'Measures sleep duration, onset, disruptions, and daytime impact.',
  },
}

export const BIOMARKER_ORDER: CVCBiomarker[] = ['vital_energy', 'stress_load', 'sleep_quality']

export const CVC_TYPE_LABELS: Record<string, string> = {
  baseline: 'CVC-1 (Baseline)',
  midline: 'CVC-2 (Midpoint)',
  final: 'CVC-3 (Close)',
}

export const CVC_SHORT_LABELS: Record<string, string> = {
  baseline: 'Pre',
  midline: 'Mid',
  final: 'Post',
}
