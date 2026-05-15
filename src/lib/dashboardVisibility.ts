import type { DashboardModuleId } from '@/types'

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
