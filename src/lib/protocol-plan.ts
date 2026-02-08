import type { ProtocolTemplate } from './api/hooks/useProtocols'
import type { PillarId } from './constants'

// ---------------------------------------------------------------------------
// Protocol-Goal linking convention
// ---------------------------------------------------------------------------
// Since the DB has no protocol_slug column on goals, we embed a tag in the
// goal description: [protocol:<slug>]. This lets us discover links client-side
// until the backend adds proper linking support.

const PROTOCOL_TAG_REGEX = /\[protocol:([^\]]+)\]/

/** Extract protocol slug from a goal description (returns null if none). */
export function getProtocolSlugFromGoal(description: string | null): string | null {
  if (!description) return null
  const match = description.match(PROTOCOL_TAG_REGEX)
  return match ? match[1] : null
}

/** Strip the protocol tag from a description for display purposes. */
export function stripProtocolTag(description: string | null): string {
  if (!description) return ''
  return description.replace(PROTOCOL_TAG_REGEX, '').trim()
}

/** Add (or replace) a protocol tag in a description. */
export function addProtocolTag(description: string, slug: string): string {
  const cleaned = stripProtocolTag(description)
  return cleaned ? `${cleaned}\n[protocol:${slug}]` : `[protocol:${slug}]`
}

// ---------------------------------------------------------------------------
// Plan generation types
// ---------------------------------------------------------------------------

export interface SuggestedActionItem {
  title: string
  description?: string
  priority: 'high' | 'medium' | 'low'
}

export interface SuggestedGoal {
  title: string
  description: string
  pillar_id?: PillarId
  target_date?: string
  actionItems: SuggestedActionItem[]
}

// ---------------------------------------------------------------------------
// Generate a plan from protocol template data
// ---------------------------------------------------------------------------

export function generatePlanFromProtocol(protocol: ProtocolTemplate): SuggestedGoal[] {
  const slug = protocol.slug
  const durationWeeks = protocol.duration_weeks || 8

  const mainGoal: SuggestedGoal = {
    title: `Complete: ${protocol.title}`,
    description: addProtocolTag(
      protocol.description || `Follow the ${protocol.title} protocol`,
      slug,
    ),
    pillar_id: protocol.pillar as PillarId | undefined,
    target_date: calculateTargetDate(durationWeeks),
    actionItems: [],
  }

  // Implementation steps → high/medium priority action items
  const steps = protocol.implementation_steps
  if (steps && steps.length > 0) {
    steps.forEach((step, i) => {
      mainGoal.actionItems.push({
        title: step.title,
        description: step.description,
        priority: i < 2 ? 'high' : 'medium',
      })
    })
  }

  // Protocol sections → action items from each section's items
  const sections = protocol.protocol_sections
  if (sections && sections.length > 0) {
    sections.forEach((section) => {
      if (!section.items || section.items.length === 0) return
      section.items.forEach((item) => {
        mainGoal.actionItems.push({
          title: item,
          description: `From: ${section.title}`,
          priority: 'medium',
        })
      })
    })
  }

  // Implementation guides → action items (with details as sub-items)
  const guides = protocol.implementation_guides
  if (guides && guides.length > 0) {
    guides.forEach((guide) => {
      if (guide.details && guide.details.length > 0) {
        guide.details.forEach((detail) => {
          mainGoal.actionItems.push({
            title: detail,
            description: `${guide.title}: ${guide.description}`,
            priority: 'medium',
          })
        })
      } else {
        mainGoal.actionItems.push({
          title: guide.title,
          description: guide.description,
          priority: 'medium',
        })
      }
    })
  }

  // Fallback: if the protocol has no structured data at all, create basics
  if (mainGoal.actionItems.length === 0) {
    mainGoal.actionItems.push(
      { title: 'Read through protocol overview', priority: 'high' },
      { title: 'Set up tracking method', priority: 'high' },
      { title: 'Complete week 1 activities', priority: 'medium' },
    )
  }

  return [mainGoal]
}

function calculateTargetDate(durationWeeks: number): string {
  const date = new Date()
  date.setDate(date.getDate() + durationWeeks * 7)
  return date.toISOString().split('T')[0]
}
