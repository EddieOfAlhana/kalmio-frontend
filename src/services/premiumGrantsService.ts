/**
 * premiumGrantsService — KALMIO-173
 *
 * Fetches the current user's active premium grants from the backend.
 *
 * Note: GET /api/users/me/premium-grants is a planned endpoint (KALMIO-173
 * follow-up). Until it ships this service is called defensively — the hook
 * that consumes it falls back to stage-derived data if the request fails.
 */

import { api } from '@/lib/api'
import type { PremiumGrant } from '@/types'

export const premiumGrantsService = {
  /**
   * Returns all currently active premium grants for the authenticated user.
   * Active = validFrom ≤ now < validUntil (or validUntil is null).
   */
  getActive: (): Promise<PremiumGrant[]> =>
    api.get<PremiumGrant[]>('/api/users/me/premium-grants').then(r => r.data),
}
