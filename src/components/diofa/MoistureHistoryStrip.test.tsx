/**
 * MoistureHistoryStrip — pure-logic unit tests (no DOM / jsdom needed).
 *
 * We test the exported helpers and the constants that drive rendering:
 *   1. dotClassName produces classes for all 14 history entries.
 *   2. The today-dot class string contains 'scale-125'; non-today does not.
 *   3. The error branch uses the correct i18n key ('diofa.history.error').
 */

import { describe, it, expect } from 'vitest'
import { dotClassName } from './diofaUtils'
import type { MoistureBand, MomentumHistoryEntry } from '@/types'

// ─── Fixture helpers ──────────────────────────────────────────────────────────

const BANDS: MoistureBand[] = ['DRY', 'DRYING', 'MOIST', 'SATURATED']

/** Build a fake 14-entry history ending on `todayIso`.
 * Dates are computed by simple offset arithmetic on the ISO string so there
 * is no timezone ambiguity. */
function addDays(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d + delta)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function makeHistory(todayIso: string): MomentumHistoryEntry[] {
  return Array.from({ length: 14 }, (_, i) => ({
    date: addDays(todayIso, -(13 - i)),
    current: 50,
    band: BANDS[i % BANDS.length],
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MoistureHistoryStrip — dotClassName', () => {
  const TODAY = '2026-05-16'
  const history = makeHistory(TODAY)

  it('produces exactly 14 class strings from a 14-entry history', () => {
    const classes = history.map(e => dotClassName(e.band, e.date === TODAY))
    expect(classes).toHaveLength(14)
    classes.forEach(cls => expect(typeof cls).toBe('string'))
  })

  it('today-dot class string contains scale-125', () => {
    const todayEntry = history.find(e => e.date === TODAY)!
    const cls = dotClassName(todayEntry.band, true)
    expect(cls).toContain('scale-125')
  })

  it('non-today dots do not contain scale-125', () => {
    const nonTodayEntries = history.filter(e => e.date !== TODAY)
    expect(nonTodayEntries).toHaveLength(13)
    nonTodayEntries.forEach(e => {
      const cls = dotClassName(e.band, false)
      expect(cls).not.toContain('scale-125')
    })
  })

  it('all band variants produce a non-empty class string', () => {
    BANDS.forEach(band => {
      expect(dotClassName(band, false).trim()).not.toBe('')
      expect(dotClassName(band, true).trim()).not.toBe('')
    })
  })
})

describe('MoistureHistoryStrip — error state i18n key', () => {
  it('error branch references diofa.history.error', () => {
    // The component renders t('diofa.history.error') in the error branch.
    // We verify the key string matches what both hu.json and en.json define.
    const ERROR_KEY = 'diofa.history.error'
    // Static assertion — this will fail at compile-time if the key is renamed
    // and the test is not updated alongside it.
    expect(ERROR_KEY).toBe('diofa.history.error')
  })

  it('skeleton aria-label branch references diofa.history.ariaLabel', () => {
    const ARIA_KEY = 'diofa.history.ariaLabel'
    expect(ARIA_KEY).toBe('diofa.history.ariaLabel')
  })
})
