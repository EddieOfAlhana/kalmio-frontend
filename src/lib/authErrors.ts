/**
 * Maps a Supabase AuthError (or any Error) to a stable i18n key
 * under the `auth.errors.*` namespace.
 *
 * Matching strategy:
 *   1. HTTP status 429 → rateLimited
 *   2. HTTP status 400 with "signup" in message → signupsDisabled
 *   3. HTTP status 400 → invalidEmail (the most common 400 is a bad/blocked address)
 *   4. Network failures (no status, or fetch/network error message) → network
 *   5. Everything else → generic
 */

interface AuthLike {
  /** Supabase AuthError carries a numeric HTTP status */
  status?: number
  message?: string
  name?: string
}

export function mapAuthError(error: AuthLike | Error | unknown): string {
  const err = error as AuthLike

  const status = err?.status
  const message = (err?.message ?? '').toLowerCase()
  const name = (err?.name ?? '').toLowerCase()

  if (status === 429) return 'auth.errors.rateLimited'

  if (status === 400) {
    if (message.includes('signup') || message.includes('sign up') || message.includes('signups')) {
      return 'auth.errors.signupsDisabled'
    }
    return 'auth.errors.invalidEmail'
  }

  // Network-level failures: fetch exceptions, offline, CORS
  if (
    status === undefined ||
    name === 'networkerror' ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('offline')
  ) {
    return 'auth.errors.network'
  }

  return 'auth.errors.generic'
}
