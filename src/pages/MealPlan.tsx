import { useState, useEffect, useRef, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Clock, ChevronDown, ChevronUp, Pencil, Check, Minus, Plus, RefreshCw, Eye, MoreHorizontal } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { MacroRing } from '@/components/ui/macro-ring'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { planService } from '@/services/plans'
import { recipesService } from '@/services/recipes'
import { ingredientsService } from '@/services/ingredients'
import { PlanPreferencesForm } from '@/components/PlanPreferencesForm'
import { FirstPlanReveal } from '@/components/onboarding/FirstPlanReveal'
import { hasRevealBeenShown } from '@/lib/firstPlanReveal'
import { formatCurrency, formatLocalDate } from '@/lib/utils'
import { getRecipeName, getRecipeSteps } from '@/lib/i18nRecipe'
import type { MealType, Recipe, Ingredient, Plan, PlannedMeal, PlannedMealStatus } from '@/types'

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'SNACK']

const MEAL_COLOR: Record<MealType, string> = {
  BREAKFAST: '#F28C28',
  MORNING_SNACK: '#e8a23a',
  LUNCH: '#4F7942',
  AFTERNOON_SNACK: '#7a9e5c',
  DINNER: '#1A1A1A',
  SNACK: '#6b7280',
}

export function MealPlan() {
  const { t } = useTranslation()
  // Explicit user request to show the preferences form (e.g. "Regenerate" button)
  const [forcePreferencesForm, setForcePreferencesForm] = useState(false)
  // First-plan reveal: show once after the very first plan is generated.
  // Gated by localStorage so it never fires more than once across sessions.
  const [showFirstPlanReveal, setShowFirstPlanReveal] = useState(false)

  // Try the new Plan API first
  const { data: activePlan, isLoading: activePlanLoading } = useQuery({
    queryKey: ['plan', 'active'],
    queryFn: planService.getActive,
    staleTime: 60_000,
  })

  // Show the preferences form when there is no active plan, or when the user
  // explicitly requests regeneration.
  const showPreferencesForm = forcePreferencesForm || (!activePlanLoading && !activePlan)

  if (activePlanLoading) {
    return (
      <div>
        <Header title={t('mealPlan.title')} subtitle={t('mealPlan.subtitle')} />
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      </div>
    )
  }

  // Preferences form takes priority so the "Regenerate" button works even when a plan exists
  if (showPreferencesForm) {
    return (
      <div>
        <Header
          title={t('preferences.title')}
          subtitle={t('preferences.subtitle')}
          actions={
            activePlan ? (
              <Button variant="outline" size="sm" onClick={() => setForcePreferencesForm(false)}>
                {t('common.back')}
              </Button>
            ) : undefined
          }
        />
        <div className="mt-6">
          <PlanPreferencesForm
            onSuccess={() => {
              setForcePreferencesForm(false)
              // Show the first-plan reveal if it has never been seen before.
              if (!hasRevealBeenShown()) {
                setShowFirstPlanReveal(true)
              }
            }}
          />
        </div>
      </div>
    )
  }

  if (activePlan) {
    return (
      <>
        <PlanCalendarView plan={activePlan} onRegenerate={() => setForcePreferencesForm(true)} />
        {showFirstPlanReveal && (
          <FirstPlanReveal onDismiss={() => setShowFirstPlanReveal(false)} />
        )}
      </>
    )
  }

  return null
}

// ── PlanCalendarView ──────────────────────────────────────────────────────────

function statusToVariant(status: PlannedMealStatus): 'green' | 'amber' | 'orange' | 'gray' {
  if (status === 'EATEN') return 'green'
  if (status === 'SKIPPED') return 'amber'
  if (status === 'REPLACED') return 'orange'
  return 'gray'
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const startFmt = start.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
  const endFmt = end.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
  return `${startFmt} – ${endFmt}`
}

function formatDayHeader(dateStr: string, lang: string): string {
  return formatLocalDate(dateStr, lang, { weekday: 'long', month: 'short', day: 'numeric' })
}

function PlanCalendarView({ plan, onRegenerate }: { plan: Plan; onRegenerate: () => void }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  // Group meals by date
  const mealsByDate = useMemo<Map<string, PlannedMeal[]>>(() => {
    const map = new Map<string, PlannedMeal[]>()
    for (const meal of plan.meals) {
      const arr = map.get(meal.date) ?? []
      arr.push(meal)
      map.set(meal.date, arr)
    }
    for (const [date, arr] of map) {
      map.set(date, arr.sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType)))
    }
    return map
  }, [plan.meals])

  const sortedDates = useMemo(() => Array.from(mealsByDate.keys()).sort(), [mealsByDate])

  // First date expanded by default
  const [expandedDates, setExpandedDates] = useState<Set<string>>(
    () => new Set(sortedDates.slice(0, 1))
  )

  function toggleDate(date: string) {
    setExpandedDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  function onMealUpdated() {
    void queryClient.invalidateQueries({ queryKey: ['plan', 'active'] })
  }

  const dateRange = formatDateRange(plan.startDate, plan.endDate)

  return (
    <div>
      <Header
        title={t('plan.active')}
        subtitle={dateRange}
        actions={
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            {t('plan.regenerate')}
          </Button>
        }
      />

      <div className="space-y-3 mt-4">
        {sortedDates.map(date => {
          const meals = mealsByDate.get(date) ?? []
          const expanded = expandedDates.has(date)
          const dayMacros = meals.reduce(
            (acc, m) => ({
              kcal: acc.kcal + (m.macros?.kcal ?? 0),
              protein: acc.protein + (m.macros?.protein ?? 0),
              fat: acc.fat + (m.macros?.fat ?? 0),
              carbs: acc.carbs + (m.macros?.carbs ?? 0),
            }),
            { kcal: 0, protein: 0, fat: 0, carbs: 0 }
          )
          const dayCost = meals.every(m => m.estimatedCostPerServing != null)
            ? meals.reduce((s, m) => s + (m.estimatedCostPerServing ?? 0), 0)
            : null

          return (
            <Card key={date}>
              <button
                type="button"
                onClick={() => toggleDate(date)}
                className="w-full text-left"
                aria-expanded={expanded}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    <MacroRing macros={dayMacros} size={52} />
                    <div className="flex-1 min-w-0">
                      <p className="font-headline font-bold text-sm text-[#1A1A1A]">
                        {formatDayHeader(date, i18n.language)}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                        <span>{dayMacros.kcal.toFixed(0)} kcal</span>
                        <span aria-hidden="true">{dayMacros.protein.toFixed(0)}g P</span>
                        <span className="sr-only">{t('mealPlan.protein')}: {dayMacros.protein.toFixed(0)}g</span>
                        <span aria-hidden="true">{dayMacros.fat.toFixed(0)}g F</span>
                        <span className="sr-only">{t('mealPlan.fat')}: {dayMacros.fat.toFixed(0)}g</span>
                        <span aria-hidden="true">{dayMacros.carbs.toFixed(0)}g C</span>
                        <span className="sr-only">{t('mealPlan.carbs')}: {dayMacros.carbs.toFixed(0)}g</span>
                        {dayCost != null && (
                          <span className="text-[#4F7942] font-semibold">{formatCurrency(dayCost)}</span>
                        )}
                      </div>
                    </div>
                    {expanded
                      ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    }
                  </div>
                </CardContent>
              </button>

              {expanded && (
                <div className="border-t border-[#e5e4e7] px-4 pb-4 pt-3 space-y-2">
                  {meals.map(meal => (
                    <PlannedMealCard
                      key={meal.id}
                      meal={meal}
                      planId={plan.id}
                      onUpdate={onMealUpdated}
                    />
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

const PLAN_MULTIPLIER_MIN = 0.5
const PLAN_MULTIPLIER_MAX = 3.0
const PLAN_MULTIPLIER_STEP = 0.1

function PlannedMealCard({
  meal,
  planId,
  onUpdate,
}: {
  meal: PlannedMeal
  planId: string
  onUpdate: () => void
}) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'

  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [multiplier, setMultiplier] = useState(meal.servingMultiplier)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestMultiplier = useRef(meal.servingMultiplier)

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [])

  const mutation = useMutation({
    mutationFn: (req: import('@/types').UpdatePlannedMealRequest) =>
      planService.updateMeal(planId, meal.id, req),
    onSuccess: onUpdate,
  })

  function handleMultiplierStep(delta: number) {
    const next = Math.round((latestMultiplier.current + delta) * 10) / 10
    const clamped = Math.min(PLAN_MULTIPLIER_MAX, Math.max(PLAN_MULTIPLIER_MIN, next))
    setMultiplier(clamped)
    latestMultiplier.current = clamped
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      mutation.mutate({ servingMultiplier: latestMultiplier.current })
    }, 800)
  }

  function handleRecipeSwap(recipe: Recipe) {
    mutation.mutate({ replacedWithRecipeId: recipe.id })
  }

  const statusVariant = statusToVariant(meal.status)

  const { data: fullRecipe } = useQuery({
    queryKey: ['recipe', meal.recipeId],
    queryFn: () => recipesService.get(meal.recipeId),
    // Always enabled so the card title is localised immediately, not only on
    // modal open.  staleTime keeps this cheap — the same cache entry is reused
    // when the detail dialog opens.
    staleTime: 5 * 60 * 1000,
  })

  const { data: allIngredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientsService.list,
    staleTime: 30_000,
  })

  // Map of ingredientId → Ingredient object, for name resolution + macro calculation.
  const ingredientById = useMemo<Map<string, Ingredient>>(
    () => new Map(allIngredients.map(i => [i.id, i])),
    [allIngredients]
  )

  const steps = getRecipeSteps(fullRecipe, lang)
  const displayName = getRecipeName(fullRecipe, lang) || meal.recipeName

  return (
    <div className="bg-[#F9F7F2] rounded-[12px] overflow-hidden">
      {/* Main row */}
      <div className="flex items-start gap-3 p-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
              style={{ background: MEAL_COLOR[meal.mealType], fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {t(`mealPlan.meals.${meal.mealType}`)}
            </span>
            {meal.status !== 'PLANNED' && (
              <Badge variant={statusVariant}>
                {t(`plan.mealStatus.${meal.status}`)}
              </Badge>
            )}
            {meal.isBatchCookLeftover && (
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-gray-500 bg-gray-100">
                {t('mealPlan.batchCookLeftover')}
              </span>
            )}
          </div>
          <p className="font-semibold text-sm text-[#1A1A1A] leading-snug">{displayName}</p>
          {meal.macros && (
            <div className="flex gap-x-3 text-xs text-gray-500 mt-0.5 flex-wrap">
              <span>{meal.macros.kcal.toFixed(0)} kcal</span>
              <span aria-hidden="true">{meal.macros.protein.toFixed(0)}g P</span>
              <span className="sr-only">{t('mealPlan.protein')}: {meal.macros.protein.toFixed(0)}g</span>
              <span aria-hidden="true">{meal.macros.fat.toFixed(0)}g F</span>
              <span className="sr-only">{t('mealPlan.fat')}: {meal.macros.fat.toFixed(0)}g</span>
              <span aria-hidden="true">{meal.macros.carbs.toFixed(0)}g C</span>
              <span className="sr-only">{t('mealPlan.carbs')}: {meal.macros.carbs.toFixed(0)}g</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-0.5">×{multiplier.toFixed(1)} {t('mealPlan.serving')}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="p-1.5 rounded-md text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-200/60 transition-colors"
            aria-label={t('mealPlan.viewRecipe')}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditing(prev => !prev)}
            className={`p-1.5 rounded-md transition-colors ${editing ? 'text-[#4F7942] bg-[#4F7942]/10' : 'text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-200/60'}`}
            aria-label={t('mealPlan.editSlot.edit')}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(prev => !prev)}
              disabled={mutation.isPending}
              className="p-1.5 rounded-md text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-200/60 transition-colors"
              aria-label={t('plan.mealActions')}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-[10px] shadow-md py-1 min-w-[160px]">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); mutation.mutate({ status: 'EATEN' }) }}
                  className="w-full text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#F9F7F2] transition-colors"
                >
                  {t('plan.actions.markEaten')}
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); mutation.mutate({ status: 'SKIPPED' }) }}
                  className="w-full text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#F9F7F2] transition-colors"
                >
                  {t('plan.actions.markSkipped')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="border-t border-[#e5e4e7] px-3 pb-3 pt-2.5 space-y-3">
          {/* Serving multiplier stepper */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">{t('mealPlan.editSlot.servingMultiplier')}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMultiplierStep(-PLAN_MULTIPLIER_STEP)}
                disabled={multiplier <= PLAN_MULTIPLIER_MIN}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-10 text-center text-sm font-semibold tabular-nums text-[#1A1A1A]">
                ×{multiplier.toFixed(1)}
              </span>
              <button
                type="button"
                onClick={() => handleMultiplierStep(PLAN_MULTIPLIER_STEP)}
                disabled={multiplier >= PLAN_MULTIPLIER_MAX}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Recipe swap */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 truncate flex-1 mr-2">{displayName}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              disabled={mutation.isPending}
              className="shrink-0 text-xs h-7 px-2 gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              {t('mealPlan.editSlot.swapRecipe')}
            </Button>
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-500">{t('mealPlan.editSlot.saveError')}</p>
          )}
          {mutation.isPending && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Spinner className="h-3 w-3" />{t('mealPlan.editSlot.saving')}
            </div>
          )}
        </div>
      )}

      {/* Recipe detail dialog */}
      <Dialog open={detailOpen} onOpenChange={o => !o && setDetailOpen(false)}>
        <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="leading-snug pr-6">{displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {meal.macros && (
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {([
                  { labelKey: 'recipes.detail.kcal', value: meal.macros.kcal },
                  { labelKey: 'recipes.detail.protein', value: meal.macros.protein },
                  { labelKey: 'recipes.detail.fat', value: meal.macros.fat },
                  { labelKey: 'recipes.detail.carbs', value: meal.macros.carbs },
                ] as const).map(({ labelKey, value }) => (
                  <div key={labelKey} className="bg-[#F9F7F2] rounded-[8px] p-1.5">
                    <span className="sr-only">{t(labelKey)}: {Number(value).toFixed(0)}</span>
                    <p className="text-xs font-bold text-[#1A1A1A]" aria-hidden="true">{Number(value).toFixed(0)}</p>
                    <p className="text-[10px] text-gray-400" aria-hidden="true">{t(labelKey)}</p>
                  </div>
                ))}
              </div>
            )}
            {fullRecipe && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F9F7F2] rounded-[10px] p-2.5 text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">{t('recipes.detail.prep')}</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{fullRecipe.prepTimeMinutes}m</p>
                </div>
                <div className="bg-[#F9F7F2] rounded-[10px] p-2.5 text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">{t('recipes.detail.cook')}</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{fullRecipe.cookTimeMinutes}m</p>
                </div>
              </div>
            )}
            {fullRecipe && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('recipes.detail.ingredients')}
                </p>
                {fullRecipe.ingredients.length === 0 ? (
                  <p className="text-sm text-gray-400">{t('recipes.detail.noIngredients')}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {fullRecipe.ingredients.map(ing => {
                      const ingredient = ingredientById.get(ing.ingredientId)
                      const name = ingredient
                        ? (ingredient.translations?.[lang]?.name ?? ingredient.name)
                        : ing.ingredientId
                      const unitLabel = ing.unit === 'G' ? 'g' : ing.unit === 'ML' ? 'ml' : t('recipes.detail.piece')
                      // Per-ingredient kcal + protein: macros are per 100g/ml; PIECE uses gramsPerPiece.
                      let ingKcal: number | null = null
                      let ingProtein: number | null = null
                      if (ingredient?.macros) {
                        const gramsEquiv =
                          ing.unit === 'PIECE'
                            ? ing.amount * (ingredient.gramsPerPiece ?? 100)
                            : ing.amount
                        ingKcal = (gramsEquiv / 100) * ingredient.macros.kcal
                        ingProtein = (gramsEquiv / 100) * ingredient.macros.protein
                      }
                      return (
                        <li key={ing.id} className="flex items-start justify-between gap-2 text-sm">
                          <div className="flex-1 min-w-0">
                            <span className="text-[#1A1A1A] leading-snug">{name}</span>
                            {ingKcal !== null && ingProtein !== null && (
                              <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                                {ingKcal.toFixed(0)} kcal · {ingProtein.toFixed(1)}g {t('recipes.detail.protein')}
                              </p>
                            )}
                          </div>
                          <span className="text-gray-500 tabular-nums shrink-0 mt-0.5">
                            {ing.amount}{unitLabel}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {t('recipes.detail.steps')}
              </p>
              {steps.length === 0 ? (
                <p className="text-sm text-gray-400">{t('recipes.detail.noSteps')}</p>
              ) : (
                <ol className="space-y-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-sm">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#F28C28] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[#1A1A1A] leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe picker */}
      <RecipePickerDialog
        open={pickerOpen}
        currentRecipeId={meal.recipeId}
        onSelect={recipe => { setPickerOpen(false); handleRecipeSwap(recipe) }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  )
}

// ── RecipePickerDialog ────────────────────────────────────────────────────────

function RecipePickerDialog({
  open,
  currentRecipeId,
  onSelect,
  onClose,
}: {
  open: boolean
  currentRecipeId: string
  onSelect: (recipe: Recipe) => void
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'hu' | 'en'
  const [search, setSearch] = useState('')

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesService.list,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  })

  const filtered = recipes.filter(r =>
    getRecipeName(r, lang).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('mealPlan.recipePicker.title')}</DialogTitle>
        </DialogHeader>

        <Input
          placeholder={t('mealPlan.recipePicker.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3"
          autoFocus
        />

        <div className="space-y-2 max-h-[55dvh] overflow-y-auto pr-1">
          {isLoading && (
            <div className="flex justify-center py-8"><Spinner className="h-5 w-5" /></div>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">{t('mealPlan.recipePicker.noResults')}</p>
          )}
          {filtered.map(recipe => {
            const isCurrent = recipe.id === currentRecipeId
            return (
              <button
                key={recipe.id}
                type="button"
                onClick={() => { onSelect(recipe); onClose() }}
                className={`w-full text-left rounded-[10px] px-3 py-2.5 transition-colors border ${
                  isCurrent
                    ? 'border-[#4F7942] bg-[#4F7942]/5'
                    : 'border-transparent bg-[#F9F7F2] hover:bg-[#f0ede6]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#1A1A1A] leading-snug">{getRecipeName(recipe, lang)}</p>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {t('mealPlan.recipePicker.prepTime', { min: recipe.prepTimeMinutes + recipe.cookTimeMinutes })}
                      </span>
                      {recipe.macros && (
                        <>
                          <span>{t('mealPlan.recipePicker.kcal', { kcal: recipe.macros.kcal.toFixed(0) })}</span>
                          <span>{t('mealPlan.recipePicker.protein', { protein: recipe.macros.protein.toFixed(0) })}</span>
                        </>
                      )}
                    </div>
                    {recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {recipe.tags.map(tag => (
                          <Badge key={tag} variant="gray">{t(`recipes.tags.${tag}`, { defaultValue: tag })}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {isCurrent && <Check className="h-4 w-4 text-[#4F7942] shrink-0 mt-0.5" />}
                </div>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
