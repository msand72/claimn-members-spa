import type { Program, ProgramComponent } from './api/types'

/**
 * Component-based program model.
 *
 * Each program declares which features ("components") are active via
 * `program.components: ProgramComponent[]`. The frontend renders tabs,
 * tiles, and counters based on this — never on tier/slug strings.
 *
 * The backend always populates `components` (backfilled in server-infra
 * commit f66fa74). No legacy fallback needed — if `components` is
 * missing or empty, the program has no active features.
 */

type ProgramLike = Pick<Program, 'components'> | undefined | null

/**
 * Returns true if the given program has the named component active.
 */
export function hasComponent(
  program: ProgramLike,
  component: ProgramComponent
): boolean {
  if (!program || !Array.isArray(program.components)) return false
  return program.components.includes(component)
}

/**
 * Returns the active component set for the program.
 */
export function getComponents(program: ProgramLike): Set<ProgramComponent> {
  if (!program || !Array.isArray(program.components)) return new Set()
  return new Set(program.components)
}
