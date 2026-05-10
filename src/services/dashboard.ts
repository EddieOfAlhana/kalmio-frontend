import { api } from '@/lib/api'
import type { DashboardDto } from '@/types'

export const dashboardService = {
  get: (date?: string): Promise<DashboardDto> => {
    const params = date ? { date } : {}
    return api.get<DashboardDto>('/api/dashboard', { params }).then(r => r.data)
  },
}

export const prepTaskService = {
  updateStatus: (id: string, status: string): Promise<unknown> =>
    api.patch(`/api/prep-tasks/${id}/status`, { status }).then(r => r.data),
}
