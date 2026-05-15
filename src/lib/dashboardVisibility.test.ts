import { describe, it, expect } from 'vitest'
import { isVisible } from './dashboardVisibility'
import type { DashboardModuleId } from '@/types'

describe('isVisible', () => {
  it('returns true when visibleModules is undefined (fallback)', () => {
    expect(isVisible('current-plan', undefined)).toBe(true)
  })

  it('returns true when moduleId is in visibleModules', () => {
    const modules: DashboardModuleId[] = ['current-plan', 'weekly-summary']
    expect(isVisible('current-plan', modules)).toBe(true)
  })

  it('returns false when moduleId is not in visibleModules', () => {
    const modules: DashboardModuleId[] = ['current-plan', 'weekly-summary']
    expect(isVisible('shopping-list', modules)).toBe(false)
  })

  it('returns false when visibleModules is empty', () => {
    expect(isVisible('current-plan', [])).toBe(false)
  })
})
