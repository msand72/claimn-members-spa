import { describe, it, expect } from 'vitest'
import {
  getProtocolSlugFromGoal,
  stripProtocolTag,
  addProtocolTag,
  generatePlanFromProtocol,
} from './protocol-plan'
import type { ProtocolTemplate } from './api/types'

describe('getProtocolSlugFromGoal', () => {
  it('extracts slug from description', () => {
    expect(getProtocolSlugFromGoal('My goal [protocol:sleep-reset]')).toBe('sleep-reset')
  })

  it('extracts slug with complex name', () => {
    expect(getProtocolSlugFromGoal('Goal text [protocol:morning-routine-v2]')).toBe('morning-routine-v2')
  })

  it('returns null when no tag', () => {
    expect(getProtocolSlugFromGoal('Plain description')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(getProtocolSlugFromGoal(null)).toBeNull()
  })
})

describe('stripProtocolTag', () => {
  it('removes protocol tag', () => {
    expect(stripProtocolTag('My goal [protocol:sleep-reset]')).toBe('My goal')
  })

  it('handles no tag', () => {
    expect(stripProtocolTag('No tag here')).toBe('No tag here')
  })

  it('handles null', () => {
    expect(stripProtocolTag(null)).toBe('')
  })
})

describe('addProtocolTag', () => {
  it('adds tag to description', () => {
    expect(addProtocolTag('My goal', 'sleep-reset')).toBe('My goal\n[protocol:sleep-reset]')
  })

  it('replaces existing tag', () => {
    expect(addProtocolTag('Goal [protocol:old-slug]', 'new-slug')).toBe('Goal\n[protocol:new-slug]')
  })

  it('handles empty description', () => {
    expect(addProtocolTag('', 'slug')).toBe('[protocol:slug]')
  })
})

describe('generatePlanFromProtocol', () => {
  const baseProtocol = {
    slug: 'test-protocol',
    title: 'Test Protocol',
    description: 'A test protocol',
    pillar: 'physical',
    duration_weeks: 4,
    implementation_steps: [],
    protocol_sections: [],
    implementation_guides: [],
  } as ProtocolTemplate

  it('creates a goal with protocol tag', () => {
    const goals = generatePlanFromProtocol(baseProtocol)
    expect(goals).toHaveLength(1)
    expect(goals[0].title).toBe('Complete: Test Protocol')
    expect(goals[0].description).toContain('[protocol:test-protocol]')
    expect(goals[0].pillar_id).toBe('physical')
  })

  it('creates action items from implementation steps', () => {
    const protocol = {
      ...baseProtocol,
      implementation_steps: [
        { step: 1, title: 'Step 1', description: 'First step' },
        { step: 2, title: 'Step 2', description: 'Second step' },
        { step: 3, title: 'Step 3', description: 'Third step' },
      ],
    }
    const goals = generatePlanFromProtocol(protocol)
    expect(goals[0].actionItems).toHaveLength(3)
    expect(goals[0].actionItems[0].priority).toBe('high')
    expect(goals[0].actionItems[1].priority).toBe('high')
    expect(goals[0].actionItems[2].priority).toBe('medium')
  })

  it('creates action items from sections', () => {
    const protocol = {
      ...baseProtocol,
      protocol_sections: [
        { id: 'sec-a', title: 'Section A', items: ['Item 1', 'Item 2'] },
      ],
    }
    const goals = generatePlanFromProtocol(protocol)
    expect(goals[0].actionItems).toHaveLength(2)
    expect(goals[0].actionItems[0].title).toBe('Item 1')
    expect(goals[0].actionItems[0].description).toBe('From: Section A')
  })

  it('provides fallback action items when no structured data', () => {
    const goals = generatePlanFromProtocol(baseProtocol)
    expect(goals[0].actionItems.length).toBeGreaterThan(0)
    expect(goals[0].actionItems[0].title).toBe('Read through protocol overview')
  })

  it('calculates target date from duration', () => {
    const goals = generatePlanFromProtocol(baseProtocol)
    expect(goals[0].target_date).toBeDefined()
    const targetDate = new Date(goals[0].target_date!)
    const now = new Date()
    const diffDays = Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBeGreaterThanOrEqual(27) // ~4 weeks
    expect(diffDays).toBeLessThanOrEqual(29)
  })
})
