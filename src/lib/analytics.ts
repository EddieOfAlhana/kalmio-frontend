import posthog from 'posthog-js'

const CONSENT_KEY = 'kalmio-analytics-consent'
const PH_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const PH_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com'

export type Consent = 'accepted' | 'declined'

export function getConsent(): Consent | null {
  return localStorage.getItem(CONSENT_KEY) as Consent | null
}

/** Returns true when PostHog is initialised and the user has consented. */
function isReady(): boolean {
  return !!PH_KEY && getConsent() === 'accepted' && !!posthog.__loaded
}

export function initAnalytics(): void {
  if (!PH_KEY || getConsent() !== 'accepted') return
  if (posthog.__loaded) return
  posthog.init(PH_KEY, {
    api_host: PH_HOST,
    persistence: 'localStorage+cookie',
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
  })
}

export function acceptAnalytics(): void {
  localStorage.setItem(CONSENT_KEY, 'accepted')
  initAnalytics()
}

export function declineAnalytics(): void {
  localStorage.setItem(CONSENT_KEY, 'declined')
  if (posthog.__loaded) posthog.opt_out_capturing()
}

export function capture(event: string, props?: Record<string, unknown>): void {
  if (!isReady()) return
  posthog.capture(event, props)
}

export function identify(userId: string): void {
  if (!isReady()) return
  posthog.identify(userId)
}

/**
 * Alias the current anonymous ID to a known user ID.
 * Call this once on signup completion, before `identify()`.
 */
export function alias(userId: string): void {
  if (!isReady()) return
  // posthog.alias merges the anonymous session into the user profile.
  posthog.alias(userId)
}

/**
 * Reset PostHog identity — call on logout so the next session starts
 * as a fresh anonymous user and does not inherit the previous identity.
 */
export function resetIdentity(): void {
  if (!posthog.__loaded) return
  posthog.reset()
}

/**
 * Register sticky super-properties that are sent with every subsequent event
 * for the duration of the browser session (uses sessionStorage via PostHog).
 */
export function registerSuperProperties(props: Record<string, unknown>): void {
  if (!isReady()) return
  posthog.register(props)
}

/**
 * Fire a manual page_view event with routing context.
 * Use this because `capture_pageview: false` — we own all page view tracking.
 */
export function pageView(path: string, locale: string, isAuthenticated: boolean): void {
  if (!isReady()) return
  posthog.capture('$pageview', {
    $current_url: window.location.href,
    path,
    i18n_locale: locale,
    is_authenticated: isAuthenticated,
  })
}

export function resetConsent(): void {
  localStorage.removeItem(CONSENT_KEY)
}
