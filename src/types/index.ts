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

export interface IngredientLocaleTranslation {
  name: string
  aliases: string[]
}

export interface IngredientTranslations {
  en: IngredientLocaleTranslation | null
  hu: IngredientLocaleTranslation | null
}

export interface Ingredient {
  id: string
  name: string
  aliases: string[]
  category: IngredientCategory
  macros: Macros
  constraints: DietaryConstraints
  density: number | null
  /** Canonical grams per piece — required if any recipe uses this ingredient in PIECE units. */
  gramsPerPiece: number | null
  translations: IngredientTranslations | null
  machineTranslated: boolean
}

export interface CreateIngredientRequest {
  name: string
  aliases: string[]
  category: IngredientCategory
  macros: { kcal: number; protein: number; fat: number; carbs: number }
  constraints: DietaryConstraints
  density?: number | null
  gramsPerPiece?: number | null
}

export type UpdateIngredientRequest = CreateIngredientRequest

// ── Recipes ───────────────────────────────────────────────────────────────

export interface RecipeIngredientRef {
  id: string
  ingredientId: string
  amount: number
  unit: Unit
}

export interface RecipeLocaleTranslation {
  name: string
  steps: string[]
}

export interface RecipeTranslations {
  en: RecipeLocaleTranslation | null
  hu: RecipeLocaleTranslation | null
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
  translations: RecipeTranslations | null
  machineTranslated: boolean
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

// ── Retail ────────────────────────────────────────────────────────────────

export interface RetailProvider {
  id: string
  name: string
  country: string
  currency: string
  baseUrl: string | null
  active: boolean
}

export interface RetailIngredientMapping {
  ingredientId: string
  matchConfidence: number
}

export interface RetailProduct {
  id: string
  providerId: string
  externalProductId: string
  name: string
  brand: string | null
  packageSize: number
  unit: Unit
  price: number
  remoteUrl: string | null
  active: boolean
  ingredientMappings: RetailIngredientMapping[]
}

export interface CreateRetailProductRequest {
  providerId: string
  externalProductId: string
  name: string
  brand?: string | null
  packageSize: number
  unit: Unit
  price: number
  remoteUrl?: string | null
  ingredientMappings: { ingredientId: string; matchConfidence: number }[]
}

export interface UpdateRetailProductRequest {
  externalProductId: string
  name: string
  brand?: string | null
  packageSize: number
  unit: Unit
  price: number
  remoteUrl?: string | null
  ingredientMappings: { ingredientId: string; matchConfidence: number }[]
}

// ── Meal Plans ────────────────────────────────────────────────────────────

export interface ConstraintWeights {
  waste: number
  budget: number
  prepTime: number
  recipeRepeat: number
}

export interface GenerateMealPlanRequest {
  days: number
  mealsPerDay: number
  constraints: {
    kcalTarget: number
    proteinMin?: number | null
    budgetMax?: number | null
    prepTimeMax?: number | null
    forbiddenIngredientIds?: string[]
    maxRecipeRepetitions?: number | null
    constraintWeights?: ConstraintWeights | null
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
