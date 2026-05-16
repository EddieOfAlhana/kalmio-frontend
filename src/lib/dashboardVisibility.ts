import type { DashboardModuleId, UserStageValue } from '@/types'

/**
 * Returns true when the module should be shown.
 * Falls back to visible when visibleModules is undefined
 * (backend not yet deployed / degraded).
 */
export function isVisible(
  moduleId: DashboardModuleId,
  visibleModules: DashboardModuleId[] | undefined,
): boolean {
  if (visibleModules === undefined) return true
  return visibleModules.includes(moduleId)
}

/**
 * Canonical mapping from each dashboard module to the earliest stage at which
 * it becomes visible. Derived from gamification-progression.md §5.
 *
 * Used by LockedModulePlaceholder to surface the "unlocks at {stage}" hint.
 * Keep this in sync with the backend DashboardStateService module-visibility rules.
 */
export const MODULE_UNLOCK_STAGE: Record<DashboardModuleId, UserStageValue> = {
  'current-plan':    'CSEMETE',
  'shopping-list':   'CSEMETE',
  'fridge-basic':    'CSEMETE',
  'diofa-widget':    'CSEMETE',
  'points-counter':  'CSEMETE',
  'prep-tasks':      'SUHANG',
  'grooming-prompt': 'SUHANG',
  'replan-diff':     'SUHANG',
  'weekly-summary':  'SUHANG',
  'off-plan-meals':  'FIATAL',
  'macro-tracker':   'FIATAL',
  'taste-signals':   'FIATAL',
  'achievements':    'FIATAL',
}
