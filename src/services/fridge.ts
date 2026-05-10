import { api } from '@/lib/api'
import type { FridgeItem, AddFridgeItemRequest } from '@/types'

export const fridgeService = {
  list: (): Promise<FridgeItem[]> =>
    api.get<FridgeItem[]>('/api/fridge').then(r => r.data),

  add: (req: AddFridgeItemRequest): Promise<FridgeItem> =>
    api.post<FridgeItem>('/api/fridge', req).then(r => r.data),

  addBatch: (items: AddFridgeItemRequest[]): Promise<void> =>
    api.post('/api/fridge/batch', items).then(() => undefined),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/fridge/${id}`).then(() => undefined),
}
