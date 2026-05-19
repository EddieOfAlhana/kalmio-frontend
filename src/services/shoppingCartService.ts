import { api } from '@/lib/api'
import type { ShoppingCartResponse, GenerateCartRequest } from '@/types'

/**
 * Shopping cart service — wraps the BE2 multi-plan cart endpoints.
 *
 * POST /api/shopping-cart/generate  →  aggregate unshopped plans into a cart.
 * POST /api/shopping-cart/{cartId}/mark-shopped  →  atomically mark plans shopped.
 */
export const shoppingCartService = {
  /**
   * Generate an aggregated shopping cart across all unshopped plans in the
   * optional window. Both dates default server-side to today → today+30 days.
   */
  generate: (req: GenerateCartRequest = {}): Promise<ShoppingCartResponse> =>
    api
      .post<ShoppingCartResponse>('/api/shopping-cart/generate', req)
      .then(r => r.data),

  /**
   * Atomically mark all plans in the cart as shopped.
   * Returns 409 if the cart was already marked.
   */
  markShopped: (cartId: string): Promise<ShoppingCartResponse> =>
    api
      .post<ShoppingCartResponse>(`/api/shopping-cart/${cartId}/mark-shopped`)
      .then(r => r.data),
}
