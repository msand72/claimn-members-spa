// CLAIM'N Platform Constants
// Source of truth: claimn-web/src/lib/constants/index.ts
// These must stay in sync across all CLAIM'N applications

// ============================================
// ARCHETYPES - The 5 CLAIM'N male archetypes
// ============================================
export const ARCHETYPES = [
  'The Achiever',
  'The Optimizer',
  'The Networker',
  'The Grinder',
  'The Philosopher',
  'The Integrator',
] as const

export type Archetype = (typeof ARCHETYPES)[number]

export const ARCHETYPE_DISPLAY_NAMES: Record<string, string> = {
  achiever: 'The Achiever',
  optimizer: 'The Optimizer',
  networker: 'The Networker',
  grinder: 'The Grinder',
  philosopher: 'The Philosopher',
  integrator: 'The Integrator',
}

// Big Five personality dimensions used for archetype scoring
export const BIG5_DIMENSIONS = [
  'conscientiousness',
  'extraversion',
  'openness',
  'agreeableness',
  'neuroticism',
] as const

export type Big5Dimension = (typeof BIG5_DIMENSIONS)[number]

// Archetype Big Five templates — target profiles on 1-7 scale
export const ARCHETYPE_BIG5_TEMPLATES: Record<string, Record<Big5Dimension, number>> = {
  achiever:    { conscientiousness: 6.0, extraversion: 6.0, openness: 2.0, agreeableness: 2.0, neuroticism: 2.0 },
  optimizer:   { conscientiousness: 6.0, extraversion: 2.0, openness: 2.0, agreeableness: 4.0, neuroticism: 2.0 },
  networker:   { conscientiousness: 4.0, extraversion: 6.0, openness: 2.0, agreeableness: 6.0, neuroticism: 6.0 },
  grinder:     { conscientiousness: 2.0, extraversion: 6.0, openness: 6.0, agreeableness: 2.0, neuroticism: 4.0 },
  philosopher: { conscientiousness: 2.0, extraversion: 2.0, openness: 6.0, agreeableness: 6.0, neuroticism: 2.0 },
  integrator:  { conscientiousness: 5.0, extraversion: 5.0, openness: 5.0, agreeableness: 5.0, neuroticism: 2.0 },
}

// ============================================
// PILLARS - The 5 transformation pillars
// ============================================
export const PILLARS = {
  identity: {
    id: 'identity',
    name: 'Identity & Purpose',
    color: 'koppar',
    icon: 'Compass',
    description: 'Clarify your values, purpose, and strategic life direction',
  },
  emotional: {
    id: 'emotional',
    name: 'Emotional & Mental',
    color: 'oliv',
    icon: 'Brain',
    description: 'Build stress resilience, emotional regulation, and mental clarity',
  },
  physical: {
    id: 'physical',
    name: 'Physical & Vital',
    color: 'jordbrun',
    icon: 'Heart',
    description: 'Optimize sleep, nutrition, and physical performance',
  },
  connection: {
    id: 'connection',
    name: 'Connection & Leadership',
    color: 'charcoal',
    icon: 'Users',
    description: 'Develop meaningful relationships and leadership presence',
  },
  mission: {
    id: 'mission',
    name: 'Mission & Mastery',
    color: 'koppar',
    icon: 'Target',
    description: 'Achieve flow states, deliberate practice, and mastery tracking',
  },
} as const

export type PillarId = keyof typeof PILLARS
export type Pillar = (typeof PILLARS)[PillarId]

export const PILLAR_IDS = ['identity', 'emotional', 'physical', 'connection', 'mission'] as const

// Helper to get pillar by ID
export const getPillar = (id: PillarId): Pillar => PILLARS[id]

// ============================================
// KPI TYPES - Trackable metrics
// ============================================
export const KPI_TYPES = {
  action: [
    { id: 'protocol_completion', name: 'Protocol Completion', unit: '%' },
    { id: 'habit_streak', name: 'Habit Streak', unit: 'days' },
    { id: 'session_attendance', name: 'Session Attendance', unit: 'sessions' },
    { id: 'circle_participation', name: 'Circle Participation', unit: 'sessions' },
    { id: 'connection_activities', name: 'Connection Activities', unit: 'activities' },
  ],
  biomarker: [
    { id: 'svs_score', name: 'Vital Energy (SVS)', unit: 'avg', lowerIsBetter: false },
    { id: 'pss_score', name: 'Stress Load (PSS)', unit: 'sum', lowerIsBetter: true },
    { id: 'sleep_quality_score', name: 'Sleep Quality (PSQI)', unit: 'composite', lowerIsBetter: true },
  ],
  biological: [
    { id: 'sleep_hours', name: 'Sleep Hours', unit: 'hours' },
    { id: 'sleep_quality', name: 'Sleep Quality', unit: 'scale_1_10' },
    { id: 'hrv', name: 'HRV', unit: 'ms' },
    { id: 'stress_level', name: 'Stress Level', unit: 'scale_1_10' },
    { id: 'energy_level', name: 'Energy Level', unit: 'scale_1_10' },
    { id: 'weight', name: 'Weight', unit: 'kg' },
    { id: 'exercise_frequency', name: 'Exercise Frequency', unit: 'sessions/week' },
    { id: 'nutrition_score', name: 'Nutrition Score', unit: 'scale_1_10' },
  ],
} as const

export type KpiCategory = keyof typeof KPI_TYPES
export type KpiType = (typeof KPI_TYPES)[KpiCategory][number]

// Flat list of all KPI type IDs
export const ALL_KPI_TYPE_IDS = [
  ...KPI_TYPES.biomarker.map((k) => k.id),
  ...KPI_TYPES.action.map((k) => k.id),
  ...KPI_TYPES.biological.map((k) => k.id),
] as const

// Biomarker KPI IDs that use "lower is better" scoring
export const LOWER_IS_BETTER_KPIS = new Set(
  KPI_TYPES.biomarker.filter((k) => k.lowerIsBetter).map((k) => k.id)
)

// Helper to get KPI type by ID
export const getKpiType = (id: string): KpiType | undefined => {
  for (const category of Object.values(KPI_TYPES)) {
    const found = category.find((k) => k.id === id)
    if (found) return found
  }
  return undefined
}

// ============================================
// TRACKING FREQUENCIES
// ============================================
export const TRACKING_FREQUENCIES = [
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'bi-weekly', name: 'Bi-Weekly' },
] as const

export type TrackingFrequency = (typeof TRACKING_FREQUENCIES)[number]['id']

// ============================================
// GOAL STATUSES
// ============================================
export const GOAL_STATUSES = [
  { id: 'active', name: 'Active', color: 'oliv' },
  { id: 'completed', name: 'Completed', color: 'skogsgron' },
  { id: 'paused', name: 'Paused', color: 'dimblag' },
  { id: 'cancelled', name: 'Cancelled', color: 'tegelrod' },
] as const

export type GoalStatus = (typeof GOAL_STATUSES)[number]['id']

// ============================================
// ACTION ITEM PRIORITIES
// ============================================
export const ACTION_ITEM_PRIORITIES = [
  { id: 'high', name: 'High', color: 'tegelrod' },
  { id: 'medium', name: 'Medium', color: 'brandAmber' },
  { id: 'low', name: 'Low', color: 'dimblag' },
] as const

export type ActionItemPriority = (typeof ACTION_ITEM_PRIORITIES)[number]['id']

// ============================================
// ACTION ITEM STATUSES
// ============================================
export const ACTION_ITEM_STATUSES = [
  { id: 'pending', name: 'Pending', color: 'dimblag' },
  { id: 'in_progress', name: 'In Progress', color: 'brandAmber' },
  { id: 'completed', name: 'Completed', color: 'skogsgron' },
  { id: 'cancelled', name: 'Cancelled', color: 'tegelrod' },
] as const

export type ActionItemStatus = (typeof ACTION_ITEM_STATUSES)[number]['id']

// ============================================
// PROTOCOL PROGRESS STATUSES
// ============================================
export const PROTOCOL_PROGRESS_STATUSES = [
  { id: 'on_track', name: 'On Track', color: 'skogsgron' },
  { id: 'stuck', name: 'Stuck', color: 'brandAmber' },
  { id: 'completed', name: 'Completed', color: 'oliv' },
] as const

export type ProtocolProgressStatus = (typeof PROTOCOL_PROGRESS_STATUSES)[number]['id']

// ============================================
// MILESTONE STATUSES
// ============================================
export const MILESTONE_STATUSES = [
  { id: 'pending', name: 'Pending', color: 'dimblag' },
  { id: 'on_track', name: 'On Track', color: 'skogsgron' },
  { id: 'delayed', name: 'Delayed', color: 'brandAmber' },
  { id: 'achieved', name: 'Achieved', color: 'koppar' },
] as const

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number]['id']

// ============================================
// CREATED BY OPTIONS (for goals, KPIs, action items)
// ============================================
export const CREATED_BY_OPTIONS = ['member', 'expert', 'facilitator', 'system'] as const
export type CreatedBy = (typeof CREATED_BY_OPTIONS)[number]

// ============================================
// REPORT REASONS (shared by feed + message reporting)
// ============================================
export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
] as const

// ============================================
// QUERY STALE TIME TIERS (React Query)
// ============================================
// Use these instead of hardcoding staleTime values in individual hooks.
// The QueryClient global default is STALE_TIME.DEFAULT (5 minutes).
// Only set staleTime in a hook when it needs a different tier.
export const STALE_TIME = {
  /** Data that changes frequently — journey, sessions (2 min) */
  FREQUENT: 1000 * 60 * 2,
  /** Default tier — most endpoints (5 min, matches QueryClient global default) */
  DEFAULT: 1000 * 60 * 5,
  /** Semi-static data — interests, subscription info (10 min) */
  SEMI_STATIC: 1000 * 60 * 10,
  /** Static/reference data — assessment content, resources (1 hour) */
  STATIC: 1000 * 60 * 60,
} as const
