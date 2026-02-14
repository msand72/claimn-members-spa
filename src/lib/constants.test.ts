import { describe, it, expect } from 'vitest'
import {
  ARCHETYPES,
  ARCHETYPE_DISPLAY_NAMES,
  PILLAR_IDS,
  PILLARS,
  getPillar,
  getKpiType,
  KPI_TYPES,
  ALL_KPI_TYPE_IDS,
  REPORT_REASONS,
  STALE_TIME,
  BIG5_DIMENSIONS,
  GOAL_STATUSES,
  ACTION_ITEM_PRIORITIES,
  ACTION_ITEM_STATUSES,
  TRACKING_FREQUENCIES,
} from './constants'

describe('ARCHETYPES', () => {
  it('has 6 archetypes', () => {
    expect(ARCHETYPES).toHaveLength(6)
  })

  it('includes all expected archetypes', () => {
    expect(ARCHETYPES).toContain('The Achiever')
    expect(ARCHETYPES).toContain('The Optimizer')
    expect(ARCHETYPES).toContain('The Networker')
    expect(ARCHETYPES).toContain('The Grinder')
    expect(ARCHETYPES).toContain('The Philosopher')
    expect(ARCHETYPES).toContain('The Integrator')
  })

  it('has matching display names', () => {
    expect(Object.keys(ARCHETYPE_DISPLAY_NAMES)).toHaveLength(6)
    expect(ARCHETYPE_DISPLAY_NAMES['achiever']).toBe('The Achiever')
    expect(ARCHETYPE_DISPLAY_NAMES['integrator']).toBe('The Integrator')
  })
})

describe('PILLARS', () => {
  it('has 5 pillars', () => {
    expect(PILLAR_IDS).toHaveLength(5)
  })

  it('each pillar has required fields', () => {
    for (const id of PILLAR_IDS) {
      const pillar = PILLARS[id]
      expect(pillar.id).toBe(id)
      expect(pillar.name).toBeTruthy()
      expect(pillar.color).toBeTruthy()
      expect(pillar.icon).toBeTruthy()
      expect(pillar.description).toBeTruthy()
    }
  })
})

describe('getPillar', () => {
  it('returns correct pillar for each ID', () => {
    expect(getPillar('identity').name).toBe('Identity & Purpose')
    expect(getPillar('emotional').name).toBe('Emotional & Mental')
    expect(getPillar('physical').name).toBe('Physical & Vital')
    expect(getPillar('connection').name).toBe('Connection & Leadership')
    expect(getPillar('mission').name).toBe('Mission & Mastery')
  })
})

describe('getKpiType', () => {
  it('finds action KPIs', () => {
    expect(getKpiType('protocol_completion')?.name).toBe('Protocol Completion')
    expect(getKpiType('habit_streak')?.name).toBe('Habit Streak')
  })

  it('finds biological KPIs', () => {
    expect(getKpiType('sleep_hours')?.name).toBe('Sleep Hours')
    expect(getKpiType('hrv')?.name).toBe('HRV')
  })

  it('returns undefined for unknown ID', () => {
    expect(getKpiType('nonexistent')).toBeUndefined()
  })
})

describe('KPI_TYPES', () => {
  it('has action and biological categories', () => {
    expect(KPI_TYPES.action.length).toBeGreaterThan(0)
    expect(KPI_TYPES.biological.length).toBeGreaterThan(0)
  })

  it('ALL_KPI_TYPE_IDS matches total', () => {
    expect(ALL_KPI_TYPE_IDS).toHaveLength(
      KPI_TYPES.action.length + KPI_TYPES.biological.length
    )
  })
})

describe('BIG5_DIMENSIONS', () => {
  it('has 5 dimensions', () => {
    expect(BIG5_DIMENSIONS).toHaveLength(5)
    expect(BIG5_DIMENSIONS).toContain('conscientiousness')
    expect(BIG5_DIMENSIONS).toContain('neuroticism')
  })
})

describe('REPORT_REASONS', () => {
  it('has 5 report reasons', () => {
    expect(REPORT_REASONS).toHaveLength(5)
  })

  it('each has value and label', () => {
    for (const reason of REPORT_REASONS) {
      expect(reason.value).toBeTruthy()
      expect(reason.label).toBeTruthy()
    }
  })

  it('includes expected reasons', () => {
    const values = REPORT_REASONS.map(r => r.value)
    expect(values).toContain('spam')
    expect(values).toContain('harassment')
    expect(values).toContain('other')
  })
})

describe('STALE_TIME', () => {
  it('tiers are in ascending order', () => {
    expect(STALE_TIME.FREQUENT).toBeLessThan(STALE_TIME.DEFAULT)
    expect(STALE_TIME.DEFAULT).toBeLessThan(STALE_TIME.SEMI_STATIC)
    expect(STALE_TIME.SEMI_STATIC).toBeLessThan(STALE_TIME.STATIC)
  })

  it('has correct values', () => {
    expect(STALE_TIME.FREQUENT).toBe(120_000)   // 2 min
    expect(STALE_TIME.DEFAULT).toBe(300_000)     // 5 min
    expect(STALE_TIME.SEMI_STATIC).toBe(600_000) // 10 min
    expect(STALE_TIME.STATIC).toBe(3_600_000)   // 1 hour
  })
})

describe('Status/priority constants', () => {
  it('GOAL_STATUSES has expected statuses', () => {
    const ids = GOAL_STATUSES.map(s => s.id)
    expect(ids).toContain('active')
    expect(ids).toContain('completed')
    expect(ids).toContain('paused')
    expect(ids).toContain('cancelled')
  })

  it('ACTION_ITEM_PRIORITIES has 3 levels', () => {
    expect(ACTION_ITEM_PRIORITIES).toHaveLength(3)
    expect(ACTION_ITEM_PRIORITIES.map(p => p.id)).toEqual(['high', 'medium', 'low'])
  })

  it('ACTION_ITEM_STATUSES has expected statuses', () => {
    expect(ACTION_ITEM_STATUSES.map(s => s.id)).toEqual(['pending', 'in_progress', 'completed', 'cancelled'])
  })

  it('TRACKING_FREQUENCIES has 3 options', () => {
    expect(TRACKING_FREQUENCIES).toHaveLength(3)
    expect(TRACKING_FREQUENCIES.map(f => f.id)).toEqual(['daily', 'weekly', 'bi-weekly'])
  })
})
