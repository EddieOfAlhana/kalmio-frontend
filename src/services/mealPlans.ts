import { api } from '@/lib/api'
import type { MealPlan, GenerateMealPlanRequest, ShoppingList, ShoppingListRequest } from '@/types'

export const mealPlansService = {
  generate: (body: GenerateMealPlanRequest) =>
    api.post<MealPlan>('/api/meal-plans', body).then(r => r.data),
  shoppingList: (body: ShoppingListRequest) =>
    api.post<ShoppingList>('/api/meal-plans/shopping-list', body).then(r => r.data),
}
