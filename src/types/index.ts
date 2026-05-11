// ── Enums ─────────────────────────────────────────────────────────────────

export type IngredientCategory = 'PROTEIN' | 'CARB' | 'FAT' | 'VEGGIE' | 'SPICE'
export type Unit = 'G' | 'ML' | 'PIECE'
export type MealType = 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER' | 'SNACK'
export type RecipeTag = 'QUICK' | 'CHEAP' | 'MEALPREP' | 'HIGH_PROTEIN' | 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER' | 'SNACK'

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
  pescatarian: boolean
  glutenFree: boolean
  dairyFree: boolean
  lactoseFree: boolean
  milkProteinFree: boolean
  eggFree: boolean
  nutFree: boolean
  peanutFree: boolean
  soyFree: boolean
  fishFree: boolean
  shellfishFree: boolean
  sesameFree: boolean
  halal: boolean
  kosher: boolean
  keto: boolean
  lowGi: boolean
  lowFodmap: boolean
  paleo: boolean
}

export type DietaryRestrictionKey = keyof DietaryConstraints

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
  /** Shelf-stable pantry staple — excluded from leftover calculations. */
  pantryItem: boolean
}

export interface CreateIngredientRequest {
  name: string
  aliases: string[]
  category: IngredientCategory
  macros: { kcal: number; protein: number; fat: number; carbs: number }
  constraints: DietaryConstraints
  density?: number | null
  gramsPerPiece?: number | null
  pantryItem: boolean
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
  leftovers: number
  budget: number
  prepTime: number
  recipeRepeat: number
}

// ── Fridge ────────────────────────────────────────────────────────────────

export interface FridgeItem {
  id: string
  ingredientId: string
  ingredientName: string
  ingredientCategory: IngredientCategory | null
  pantryItem: boolean
  amount: number
  unit: Unit
  addedAt: string
  expiryDate: string | null   // ISO date string "YYYY-MM-DD"
  source: string              // "MANUAL" | "SHOPPING" | "GROOMING"
}

export interface AddFridgeItemRequest {
  ingredientId: string
  amount: number
  unit: Unit
  expiryDate?: string         // optional ISO date string
}

export interface UpdateFridgeItemRequest {
  expiryDate?: string
  amount?: number
}

export interface GenerateMealPlanRequest {
  days: number
  selectedMeals: MealType[]
  constraints: {
    kcalTarget: number
    proteinMin?: number | null
    budgetMax?: number | null
    prepTimeMax?: number | null
    forbiddenIngredientIds?: string[]
    maxRecipeRepetitions?: number | null
    constraintWeights?: ConstraintWeights | null
    mealCalorieTargets?: Record<string, number> | null
    fridgeIngredientIds?: string[] | null
    dietaryRestrictions?: string[] | null
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
  savedPlanId: string | null
  meals: GeneratedMeal[]
}

// ── Saved Meal Plans ──────────────────────────────────────────────────────

export interface SavedSlotMacros {
  kcal: number
  protein: number
  fat: number
  carbs: number
}

export interface SavedMealSlot {
  id: string
  dayNumber: number
  mealType: MealType
  recipeId: string
  recipeName: string
  recipePrepTimeMinutes: number
  recipeCookTimeMinutes: number
  recipeTags: RecipeTag[]
  servingMultiplier: number
  macros: SavedSlotMacros | null
  estimatedCost: number | null
  recipeSteps: string[]
  recipeTranslations: RecipeTranslations | null
}

export interface SavedMealPlan {
  id: string
  name: string
  days: number
  mealsPerDay: number
  slots: SavedMealSlot[]
  createdAt: string
}

// ── Calendar Plans ────────────────────────────────────────────────────────

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type PlannedMealStatus = 'PLANNED' | 'EATEN' | 'SKIPPED' | 'REPLACED'

export interface PlannedMeal {
  id: string
  planId: string
  date: string              // ISO date "YYYY-MM-DD"
  mealType: MealType
  recipeId: string
  recipeName: string
  macros: Macros | null
  estimatedCostPerServing: number | null
  servingMultiplier: number
  status: PlannedMealStatus
  replacedWithRecipeId: string | null
  eatenAt: string | null
  notes: string | null
}

export interface Plan {
  id: string
  userId: string
  startDate: string         // "YYYY-MM-DD"
  endDate: string           // "YYYY-MM-DD"
  status: PlanStatus
  shoppingCycleDays: number
  createdAt: string
  meals: PlannedMeal[]
}

export interface CreatePlanRequest {
  startDate: string
  cycleDays: number
  constraints: GenerateMealPlanRequest
}

export interface UpdatePlannedMealRequest {
  status?: PlannedMealStatus
  replacedWithRecipeId?: string
  notes?: string
  servingMultiplier?: number
}

// ── Feedback ──────────────────────────────────────────────────────────────

export type FeedbackType = 'BUG' | 'SUGGESTION' | 'OTHER'
export type FeedbackStatus = 'OPEN' | 'FIXED' | 'REJECTED'

export interface FeedbackMessage {
  id: string
  senderId: string
  admin: boolean
  body: string
  createdAt: string
}

export interface FeedbackSummary {
  id: string
  userId: string
  userEmail: string | null
  type: FeedbackType
  title: string
  status: FeedbackStatus
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface FeedbackDetail extends FeedbackSummary {
  description: string
  page: string | null
  messages: FeedbackMessage[]
}

export interface CreateFeedbackRequest {
  type: FeedbackType
  title: string
  description: string
  page?: string
}

// ── Grooming ──────────────────────────────────────────────────────────────

export type GroomingAction = 'KEEP' | 'DISCARD' | 'ADJUST_QUANTITY'

export interface GroomingDecision {
  itemId: string
  action: GroomingAction
  newAmount?: number
}

export interface StartGroomingResponse {
  sessionId: string
  fridgeItems: FridgeItem[]
}

export interface GroomingSession {
  id: string
  userId: string
  startedAt: string
  completedAt: string | null
  planId: string | null
  itemsKept: number
  itemsDiscarded: number
  itemsExpired: number
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export type PlannedMealStatusExtended = 'PLANNED' | 'EATEN' | 'SKIPPED' | 'REPLACED'
export type PrepType = 'OVERNIGHT_PREP' | 'BATCH_FRIENDLY' | 'MAKE_AHEAD' | 'FRESH_ONLY'
export type PrepWindow = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'

export interface TodaysMealCard {
  mealId: string
  recipeId: string
  recipeName: string
  mealType: string
  macros: { kcal: number; protein: number; fat: number; carbs: number } | null
  status: PlannedMealStatusExtended
}

export interface OffPlanMealCard {
  id: string
  mealType?: string
  displayName: string
  macros: { kcal: number; protein: number; fat: number; carbs: number } | null
}

export interface PrepTaskCard {
  id?: string
  planId: string
  recipeId: string
  recipeName: string
  prepType: PrepType
  window: PrepWindow
  scheduledDate: string
  durationMin: number | null
  status?: string
}

export interface PlanGlanceDto {
  planId: string
  startDate: string
  endDate: string
  daysRemaining: number
  totalDays: number
}

export interface DashboardDto {
  todaysMeals: TodaysMealCard[]
  offPlanMeals: OffPlanMealCard[]
  todaysPrepTasks: PrepTaskCard[]
  tomorrowsPrepTasks: PrepTaskCard[]
  planGlance: PlanGlanceDto | null
  pointsTotal: number
  activeFlags: {
    hasActivePlan: boolean
    needsGrooming: boolean
    hasReplanDiff: boolean
  }
}

export interface DailyMacroDto {
  date: string
  consumed: { kcal: number; protein: number; fat: number; carbs: number }
  target: { kcal: number; protein: number; fat: number; carbs: number }
}

export interface LogOffPlanMealRequest {
  date: string
  mealType?: string
  displayName: string
  kcal: number
  proteinG?: number
  fatG?: number
  carbG?: number
}

// ── Shopping List ─────────────────────────────────────────────────────────

export interface ShoppingListRequest {
  meals: { recipeId: string; servingMultiplier: number }[]
  fridgeItems?: { ingredientId: string; amount: number; unit: Unit }[]
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
  leftoverAmount: number | null
  leftoverCost: number | null
}

export interface ShoppingListItem {
  ingredientId: string
  ingredientName: string
  ingredientCategory: IngredientCategory | null
  totalAmount: number
  unit: Unit
  pantryItem: boolean
  fridgeAmount: number | null
  retailProduct: RetailProductInfo | null
}

export interface ShoppingList {
  items: ShoppingListItem[]
  totalEstimatedCost: number | null
  totalLeftoverCost: number | null
  currency: string
}

// ── Replan Diff ───────────────────────────────────────────────────────────

export interface MealChange {
  mealId: string
  date: string        // ISO date "YYYY-MM-DD"
  mealType: string    // "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK"
  oldRecipeId: string
  oldRecipeName: string
  newRecipeId: string
  newRecipeName: string
}

export interface IngredientChange {
  ingredientId: string
  name: string
  changeType: 'ADDED' | 'REMOVED'
  amount: number
  unit: string
}

export interface WastedMeal {
  recipeId: string
  recipeName: string
  estimatedCost: number | null
}

export interface ReplanDiff {
  diffId: string
  planId: string
  changes: MealChange[]
  ingredientChanges: IngredientChange[]
  costDelta: number | null      // negative = savings
  narrative: string[]
  wastedMeals: WastedMeal[]
}
