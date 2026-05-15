import { describe, it, expect } from 'vitest'
import { formatLocalDate } from './utils'

describe('formatLocalDate', () => {
  const isoDate = '2025-06-15T10:30:00.000Z'

  it('formats a Date object in hu-HU locale when lang=hu', () => {
    const result = formatLocalDate(new Date(isoDate), 'hu')
    // hu-HU numeric date must contain '2025' and some form of '15'
    expect(result).toContain('2025')
    expect(result).toMatch(/15/)
  })

  it('formats a Date object in en-GB locale when lang=en', () => {
    const result = formatLocalDate(new Date(isoDate), 'en')
    expect(result).toContain('2025')
    expect(result).toMatch(/15/)
  })

  it('accepts an ISO string input and produces the same output as an equivalent Date', () => {
    const fromString = formatLocalDate(isoDate, 'hu')
    const fromDate = formatLocalDate(new Date(isoDate), 'hu')
    expect(fromString).toBe(fromDate)
  })

  it('returns — for an invalid date string', () => {
    expect(formatLocalDate('not-a-date', 'hu')).toBe('—')
  })

  it('returns — for an invalid Date object', () => {
    expect(formatLocalDate(new Date('invalid'), 'en')).toBe('—')
  })

  it('accepts both dateStyle and timeStyle options without throwing (FeedbackPanel use-case)', () => {
    // This combination would throw TypeError on toLocaleDateString; toLocaleString handles it fine.
    expect(() =>
      formatLocalDate(new Date(isoDate), 'hu', { dateStyle: 'short', timeStyle: 'short' }),
    ).not.toThrow()
  })

  it('includes time portion when timeStyle is provided', () => {
    const result = formatLocalDate(new Date(isoDate), 'en', { dateStyle: 'short', timeStyle: 'short' })
    // A result with timeStyle must be longer than a date-only result
    const dateOnly = formatLocalDate(new Date(isoDate), 'en')
    expect(result.length).toBeGreaterThan(dateOnly.length)
  })
})
