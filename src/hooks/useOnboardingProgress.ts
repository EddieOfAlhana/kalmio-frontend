/**
 * useOnboardingProgress — KALMIO-167
 *
 * Persists and retrieves the user's current onboarding step so that
 * returning visitors resume mid-flow rather than starting over.
 *
 * Storage strategy: localStorage keyed by user ID.
 *   Key format: kalmio_onboarding_step_<userId>
 *
 * This hook is intentionally thin and storage-agnostic by design.
 * When a backend OnboardingProgress endpoint is available (future ticket),
 * the implementation can be swapped out here without touching any consumer.
 *
 * Rules:
 *   - Only client-only UI state lives in localStorage (acceptable per CLAUDE.md).
 *   - Product data that must survive cross-device belongs on the server.
 *     Onboarding step is single-device client state; server persistence is opt-in later.
 *   - Returns step 1 (first step, 1-indexed) when no persisted state is found.
 */

const STORAGE_PREFIX = 'kalmio_onboarding_step_'

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
