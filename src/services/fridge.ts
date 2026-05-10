import { api } from '@/lib/api'
import type { FridgeItem, AddFridgeItemRequest, UpdateFridgeItemRequest } from '@/types'

export const fridgeService = {
  list: (): Promise<FridgeItem[]> =>
    api.get<FridgeItem[]>('/api/fridge').then(r => r.data),

  add: (req: AddFridgeItemRequest): Promise<FridgeItem> =>
    api.post<FridgeItem>('/api/fridge', req).then(r => r.data),

  addBatch: (items: AddFridgeItemRequest[]): Promise<void> =>
    api.post('/api/fridge/batch', items).then(() => undefined),

  updateItem: (id: string, req: UpdateFridgeItemRequest): Promise<FridgeItem> =>
    api.patch<FridgeItem>(`/api/fridge/${id}`, req).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/fridge/${id}`).then(() => undefined),
}
