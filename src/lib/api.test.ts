/**
 * Unit tests for the 401 response-interceptor handler extracted from api.ts.
 *
 * We test the exported `_handle401` / `_resetHandling401` functions rather than
 * poking the Axios interceptor directly, which keeps the tests focused on
 * business logic rather than Axios internals.
 *
 * The test environment is Node (no jsdom). `window` is stubbed via
 * `globalThis` before each test so the handler can read `.location.pathname`.
 *
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Module mocks — must be hoisted before the import under test ───────────────

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
  waitForAuthInit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/components/ui/toast', () => ({
  toast: vi.fn(),
}))

// ── Import the modules under test after mocks are wired ───────────────────────

import { _handle401, _resetHandling401 } from './api'
import { supabase } from './supabase'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/ui/toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

type MockedFn = ReturnType<typeof vi.fn>

const mockSignOut = supabase.auth.signOut as MockedFn
const mockGetState = useAuthStore.getState as MockedFn
const mockToast = toast as MockedFn

/** Build a minimal Zustand auth-state snapshot for getState(). */
function fakeState(opts: { session?: object | null; impersonationToken?: string | null } = {}) {
  const { session = null, impersonationToken = null } = opts
  return {
    session,
    impersonationToken,
    setSession: vi.fn(),
  }
}

/** Install a fake window.location on globalThis for the duration of a test. */
function mockWindowLocation(pathname: string, search = '') {
  const replaceFn = vi.fn()
  ;(globalThis as Record<string, unknown>).window = {
    location: {
      pathname,
      search,
      replace: replaceFn,
    },
  }
  return replaceFn
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset the in-module `_isHandling401` flag before every test.
  _resetHandling401()

  vi.clearAllMocks()

  // Default: the user is on a protected page.
  mockWindowLocation('/app/dashboard')

  // Fast-forward fake timers so setTimeout inside the handler resolves quickly.
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  // Remove the window stub.
  delete (globalThis as Record<string, unknown>).window
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('_handle401 — hadSession gate', () => {
  it('fires toast when a session is active', async () => {
    mockGetState.mockReturnValue(fakeState({ session: { access_token: 'abc' } }))

    const promise = _handle401()
    await vi.runAllTimersAsync()
    await promise

    expect(mockToast).toHaveBeenCalledOnce()
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' }),
    )
  })

  it('fires toast when an impersonation token is active (no regular session)', async () => {
    mockGetState.mockReturnValue(fakeState({ session: null, impersonationToken: 'imp-token' }))

    const promise = _handle401()
    await vi.runAllTimersAsync()
    await promise

    expect(mockToast).toHaveBeenCalledOnce()
  })

  it('skips toast when no session and no impersonation token exist', async () => {
    mockGetState.mockReturnValue(fakeState({ session: null, impersonationToken: null }))

    const promise = _handle401()
    await vi.runAllTimersAsync()
    await promise

    expect(mockToast).not.toHaveBeenCalled()
  })

  it('still calls signOut and redirect even without a session', async () => {
    const replaceFn = mockWindowLocation('/app/dashboard')
    mockGetState.mockReturnValue(fakeState())

    const promise = _handle401()
    await vi.runAllTimersAsync()
    await promise

    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(replaceFn).toHaveBeenCalledWith(expect.stringContaining('/auth'))
  })
})

describe('_handle401 — _isHandling401 concurrency guard', () => {
  it('does not fire toast or redirect a second time when already handling', async () => {
    mockGetState.mockReturnValue(fakeState({ session: { access_token: 'abc' } }))

    // First call starts the handling cycle. Do NOT advance timers yet —
    // the flag must still be set when the second call arrives.
    const first = _handle401()
    // Second concurrent 401 — flag is already true.
    const secondResult = await _handle401()

    expect(secondResult).toBe(false)

    // Now resolve the first call.
    await vi.runAllTimersAsync()
    await first

    // toast and redirect must have fired exactly once despite two concurrent 401s.
    expect(mockToast).toHaveBeenCalledOnce()
    expect(window.location.replace).toHaveBeenCalledOnce()
  })

  it('returns false from the second concurrent call', async () => {
    mockGetState.mockReturnValue(fakeState({ session: { access_token: 'abc' } }))

    const first = _handle401()
    const second = _handle401()

    await vi.runAllTimersAsync()
    const [, secondResult] = await Promise.all([first, second])

    expect(secondResult).toBe(false)
  })
})

describe('_handle401 — /auth pathname bypass', () => {
  it('skips redirect and toast entirely when already on /auth', async () => {
    mockWindowLocation('/auth')
    mockGetState.mockReturnValue(fakeState({ session: { access_token: 'abc' } }))

    const result = await _handle401()

    expect(result).toBe(false)
    expect(mockToast).not.toHaveBeenCalled()
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('skips when on /auth sub-path (e.g. /auth/callback)', async () => {
    mockWindowLocation('/auth/callback')
    mockGetState.mockReturnValue(fakeState({ session: { access_token: 'abc' } }))

    const result = await _handle401()

    expect(result).toBe(false)
    expect(mockToast).not.toHaveBeenCalled()
  })

  it('does NOT skip when on a non-/auth path that merely contains "auth" in the middle', async () => {
    mockWindowLocation('/app/reauthorize')
    mockGetState.mockReturnValue(fakeState({ session: null }))

    const promise = _handle401()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe(true)
    expect(mockSignOut).toHaveBeenCalledOnce()
  })
})
