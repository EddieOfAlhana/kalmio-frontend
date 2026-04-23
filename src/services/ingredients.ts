import { api } from '@/lib/api'
import type { Ingredient, CreateIngredientRequest, UpdateIngredientRequest } from '@/types'

export const ingredientsService = {
  list: () => api.get<Ingredient[]>('/api/ingredients').then(r => r.data),
  get: (id: string) => api.get<Ingredient>(`/api/ingredients/${id}`).then(r => r.data),
  create: (body: CreateIngredientRequest) => api.post<Ingredient>('/api/ingredients', body).then(r => r.data),
  update: (id: string, body: UpdateIngredientRequest) => api.put<Ingredient>(`/api/ingredients/${id}`, body).then(r => r.data),
  delete: (id: string) => api.delete(`/api/ingredients/${id}`),
}
