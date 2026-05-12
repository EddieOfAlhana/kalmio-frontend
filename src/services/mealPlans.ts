import { api } from '@/lib/api'
import type { MealPlan, GeneratedMeal, GenerateMealPlanRequest, ShoppingList, ShoppingListRequest, SavedMealPlan, SavedMealSlot } from '@/types'

export function savedSlotToMeal(s: SavedMealSlot): GeneratedMeal {
  return {
    id: s.id,
    day: s.dayNumber,
    mealType: s.mealType,
    recipe: {
      id: s.recipeId,
      name: s.recipeName,
      steps: s.recipeSteps ?? [],
      prepTimeMinutes: s.recipePrepTimeMinutes,
      cookTimeMinutes: s.recipeCookTimeMinutes,
      servings: 1,
      macros: null,
      estimatedCostPerServing: null,
      ingredients: [],
      tags: s.recipeTags,
      translations: s.recipeTranslations ?? null,
      machineTranslated: false,
      visibility: 'PUBLIC',
      createdByUsername: null,
    },
    servingMultiplier: Number(s.servingMultiplier),
    estimatedCost: s.estimatedCost,
    macros: s.macros,
  }
}

export function savedPlanToMealPlan(saved: SavedMealPlan): MealPlan {
  const hasAnyCost = saved.slots.some(s => s.estimatedCost != null)
  return {
    id: saved.id,
    days: saved.days,
    mealsPerDay: saved.mealsPerDay,
    score: '',
    totalEstimatedCost: hasAnyCost
      ? saved.slots.reduce((sum, s) => sum + (s.estimatedCost ?? 0), 0)
      : null,
    savedPlanId: saved.id,
    meals: saved.slots.map(savedSlotToMeal),
  }
}

export const mealPlansService = {
  generate: (body: GenerateMealPlanRequest, force = false) =>
    api.post<MealPlan>(`/api/meal-plans${force ? '?force=true' : ''}`, body).then(r => r.data),
  shoppingList: (body: ShoppingListRequest) =>
    api.post<ShoppingList>('/api/meal-plans/shopping-list', body).then(r => r.data),
  listSaved: () =>
    api.get<SavedMealPlan[]>('/api/meal-plans/saved').then(r => r.data),
  updateSlot: (planId: string, slotId: string, body: { recipeId?: string; servingMultiplier?: number }) =>
    api.patch<SavedMealSlot>(`/api/meal-plans/saved/${planId}/slots/${slotId}`, body).then(r => r.data),
}
