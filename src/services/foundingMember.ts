/**
 * foundingMember service — KALMIO-20
 *
 * Backend dependency: GET /api/founding-member/availability (public, no auth required)
 * Returns { cap, sold, remaining }.  Cache-Control max-age=30 on the server side.
 */

import { api } from '@/lib/api'
import type { FoundingMemberAvailability } from '@/types'

async function getAvailability(): Promise<FoundingMemberAvailability> {
  const res = await api.get<FoundingMemberAvailability>('/api/founding-member/availability')
  return res.data
}

export const foundingMemberService = {
  getAvailability,
}
