/**
 * Maps a Supabase AuthError (or any Error) to a stable i18n key
 * under the `auth.errors.*` namespace.
 *
 * Matching strategy:
 *   1. HTTP status 429 → rateLimited
 *   2. HTTP status 400 with "signup" in message → signupsDisabled
 *   3. HTTP status 400 with test-domain phrase ("example.com") → testDomainBlocked
 *   4. HTTP status 400 with "invalid email" / "is invalid" → invalidEmailFormat
 *   5. HTTP status 400 (fallback) → invalidEmail
 *   6. Network failures (no status, or fetch/network error message) → network
 *   7. Everything else → generic
 */

interface AuthLike {
  /** Supabase AuthError carries a numeric HTTP status */
  status?: number
  message?: string
  name?: string
}

/** Phrases Supabase emits when a test domain (e.g. example.com) is blocked. */
const TEST_DOMAIN_PHRASES = ['example.com', 'disposable', 'test domain', 'blocked domain']

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

    if (TEST_DOMAIN_PHRASES.some((phrase) => message.includes(phrase))) {
      return 'auth.errors.testDomainBlocked'
    }

    if (message.includes('invalid email') || message.includes('is invalid')) {
      return 'auth.errors.invalidEmailFormat'
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
