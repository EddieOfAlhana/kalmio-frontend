import { api } from '@/lib/api'
import type { MealRationaleResponse } from '@/types'

/**
 * Premium "Why this?" rationale for a planned meal slot.
 *
 * The backend caches per planned meal, so calling `explain` more than once is
 * cheap (the second call is an in-memory lookup). Cache is invalidated when
 * the meal's status or recipe changes.
 *
 * Error mapping the UI relies on:
 *   - 402 = not premium (paywall)
 *   - 429 = per-minute rate limit (5/min) or monthly soft cap (default 100)
 *   - 404 = planned meal does not exist or does not belong to the caller
 */
export const mealRationaleService = {
  explain: (plannedMealId: string): Promise<MealRationaleResponse> =>
    api
      .post<MealRationaleResponse>(`/api/planned-meals/${plannedMealId}/explain`)
      .then(r => r.data),
}
