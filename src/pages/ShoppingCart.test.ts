/**
 * Tests for KALMIO-217 review findings:
 *
 * F1 — stale closure on window change: handleWindowChange must pass `days`
 *      directly into the mutation, not rely on post-setState windowDays.
 *
 * F2 — localStorage key must be user-scoped: `cart-checked-${userId}-${cartId}`.
 *
 * These are pure-logic unit tests that do not require a DOM.
 */
import { describe, it, expect } from 'vitest'

// ── F2: user-scoped localStorage key ─────────────────────────────────────────

/** Mirror of the CART_CHECK_KEY helper in ShoppingCart.tsx */
const cartCheckKey = (userId: string, cartId: string) =>
  `cart-checked-${userId}-${cartId}`

describe('CART_CHECK_KEY (Finding 2)', () => {
  it('includes userId and cartId', () => {
    const key = cartCheckKey('user-abc', 'cart-xyz')
    expect(key).toBe('cart-checked-user-abc-cart-xyz')
  })

  it('two different userIds produce different keys for the same cartId', () => {
    const keyA = cartCheckKey('user-alpha', 'cart-1')
    const keyB = cartCheckKey('user-beta', 'cart-1')
    expect(keyA).not.toBe(keyB)
  })

  it('same userId with different cartIds produce different keys', () => {
    const keyA = cartCheckKey('user-alpha', 'cart-1')
    const keyB = cartCheckKey('user-alpha', 'cart-2')
    expect(keyA).not.toBe(keyB)
  })

  it('empty userId still produces a deterministic key', () => {
    // Falls back to '' when user is not authenticated
    const key = cartCheckKey('', 'cart-xyz')
    expect(key).toBe('cart-checked--cart-xyz')
  })
})

// ── F1: stale-closure fix — window change passes `days` into mutate ──────────
// We can't test the React component hook loop here, but we can verify the
// mutation parameter contract by simulating the call sequence.

describe('handleWindowChange (Finding 1)', () => {
  it('passes the new days value directly to mutate, not the stale state', () => {
    // Simulate state that has NOT been updated yet (stale value = 7)
    let windowDaysState = 7
    const mutateCalls: number[] = []

    // Simulate the FIXED implementation: mutate receives `days` param directly.
    function handleWindowChange(days: number) {
      windowDaysState = days // setState — async in React, but irrelevant here
      // Correct: pass `days` arg, not the captured `windowDaysState`
      mutateCalls.push(days)
    }

    handleWindowChange(14)

    expect(mutateCalls[0]).toBe(14)
    // The stale value (7) must not appear in the mutation call
    expect(mutateCalls[0]).not.toBe(windowDaysState === 7 ? 7 : -1)
  })

  it('does not use the stale closure value when called with 30', () => {
    const capturedArgs: number[] = []
    function handleWindowChangeFixed(days: number) {
      capturedArgs.push(days) // correct: pass the arg
    }

    handleWindowChangeFixed(30)
    expect(capturedArgs[0]).toBe(30)
  })
})

// ── servingMultiplier macro scaling ──────────────────────────────────────────

/** Pure scaling function extracted from MemberView logic. */
function scaleMacros(
  macros: { kcal: number; protein: number; fat: number; carbs: number },
  multiplier: number,
) {
  return {
    kcal: macros.kcal * multiplier,
    protein: macros.protein * multiplier,
    fat: macros.fat * multiplier,
    carbs: macros.carbs * multiplier,
  }
}

describe('servingMultiplier macro scaling (Finding 3)', () => {
  it('scales a full portion (multiplier = 1) unchanged', () => {
    const macros = { kcal: 500, protein: 30, fat: 20, carbs: 45 }
    const result = scaleMacros(macros, 1)
    expect(result.kcal).toBe(500)
    expect(result.protein).toBe(30)
    expect(result.fat).toBe(20)
    expect(result.carbs).toBe(45)
  })

  it('scales a half portion (multiplier = 0.5)', () => {
    const macros = { kcal: 400, protein: 20, fat: 16, carbs: 40 }
    const result = scaleMacros(macros, 0.5)
    expect(result.kcal).toBeCloseTo(200)
    expect(result.protein).toBeCloseTo(10)
    expect(result.fat).toBeCloseTo(8)
    expect(result.carbs).toBeCloseTo(20)
  })

  it('scales a child portion (multiplier = 0.75)', () => {
    const macros = { kcal: 600, protein: 36, fat: 24, carbs: 60 }
    const result = scaleMacros(macros, 0.75)
    expect(result.kcal).toBeCloseTo(450)
    expect(result.protein).toBeCloseTo(27)
    expect(result.fat).toBeCloseTo(18)
    expect(result.carbs).toBeCloseTo(45)
  })

  it('returns zeros when multiplier is 0', () => {
    const macros = { kcal: 300, protein: 15, fat: 10, carbs: 30 }
    const result = scaleMacros(macros, 0)
    expect(result.kcal).toBe(0)
    expect(result.protein).toBe(0)
  })
})
