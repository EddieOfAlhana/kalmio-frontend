import { api } from '@/lib/api'
import type { MomentumHistoryEntry } from '@/types'

export const momentumService = {
  /**
   * Fetches per-day moisture history for the last N days.
   * Response is ordered oldest-first (index 0 = N-1 days ago, last = today).
   * Endpoint: GET /api/users/me/momentum/history?days={days}
   */
  getHistory: (days = 14): Promise<MomentumHistoryEntry[]> =>
    api
      .get<MomentumHistoryEntry[]>('/api/users/me/momentum/history', {
        params: { days },
      })
      .then(r => r.data),
}
