/**
 * Utilities for the first-plan reveal guard (KALMIO-157).
 * Kept in lib/ so FirstPlanReveal.tsx only exports React components.
 */

const LOCAL_STORAGE_KEY = 'kalmio:firstPlanRevealShown'

/** Returns true if the first-plan reveal has already been shown to this user. */
export function hasRevealBeenShown(): boolean {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Marks the reveal as shown so it is never displayed again. */
export function markRevealShown(): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true')
  } catch {
    // localStorage unavailable (private browsing, storage quota) — fail silently.
  }
}
