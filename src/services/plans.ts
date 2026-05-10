import { api } from '@/lib/api'
import type { Plan, PlannedMeal, CreatePlanRequest, UpdatePlannedMealRequest } from '@/types'

export const planService = {
  create: (req: CreatePlanRequest): Promise<Plan> =>
    api.post<Plan>('/api/plans', req).then(r => r.data),

  getActive: (): Promise<Plan | null> =>
    api.get<Plan>('/api/plans/active').then(r => r.data).catch((err: { response?: { status?: number } }) => {
      if (err.response?.status === 404) return null
      throw err
    }),

  getById: (id: string): Promise<Plan> =>
    api.get<Plan>(`/api/plans/${id}`).then(r => r.data),

  updateMeal: (planId: string, mealId: string, req: UpdatePlannedMealRequest): Promise<PlannedMeal> =>
    api.patch<PlannedMeal>(`/api/plans/${planId}/meals/${mealId}`, req).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/plans/${id}`).then(() => undefined),
}
