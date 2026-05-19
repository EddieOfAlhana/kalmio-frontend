/**
 * Unit tests for filterPlans() — each filter chip value with sample inputs.
 */
import { describe, it, expect } from 'vitest'
import { filterPlans } from './planUtils'
import type { MultiMemberPlan } from '@/types'

function makePlan(id: string, startDate: string, endDate: string): MultiMemberPlan {
  return {
    id,
    name: `Plan ${id}`,
    plannerId: 'user-1',
    memberIds: ['user-1'],
    coPlannerIds: [],
    startDate,
    endDate,
    durationDays: 7,
    mealSlotsCovered: ['LUNCH', 'DINNER'],
    status: 'ACTIVE',
    shoppedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    meals: [],
  } as MultiMemberPlan
}

const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
const lastWeek = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10)
const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)

const activePlan   = makePlan('active',   yesterday, tomorrow)
const upcomingPlan = makePlan('upcoming', tomorrow,  nextWeek)
const pastPlan     = makePlan('past',     lastWeek,  yesterday)
const allPlans     = [activePlan, upcomingPlan, pastPlan]

describe('filterPlans', () => {
  it('filter=all returns all plans unchanged', () => {
    expect(filterPlans(allPlans, 'all')).toHaveLength(3)
  })

  it('filter=active returns plans spanning today', () => {
    const result = filterPlans(allPlans, 'active')
    const ids = result.map(p => p.id)
    expect(ids).toContain('active')
    expect(ids).not.toContain('past')
    expect(ids).not.toContain('upcoming')
  })

  it('filter=upcoming returns plans starting after today', () => {
    const result = filterPlans(allPlans, 'upcoming')
    const ids = result.map(p => p.id)
    expect(ids).toContain('upcoming')
    expect(ids).not.toContain('active')
    expect(ids).not.toContain('past')
  })

  it('filter=past returns plans ending before today', () => {
    const result = filterPlans(allPlans, 'past')
    const ids = result.map(p => p.id)
    expect(ids).toContain('past')
    expect(ids).not.toContain('active')
    expect(ids).not.toContain('upcoming')
  })

  it('returns empty array when no plans match filter', () => {
    expect(filterPlans([upcomingPlan, pastPlan], 'active')).toHaveLength(0)
  })

  it('returns empty array on empty input', () => {
    expect(filterPlans([], 'active')).toHaveLength(0)
    expect(filterPlans([], 'all')).toHaveLength(0)
  })
})
