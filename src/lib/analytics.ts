import posthog from 'posthog-js'

const CONSENT_KEY = 'kalmio-analytics-consent'
const PH_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const PH_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com'

export type Consent = 'accepted' | 'declined'

export function getConsent(): Consent | null {
  return localStorage.getItem(CONSENT_KEY) as Consent | null
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
  if (!PH_KEY || getConsent() !== 'accepted' || !posthog.__loaded) return
  posthog.capture(event, props)
}

export function identify(userId: string): void {
  if (!PH_KEY || getConsent() !== 'accepted' || !posthog.__loaded) return
  posthog.identify(userId)
}

export function resetConsent(): void {
  localStorage.removeItem(CONSENT_KEY)
}
