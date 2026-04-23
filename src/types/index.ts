// ── Enums ─────────────────────────────────────────────────────────────────

export type IngredientCategory = 'PROTEIN' | 'CARB' | 'FAT' | 'VEGGIE' | 'SPICE'
export type Unit = 'G' | 'ML' | 'PIECE'
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
export type RecipeTag = 'QUICK' | 'CHEAP' | 'MEALPREP' | 'HIGH_PROTEIN'

// ── Macros ────────────────────────────────────────────────────────────────

export interface Macros {
  kcal: number
  protein: number
  fat: number
  carbs: number
}

// ── Ingredients ───────────────────────────────────────────────────────────

export interface DietaryConstraints {
  vegetarian: boolean
  vegan: boolean
  lactoseFree: boolean
  milkProteinFree: boolean
  glutenFree: boolean
  paleo: boolean
}

export interface Ingredient {
  id: string
  name: string
  aliases: string[]
  category: IngredientCategory
  macros: Macros
  constraints: DietaryConstraints
  density: number | null
}

export interface CreateIngredientRequest {
  name: string
  aliases: string[]
  category: IngredientCategory
  macros: { kcal: number; protein: number; fat: number; carbs: number }
  constraints: DietaryConstraints
  density?: number | null
}

export type UpdateIngredientRequest = CreateIngredientRequest

// ── Recipes ───────────────────────────────────────────────────────────────

export interface RecipeIngredientRef {
  id: string
  ingredientId: string
  amount: number
  unit: Unit
}

export interface Recipe {
  id: string
  name: string
  steps: string[]
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  macros: Macros | null
  estimatedCostPerServing: number | null
  ingredients: RecipeIngredientRef[]
  tags: RecipeTag[]
}

export interface CreateRecipeRequest {
  name: string
  steps: string[]
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  ingredients: { ingredientId: string; amount: number; unit: Unit; id?: string }[]
  tags: RecipeTag[]
}

export type UpdateRecipeRequest = CreateRecipeRequest

// ── Meal Plans ────────────────────────────────────────────────────────────

export interface GenerateMealPlanRequest {
  days: number
  mealsPerDay: number
  constraints: {
    kcalTarget: number
    proteinMin?: number | null
    budgetMax?: number | null
    prepTimeMax?: number | null
    forbiddenIngredientIds?: string[]
  }
  servingConfig?: {
    minMultiplier: number
    maxMultiplier: number
    step: number
  } | null
}

export interface GeneratedMeal {
  id: string
  day: number
  mealType: MealType
  recipe: Recipe
  servingMultiplier: number
  estimatedCost: number | null
  macros: Macros | null
}

export interface MealPlan {
  id: string
  days: number
  mealsPerDay: number
  score: string
  totalEstimatedCost: number | null
  meals: GeneratedMeal[]
}

// ── Shopping List ─────────────────────────────────────────────────────────

export interface ShoppingListRequest {
  meals: { recipeId: string; servingMultiplier: number }[]
}

export interface RetailProductInfo {
  id: string
  name: string
  brand: string | null
  price: number
  packageSize: number
  unit: Unit
  remoteUrl: string | null
  estimatedCost: number | null
}

export interface ShoppingListItem {
  ingredientId: string
  ingredientName: string
  ingredientCategory: IngredientCategory | null
  totalAmount: number
  unit: Unit
  retailProduct: RetailProductInfo | null
}

export interface ShoppingList {
  items: ShoppingListItem[]
  totalEstimatedCost: number | null
  currency: string
}
