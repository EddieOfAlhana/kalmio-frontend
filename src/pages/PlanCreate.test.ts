/**
 * Unit tests for generatePlanName() — auto-name logic for date-range inputs.
 */
import { describe, it, expect } from 'vitest'
import { generatePlanName } from './planUtils'

// Minimal t() stub that mimics what the real i18next would return
function t(key: string, opts?: Record<string, unknown>): string {
  if (key === 'plan.wizard.autoName') return `${opts?.date} — terv`
  if (key === 'plan.wizard.autoNameFamily') return `${opts?.date} — közös terv`
  return key
}

describe('generatePlanName', () => {
  it('returns empty string when startDate is empty', () => {
    expect(generatePlanName(['Anna'], '', t)).toBe('')
  })

  it('uses autoName (not family) for a single member', () => {
    const result = generatePlanName(['Anna'], '2026-06-01', t)
    expect(result).toContain('terv')
    expect(result).not.toContain('közös')
  })

  it('uses autoNameFamily for two members', () => {
    const result = generatePlanName(['Anna', 'Béla'], '2026-06-01', t)
    expect(result).toContain('közös terv')
  })

  it('uses autoNameFamily for three members', () => {
    const result = generatePlanName(['Anna', 'Béla', 'Csaba'], '2026-06-01', t)
    expect(result).toContain('közös terv')
  })

  it('uses autoName for zero members', () => {
    // Zero members: the function falls through to the autoName path
    const result = generatePlanName([], '2026-06-15', t)
    expect(result).toContain('terv')
    expect(result).not.toContain('közös')
  })

  it('includes a date string in the output', () => {
    const result = generatePlanName(['Anna'], '2026-06-15', t)
    expect(result.length).toBeGreaterThan(5)
  })
})
