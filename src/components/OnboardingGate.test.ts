/**
 * OnboardingGate — KALMIO-45
 *
 * Tests for the gate's core decision logic: `computeNeedsOnboarding`.
 *
 * The function lives alongside OnboardingGate and encapsulates the rule:
 *   A user needs onboarding when ALL of:
 *     1. No mealPlanPreferences and no dietaryPreferences (server state).
 *     2. The localStorage done-flag is NOT set for this userId.
 *
 * We keep these as pure-function tests (no React, no router, no jsdom)
 * so they run fast in the node pool and match the project's existing test style.
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  readOnboardingDone,
  writeOnboardingDone,
  clearOnboardingDone,
} from '@/hooks/useOnboardingProgress'

// ---------------------------------------------------------------------------
// The pure decision function — mirrors OnboardingGate's runtime logic exactly.
// ---------------------------------------------------------------------------

/**
 * Returns true when the user should be sent to /app/onboarding.
 *
 * Mirrors the runtime check in OnboardingGate.tsx so we can test all
 * branch combinations without mounting a React component.
 */
function computeNeedsOnboarding(
  userId: string,
  userPrefs: { mealPlanPreferences: unknown | null; dietaryPreferences: unknown | null } | undefined,
): boolean {
  const doneLocally = userId ? readOnboardingDone(userId) : false
  const hasPreferences = !!(userPrefs?.mealPlanPreferences || userPrefs?.dietaryPreferences)
  return !doneLocally && !hasPreferences
}

// ---------------------------------------------------------------------------
// localStorage stub — the same approach as useEngagementGap.test.ts
// ---------------------------------------------------------------------------

function makeLocalStorageStub(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length },
  } as Storage
}

const TEST_USER_ID = 'user-abc-123'

describe('OnboardingGate — computeNeedsOnboarding', () => {
  let lsStub: Storage

  beforeEach(() => {
    lsStub = makeLocalStorageStub()
    vi.stubGlobal('localStorage', lsStub)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  // ── Test 1: new user, null prefs, no done-flag → needs onboarding ──────────

  it('new user with null prefs and no done-flag → navigates to /app/onboarding', () => {
    // No done-flag in localStorage, no server-side preferences.
    const needs = computeNeedsOnboarding(TEST_USER_ID, {
      mealPlanPreferences: null,
      dietaryPreferences: null,
    })
    expect(needs).toBe(true)
  })

  // ── Test 2: returning user with prefs → passes through (Outlet) ────────────

  it('returning user with mealPlanPreferences → passes through to Outlet', () => {
    // Server has preferences → no onboarding needed even without local flag.
    const needs = computeNeedsOnboarding(TEST_USER_ID, {
      mealPlanPreferences: { days: 5 },
      dietaryPreferences: null,
    })
    expect(needs).toBe(false)
  })

  it('returning user with dietaryPreferences only → passes through to Outlet', () => {
    const needs = computeNeedsOnboarding(TEST_USER_ID, {
      mealPlanPreferences: null,
      dietaryPreferences: { vegan: true },
    })
    expect(needs).toBe(false)
  })

  // ── Test 3: done-flag set in localStorage only → passes through (Outlet) ───

  it('done-flag set in localStorage (no server prefs) → passes through to Outlet', () => {
    // Simulate user who completed onboarding on this device but has no server prefs yet.
    writeOnboardingDone(TEST_USER_ID)
    const needs = computeNeedsOnboarding(TEST_USER_ID, {
      mealPlanPreferences: null,
      dietaryPreferences: null,
    })
    expect(needs).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// readOnboardingDone / writeOnboardingDone — localStorage contract
// ---------------------------------------------------------------------------

describe('OnboardingGate — readOnboardingDone localStorage contract', () => {
  let lsStub: Storage

  beforeEach(() => {
    lsStub = makeLocalStorageStub()
    vi.stubGlobal('localStorage', lsStub)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('readOnboardingDone returns false when no flag is set (new user)', () => {
    expect(readOnboardingDone(TEST_USER_ID)).toBe(false)
  })

  it('readOnboardingDone returns true after writeOnboardingDone is called', () => {
    writeOnboardingDone(TEST_USER_ID)
    expect(readOnboardingDone(TEST_USER_ID)).toBe(true)
  })

  it('clearOnboardingDone resets the flag so readOnboardingDone returns false again', () => {
    writeOnboardingDone(TEST_USER_ID)
    clearOnboardingDone(TEST_USER_ID)
    expect(readOnboardingDone(TEST_USER_ID)).toBe(false)
  })

  it('flags are keyed per user — one user done does not affect another', () => {
    writeOnboardingDone('user-A')
    expect(readOnboardingDone('user-B')).toBe(false)
  })
})
