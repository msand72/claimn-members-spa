import { describe, it, expect, vi, afterEach } from 'vitest'
import { meetsTierRequirement } from './useSubscription'
import type { SubscriptionTier } from '../types'

/**
 * THE MEMBER-LOCKOUT GUARD.
 *
 * A paying member whose tier read 'membership' was shown an upgrade wall telling
 * them to buy what they had already bought. The mechanism was one bare object
 * index: TIER_LEVELS['membership'] is undefined, and `undefined >= n` is FALSE
 * FOR EVERY n INCLUDING 0 — so the check failed for every tier, not only premium
 * ones, with no error, no log and no 403.
 *
 * These tests fail if either half regresses: the vocabulary, or the silent
 * undefined comparison that made an unknown word catastrophic rather than merely
 * wrong.
 */
describe('subscription tier vocabulary', () => {
  afterEach(() => vi.restoreAllMocks())

  // The two spellings are ONE tier. Both must behave identically everywhere,
  // because during the rename either can legitimately arrive on the wire.
  it('treats membership and brotherhood as the same rank', () => {
    const required: SubscriptionTier[] = ['none', 'brotherhood', 'membership', 'coaching', 'programs']
    for (const r of required) {
      expect(meetsTierRequirement('membership', r)).toBe(meetsTierRequirement('brotherhood', r))
    }
    for (const u of required) {
      expect(meetsTierRequirement(u, 'membership')).toBe(meetsTierRequirement(u, 'brotherhood'))
    }
  })

  // The exact customer-facing symptom.
  it('does not wall a membership subscriber out of their own tier', () => {
    expect(meetsTierRequirement('membership', 'membership')).toBe(true)
    expect(meetsTierRequirement('membership', 'brotherhood')).toBe(true)
    expect(meetsTierRequirement('membership', 'none')).toBe(true)
  })

  // It must still be a real gate — a fix that let everyone through would pass
  // the two tests above and be worse than the bug.
  it('still withholds higher tiers', () => {
    expect(meetsTierRequirement('membership', 'coaching')).toBe(false)
    expect(meetsTierRequirement('membership', 'programs')).toBe(false)
    expect(meetsTierRequirement('coaching', 'programs')).toBe(false)
    expect(meetsTierRequirement('none', 'membership')).toBe(false)
  })

  // Ordering is unchanged by the addition.
  it('keeps the existing hierarchy intact', () => {
    expect(meetsTierRequirement('programs', 'coaching')).toBe(true)
    expect(meetsTierRequirement('coaching', 'brotherhood')).toBe(true)
    expect(meetsTierRequirement('none', 'none')).toBe(true)
  })

  // 🚨 THE DURABLE HALF. The next unknown word must NOT repeat this silently.
  it('reports an unknown tier instead of failing every check in silence', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const unknown = 'fellowship' as SubscriptionTier

    // free content still reachable — the old code returned false even here
    expect(meetsTierRequirement(unknown, 'none')).toBe(true)
    // premium still withheld: entitlement genuinely cannot be verified
    expect(meetsTierRequirement(unknown, 'coaching')).toBe(false)

    expect(spy).toHaveBeenCalled()
    expect(String(spy.mock.calls[0]?.[0])).toContain('fellowship')
  })
})
