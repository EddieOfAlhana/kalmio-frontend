import { create } from 'zustand'
import type { MealPlan, GeneratedMeal } from '@/types'

interface MealPlanStore {
  plan: MealPlan | null
  setPlan: (plan: MealPlan) => void
  updateMeal: (meal: GeneratedMeal) => void
  clearPlan: () => void
}

export const useMealPlanStore = create<MealPlanStore>(set => ({
  plan: null,
  setPlan: plan => set({ plan }),
  updateMeal: meal => set(state => state.plan
    ? { plan: { ...state.plan, meals: state.plan.meals.map(m => m.id === meal.id ? meal : m) } }
    : state
  ),
  clearPlan: () => set({ plan: null }),
}))
