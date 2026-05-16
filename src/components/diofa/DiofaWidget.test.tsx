import { describe, it, expect } from 'vitest'
import { getMoistureClass } from './diofaUtils'
import type { DiofaMoisture } from './DiofaWidget'

describe('getMoistureClass', () => {
  const cases: Array<[DiofaMoisture, string]> = [
    ['WET', 'diofa-wet'],
    ['DRY', 'diofa-dry'],
    ['OK',  'diofa-ok'],
  ]

  it.each(cases)('moisture=%s → CSS class "%s"', (moisture, expected) => {
    expect(getMoistureClass(moisture)).toBe(expected)
  })

  it('returns diofa-wet for WET (leaf-rustle animation is active)', () => {
    expect(getMoistureClass('WET')).toBe('diofa-wet')
  })

  it('returns diofa-dry for DRY (crack overlay is visible, no animation)', () => {
    expect(getMoistureClass('DRY')).toBe('diofa-dry')
  })

  it('returns diofa-ok for OK (neutral state, no special animation)', () => {
    expect(getMoistureClass('OK')).toBe('diofa-ok')
  })
})
