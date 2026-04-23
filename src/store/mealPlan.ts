import { create } from 'zustand'
import type { MealPlan } from '@/types'

interface MealPlanStore {
  plan: MealPlan | null
  setPlan: (plan: MealPlan) => void
  clearPlan: () => void
}

export const useMealPlanStore = create<MealPlanStore>(set => ({
  plan: null,
  setPlan: plan => set({ plan }),
  clearPlan: () => set({ plan: null }),
}))
