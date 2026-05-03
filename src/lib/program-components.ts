import type { Program, ProgramComponent } from './api/types'

/**
 * Component-based program model.
 *
 * Each program declares which features ("components") are active via
 * `program.components: ProgramComponent[]`. The frontend renders tabs,
 * tiles, and counters based on this — never on tier/slug strings.
 *
 * Legacy fallback: if a program has no components array (not yet
 * backfilled by the backend), we infer them from the legacy
 * `tier === 'go_sessions'` / `slug === 'go-sessions-s1'` pattern so
 * existing programs keep working during the transition.
 */

type ProgramLike = Pick<Program, 'components' | 'slug' | 'tier'> | undefined | null

/**
 * Returns true if the given program has the named component active.
 * Falls back to legacy detection when `components` is missing or empty.
 */
export function hasComponent(
  program: ProgramLike,
  component: ProgramComponent
): boolean {
  if (!program) return false
  if (Array.isArray(program.components) && program.components.length > 0) {
    return program.components.includes(component)
  }
  return inferLegacyComponent(program, component)
}

/**
 * Returns the active component set for the program — explicit if set,
 * otherwise inferred from legacy tier/slug. Useful when several
 * components need to be checked together.
 */
export function getComponents(program: ProgramLike): Set<ProgramComponent> {
  if (!program) return new Set()
  if (Array.isArray(program.components) && program.components.length > 0) {
    return new Set(program.components)
  }
  const inferred: ProgramComponent[] = []
  if (isLegacyGoProgram(program)) {
    inferred.push('group_sessions', 'vitality_check')
  }
  return new Set(inferred)
}

function isLegacyGoProgram(program: { slug?: string; tier?: string }): boolean {
  return program.slug === 'go-sessions-s1' || program.tier === 'go_sessions'
}

function inferLegacyComponent(
  program: { slug?: string; tier?: string },
  component: ProgramComponent
): boolean {
  if (component === 'group_sessions' || component === 'vitality_check') {
    return isLegacyGoProgram(program)
  }
  return false
}
