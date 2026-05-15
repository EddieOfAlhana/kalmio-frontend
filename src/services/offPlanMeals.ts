import { api } from '@/lib/api'
import type { OffPlanMealCard, LogOffPlanMealRequest } from '@/types'

export const offPlanMealsService = {
  log: (req: LogOffPlanMealRequest): Promise<OffPlanMealCard> =>
    api.post<OffPlanMealCard>('/api/dashboard/off-plan-meals', req).then(r => r.data),

  list: (date: string): Promise<OffPlanMealCard[]> =>
    api.get<OffPlanMealCard[]>('/api/dashboard/off-plan-meals', { params: { date } }).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/dashboard/off-plan-meals/${id}`).then(() => undefined),
}
