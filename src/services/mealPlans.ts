import { api } from '@/lib/api'
import type { MealPlan, GenerateMealPlanRequest, ShoppingList, ShoppingListRequest, SavedMealPlan } from '@/types'

export function savedPlanToMealPlan(saved: SavedMealPlan): MealPlan {
  return {
    id: saved.id,
    days: saved.days,
    mealsPerDay: saved.mealsPerDay,
    score: '',
    totalEstimatedCost: saved.slots.every(s => s.estimatedCost != null)
      ? saved.slots.reduce((sum, s) => sum + (s.estimatedCost ?? 0), 0)
      : null,
    savedPlanId: saved.id,
    meals: saved.slots.map(s => ({
      id: s.id,
      day: s.dayNumber,
      mealType: s.mealType,
      recipe: {
        id: s.recipeId,
        name: s.recipeName,
        steps: [],
        prepTimeMinutes: s.recipePrepTimeMinutes,
        cookTimeMinutes: s.recipeCookTimeMinutes,
        servings: 1,
        macros: null,
        estimatedCostPerServing: null,
        ingredients: [],
        tags: s.recipeTags,
        translations: null,
        machineTranslated: false,
      },
      servingMultiplier: s.servingMultiplier,
      estimatedCost: s.estimatedCost,
      macros: s.macros,
    })),
  }
}

export const mealPlansService = {
  generate: (body: GenerateMealPlanRequest, force = false) =>
    api.post<MealPlan>(`/api/meal-plans${force ? '?force=true' : ''}`, body).then(r => r.data),
  shoppingList: (body: ShoppingListRequest) =>
    api.post<ShoppingList>('/api/meal-plans/shopping-list', body).then(r => r.data),
  listSaved: () =>
    api.get<SavedMealPlan[]>('/api/meal-plans/saved').then(r => r.data),
}
