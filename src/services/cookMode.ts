import { api } from '@/lib/api'
import type { AiCookModeRequest, AiCookModeResponse } from '@/types'

/**
 * Premium in-kitchen cook-mode Q&A.
 *
 * The endpoint is stateless — pass the last N (max 5) user questions so the
 * model can maintain minimal conversational context across turns.
 *
 * Error mapping the UI relies on:
 *   - 402 = not premium (paywall)
 *   - 429 = per-minute rate limit (10/min) or monthly soft cap (200/user)
 *   - 503 = OpenAI not configured
 */
export const cookModeService = {
  ask: (recipeId: string, req: AiCookModeRequest): Promise<AiCookModeResponse> =>
    api
      .post<AiCookModeResponse>(`/api/recipes/${recipeId}/cook-mode/ask`, req)
      .then(r => r.data),
}
