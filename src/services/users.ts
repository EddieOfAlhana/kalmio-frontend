import { api } from '@/lib/api'

export interface UserMealPreferences {
  days?: number
  selectedMealTypes?: string[]
  kcalTarget?: number
  proteinMin?: number
  budgetMax?: number
  prepTimeMax?: number
  forbiddenIngredientIds?: string[]
  maxRecipeRepetitions?: number
  constraintWeights?: { waste: number; budget: number; prepTime: number; recipeRepeat: number }
  servingConfig?: { minMultiplier: number; maxMultiplier: number; step: number }
  mealCalorieTargets?: Record<string, number>
}

export interface UserSettings {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  languagePreference: string | null
  mealPlanPreferences: UserMealPreferences | null
  createdAt: string
}

export interface UpdateSettingsRequest {
  languagePreference?: string | null
  mealPlanPreferences?: UserMealPreferences | null
}

export interface UpdateProfileRequest {
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
}

export const usersService = {
  getMe: () => api.get<UserSettings>('/api/users/me').then(r => r.data),
  updateSettings: (body: UpdateSettingsRequest) =>
    api.put<UserSettings>('/api/users/me/settings', body).then(r => r.data),
  updateProfile: (body: UpdateProfileRequest) =>
    api.put<UserSettings>('/api/users/me/profile', body).then(r => r.data),
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<UserSettings>('/api/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}
