import { api } from '@/lib/api'
import type { PointsResponse } from '@/types'

export const pointsService = {
  getMyPoints: (): Promise<PointsResponse> =>
    api.get<PointsResponse>('/api/points/me').then(r => r.data),
}
