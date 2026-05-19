import { api } from '@/lib/api'
import type {
  MultiMemberPlan,
  CreateMultiMemberPlanRequest,
  UpdatePlanMembersRequest,
  ReplanSuggestion,
} from '@/types'

export const multiMemberPlanService = {
  /** POST /api/plans/multi */
  create: (req: CreateMultiMemberPlanRequest): Promise<MultiMemberPlan> =>
    api.post<MultiMemberPlan>('/api/plans/multi', req).then(r => r.data),

  /** GET /api/plans/list?status=... */
  list: (status?: string): Promise<MultiMemberPlan[]> =>
    api
      .get<MultiMemberPlan[]>('/api/plans/list', { params: status ? { status } : undefined })
      .then(r => r.data),

  /** GET /api/plans/{id}/details */
  getById: (id: string): Promise<MultiMemberPlan> =>
    api.get<MultiMemberPlan>(`/api/plans/${id}/details`).then(r => r.data),

  /** PATCH /api/plans/{id}/members */
  updateMembers: (id: string, req: UpdatePlanMembersRequest): Promise<MultiMemberPlan> =>
    api.patch<MultiMemberPlan>(`/api/plans/${id}/members`, req).then(r => r.data),

  /** POST /api/plans/{id}/co-planners/{userId} */
  promoteCoPlanner: (planId: string, userId: string): Promise<MultiMemberPlan> =>
    api.post<MultiMemberPlan>(`/api/plans/${planId}/co-planners/${userId}`).then(r => r.data),

  /** DELETE /api/plans/{id}/co-planners/{userId} */
  demoteCoPlanner: (planId: string, userId: string): Promise<MultiMemberPlan> =>
    api.delete<MultiMemberPlan>(`/api/plans/${planId}/co-planners/${userId}`).then(r => r.data),

  /**
   * GET /api/plans/{id}/replan-suggestions — BE4 stub.
   * Returns empty array until BE4 endpoints are implemented.
   */
  getReplanSuggestions: async (planId: string): Promise<ReplanSuggestion[]> => {
    try {
      const r = await api.get<ReplanSuggestion[]>(`/api/plans/${planId}/replan-suggestions`)
      return r.data
    } catch {
      // BE4 endpoint not yet available — return empty array
      return []
    }
  },

  /** POST /api/plans/{id}/replan-suggestions/{suggestionId}/accept — BE4 stub. */
  acceptSuggestion: (planId: string, suggestionId: string): Promise<void> =>
    api.post(`/api/plans/${planId}/replan-suggestions/${suggestionId}/accept`).then(() => undefined),

  /** POST /api/plans/{id}/replan-suggestions/{suggestionId}/reject — BE4 stub. */
  rejectSuggestion: (planId: string, suggestionId: string): Promise<void> =>
    api.post(`/api/plans/${planId}/replan-suggestions/${suggestionId}/reject`).then(() => undefined),

  /** POST /api/plans/{id}/replan-suggestions/accept-all — BE4 stub. */
  acceptAllSuggestions: (planId: string): Promise<void> =>
    api.post(`/api/plans/${planId}/replan-suggestions/accept-all`).then(() => undefined),
}
