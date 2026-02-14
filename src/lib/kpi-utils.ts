/**
 * KPI progress utilities — handles both increasing and decreasing goals.
 *
 * Increasing goal example: bench press 60 kg → 100 kg (target > current)
 * Decreasing goal example: body weight 82 kg → 78 kg (target < current)
 */

/** Returns true when the KPI has reached or surpassed its target. */
export function isKpiOnTarget(current: number, target: number): boolean {
  if (target === 0) return false
  // Decreasing goal: on target when current has dropped to or below target
  if (target < current) return false
  // Increasing goal (or already equal)
  return current >= target
}

/**
 * Calculate a 0–100 progress percentage for a KPI.
 *
 * For *increasing* goals (target >= current at creation), progress is
 * `(current / target) * 100`.
 *
 * For *decreasing* goals (target < current), we use proximity-to-target:
 * `(target / current) * 100`. This smoothly approaches 100 % as `current`
 * converges toward `target`, even without a stored starting value.
 */
export function calculateKpiProgress(current: number, target: number): number {
  if (target <= 0) return 0
  if (current <= 0) return 0

  if (current <= target) {
    // Increasing goal OR already at/past target
    return Math.min(100, Math.round((current / target) * 100))
  }

  // Decreasing goal — current is still above target
  return Math.min(100, Math.round((target / current) * 100))
}
