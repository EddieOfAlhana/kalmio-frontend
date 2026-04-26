import { api } from '@/lib/api'
import type { Recipe, CreateRecipeRequest, UpdateRecipeRequest } from '@/types'

export const recipesService = {
  list: () => api.get<Recipe[]>('/api/recipes').then(r => r.data),
  get: (id: string) => api.get<Recipe>(`/api/recipes/${id}`).then(r => r.data),
  create: (body: CreateRecipeRequest) => api.post<Recipe>('/api/recipes', body).then(r => r.data),
  update: (id: string, body: UpdateRecipeRequest) => api.put<Recipe>(`/api/recipes/${id}`, body).then(r => r.data),
  delete: (id: string) => api.delete(`/api/recipes/${id}`),
  approveTranslation: (id: string) => api.post<Recipe>(`/api/recipes/${id}/approve-translation`).then(r => r.data),
}
