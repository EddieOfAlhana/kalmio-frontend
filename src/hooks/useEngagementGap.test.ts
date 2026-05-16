/**
 * Tests for useEngagementGap / bucketFromDays boundary conditions.
 *
 * bucketFromDays is the pure classification function — we test it directly.
 * All five bucket boundaries are covered:
 *
 *   ≤ 1   → 'none'
 *   2–3   → 'subtle'
 *   4–7   → 'context'
 *   8–14  → 'extended'
 *   ≥ 15  → 'returning'
 *
 * useEngagementGap itself reads/writes localStorage and returns the bucket,
 * so we exercise it with a simple localStorage stub for the "first visit"
 * and "subsequent visit" scenarios.
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { bucketFromDays, useEngagementGap } from './useEngagementGap'

// ──────────────────────────────────────────────────────────────────────────────
// bucketFromDays — pure unit tests (no browser APIs required)
// ──────────────────────────────────────────────────────────────────────────────

describe('bucketFromDays', () => {
  describe('none bucket (≤ 1 day)', () => {
    it('returns "none" for 0 days (same day)', () => {
      expect(bucketFromDays(0)).toBe('none')
    })

    it('returns "none" at the upper boundary of 1 day', () => {
      expect(bucketFromDays(1)).toBe('none')
    })
  })

  describe('subtle bucket (2–3 days)', () => {
    it('returns "subtle" at the lower boundary of 2 days', () => {
      expect(bucketFromDays(2)).toBe('subtle')
    })

    it('returns "subtle" at the upper boundary of 3 days', () => {
      expect(bucketFromDays(3)).toBe('subtle')
    })
  })

  describe('context bucket (4–7 days)', () => {
    it('returns "context" at the lower boundary of 4 days', () => {
      expect(bucketFromDays(4)).toBe('context')
    })

    it('returns "context" at the upper boundary of 7 days', () => {
      expect(bucketFromDays(7)).toBe('context')
    })
  })

  describe('extended bucket (8–14 days)', () => {
    it('returns "extended" at the lower boundary of 8 days', () => {
      expect(bucketFromDays(8)).toBe('extended')
    })

    it('returns "extended" at the upper boundary of 14 days', () => {
      expect(bucketFromDays(14)).toBe('extended')
    })
  })

  describe('returning bucket (≥ 15 days)', () => {
    it('returns "returning" at the lower boundary of 15 days', () => {
      expect(bucketFromDays(15)).toBe('returning')
    })

    it('returns "returning" well above the lower boundary (30 days)', () => {
      expect(bucketFromDays(30)).toBe('returning')
    })

    it('returns "returning" for a very large gap (365 days)', () => {
      expect(bucketFromDays(365)).toBe('returning')
    })
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// useEngagementGap — integration smoke tests with a localStorage stub
// ──────────────────────────────────────────────────────────────────────────────

/** Minimal synchronous localStorage stub (Node has none by default). */
function makeLocalStorageStub(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length },
  } as Storage
}

const LS_KEY = 'kalmio_last_active'

describe('useEngagementGap (with localStorage stub)', () => {
  let lsStub: Storage

  beforeEach(() => {
    lsStub = makeLocalStorageStub()
    vi.stubGlobal('localStorage', lsStub)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns "none" and writes today when no prior record exists', () => {
    const bucket = useEngagementGap()
    expect(bucket).toBe('none')
    // Hook must always persist today so the next visit can compute a gap
    expect(lsStub.getItem(LS_KEY)).toBeTruthy()
  })

  it('returns the correct bucket when last-active is seeded with a 10-day gap', () => {
    // Seed last-active to a date 10 days before today
    const past = new Date()
    past.setDate(past.getDate() - 10)
    const y = past.getFullYear()
    const m = String(past.getMonth() + 1).padStart(2, '0')
    const d = String(past.getDate()).padStart(2, '0')
    lsStub.setItem(LS_KEY, `${y}-${m}-${d}`)

    const bucket = useEngagementGap()
    expect(bucket).toBe('extended') // 10 days → 8–14 range
  })

  it('returns "none" when last-active equals today (same-day re-visit)', () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    lsStub.setItem(LS_KEY, `${y}-${m}-${d}`)

    const bucket = useEngagementGap()
    expect(bucket).toBe('none')
  })
})
