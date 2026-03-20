import type { Sprint } from '../../lib/api/types'

export function computeSprintStatus(sprint: Sprint): 'upcoming' | 'active' | 'completed' {
  if (sprint.status) return sprint.status
  const now = new Date()
  if (sprint.end_date && new Date(sprint.end_date) < now) return 'completed'
  if (sprint.start_date && new Date(sprint.start_date) <= now) {
    if (!sprint.end_date || new Date(sprint.end_date) >= now) return 'active'
    return 'completed'
  }
  return 'upcoming'
}
