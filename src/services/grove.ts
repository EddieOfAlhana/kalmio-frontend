/**
 * grove service — KALMIO-144 / E6.5
 *
 * Backend dependency: GET /api/grove/pins
 * May return 404 until the backend grove endpoint ships.
 * Falls back to a seeded mock dataset so the page renders immediately.
 */

import { api } from '@/lib/api'
import type { GrovePinsResponse } from '@/types'

// ── Mock data ─────────────────────────────────────────────────────────────────
// Seeded x/y positions (0–100 percentage of the SVG viewBox) so the page
// renders realistically before the real endpoint ships.
// The current user's pin is not included here — it is injected by the page
// based on the active session.

const MOCK_PINS: GrovePinsResponse = {
  pins: [
    { userId: 'mock-01', displayName: 'K.B.',       x: 48.2, y: 38.5, certificateId: null },
    { userId: 'mock-02', displayName: 'Sz.M.',      x: 53.7, y: 44.1, certificateId: null },
    { userId: 'mock-03', displayName: 'V.A.',        x: 41.0, y: 51.3, certificateId: null },
    { userId: 'mock-04', displayName: 'N.P.',        x: 60.4, y: 35.8, certificateId: null },
    { userId: 'mock-05', displayName: 'H.Cs.',       x: 35.6, y: 42.7, certificateId: null },
    { userId: 'mock-06', displayName: 'T.L.',        x: 56.1, y: 57.2, certificateId: null },
    { userId: 'mock-07', displayName: 'B.É.',        x: 44.8, y: 29.6, certificateId: null },
    { userId: 'mock-08', displayName: 'F.K.',        x: 63.2, y: 48.9, certificateId: null },
    { userId: 'mock-09', displayName: 'G.R.',        x: 38.3, y: 62.0, certificateId: null },
    { userId: 'mock-10', displayName: 'D.T.',        x: 50.9, y: 67.4, certificateId: null },
    { userId: 'mock-11', displayName: 'Cs.N.',       x: 29.4, y: 55.1, certificateId: null },
    { userId: 'mock-12', displayName: 'M.Zs.',       x: 68.7, y: 40.3, certificateId: null },
  ],
}

// ── Service ───────────────────────────────────────────────────────────────────

export async function fetchGrovePins(): Promise<GrovePinsResponse> {
  try {
    const res = await api.get<GrovePinsResponse>('/api/grove/pins')
    return res.data
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      console.warn(
        '[grove] GET /api/grove/pins returned 404 — ' +
          'backend endpoint not yet deployed (KALMIO-144 backend slice). ' +
          'Falling back to mock data.',
      )
      return MOCK_PINS
    }
    throw err
  }
}

export const groveService = {
  fetchPins: fetchGrovePins,
}
