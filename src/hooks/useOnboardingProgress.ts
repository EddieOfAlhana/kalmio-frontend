/**
 * useOnboardingProgress — KALMIO-167 / KALMIO-45
 *
 * Persists and retrieves the user's current onboarding step so that
 * returning visitors resume mid-flow rather than starting over.
 *
 * Also manages a "done" flag so the OnboardingGate knows not to re-redirect
 * users who have already completed or explicitly skipped the flow (KALMIO-45).
 *
 * Storage strategy: localStorage keyed by user ID.
 *   Key format (step):  kalmio_onboarding_step_<userId>
 *   Key format (done):  kalmio_onboarding_done_<userId>
 *
 * This hook is intentionally thin and storage-agnostic by design.
 * When a backend OnboardingProgress endpoint is available (future ticket),
 * the implementation can be swapped out here without touching any consumer.
 *
 * Rules:
 *   - Only client-only UI state lives in localStorage (acceptable per CLAUDE.md).
 *   - Product data that must survive cross-device belongs on the server.
 *     Onboarding step and done-flag are single-device client state; server
 *     persistence is opt-in later.
 *   - Returns step 1 (first step, 1-indexed) when no persisted state is found.
 */

const STORAGE_PREFIX = 'kalmio_onboarding_step_'
const DONE_PREFIX = 'kalmio_onboarding_done_'

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}

export function readOnboardingStep(userId: string): number {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (raw === null) return 1
    const parsed = parseInt(raw, 10)
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
  } catch {
    return 1
  }
}

export function writeOnboardingStep(userId: string, step: number): void {
  try {
    localStorage.setItem(storageKey(userId), String(step))
  } catch {
    // localStorage unavailable (private browsing quota, etc.) — silently ignore.
  }
}

export function clearOnboardingStep(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Done flag — tracks whether the user has completed or explicitly skipped
// the onboarding flow (KALMIO-45). The OnboardingGate reads this to avoid
// re-redirecting returning users.
// ---------------------------------------------------------------------------

function doneKey(userId: string): string {
  return `${DONE_PREFIX}${userId}`
}

/**
 * Returns true when the user has completed or explicitly skipped onboarding
 * on this device. Returns false when no flag is set (new user).
 */
export function readOnboardingDone(userId: string): boolean {
  try {
    return localStorage.getItem(doneKey(userId)) === '1'
  } catch {
    return false
  }
}

/**
 * Marks onboarding as done for this user on this device. Call both when the
 * user finishes the final step and when they explicitly skip.
 */
export function writeOnboardingDone(userId: string): void {
  try {
    localStorage.setItem(doneKey(userId), '1')
  } catch {
    // localStorage unavailable (private browsing quota, etc.) — silently ignore.
  }
}

/** Clears the done flag. Useful for testing or if the user resets their account. */
export function clearOnboardingDone(userId: string): void {
  try {
    localStorage.removeItem(doneKey(userId))
  } catch {
    // ignore
  }
}
