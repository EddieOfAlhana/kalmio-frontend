import { api } from '@/lib/api'

export interface UserMealPreferences {
  days?: number
  mealsPerDay?: number
  kcalTarget?: number
  proteinMin?: number
  budgetMax?: number
  prepTimeMax?: number
  forbiddenIngredientIds?: string[]
  maxRecipeRepetitions?: number
  constraintWeights?: { waste: number; budget: number; prepTime: number; recipeRepeat: number }
  servingConfig?: { minMultiplier: number; maxMultiplier: number; step: number }
}

export interface UserSettings {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  languagePreference: string | null
  mealPlanPreferences: UserMealPreferences | null
  createdAt: string
}

export interface UpdateSettingsRequest {
  languagePreference?: string | null
  mealPlanPreferences?: UserMealPreferences | null
}

export const usersService = {
  getMe: () => api.get<UserSettings>('/api/users/me').then(r => r.data),
  updateSettings: (body: UpdateSettingsRequest) =>
    api.put<UserSettings>('/api/users/me/settings', body).then(r => r.data),
}
