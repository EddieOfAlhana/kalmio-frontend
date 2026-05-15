import { useState, useEffect, useRef, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import axios from 'axios'
import { capture } from '@/lib/analytics'
import { Zap, Clock, ChevronDown, ChevronUp, ShoppingCart, CheckCircle, Pencil, Check, Minus, Plus, RefreshCw, Eye, MoreHorizontal } from 'lucide-react'
import { Knob } from '@/components/ui/knob'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import { MacroRing } from '@/components/ui/macro-ring'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { mealPlansService, savedPlanToMealPlan, savedSlotToMeal } from '@/services/mealPlans'
import { planService } from '@/services/plans'
import { fridgeService } from '@/services/fridge'
import { usersService, type DietaryPreferences } from '@/services/users'
import { recipesService } from '@/services/recipes'
import { useMealPlanStore } from '@/store/mealPlan'
import { PlanPreferencesForm } from '@/components/PlanPreferencesForm'
import { formatCurrency, formatMacro, recipePhotoUrl } from '@/lib/utils'
import { getRecipeName, getRecipeSteps } from '@/lib/i18nRecipe'
import type { GeneratedMeal, GenerateMealPlanRequest, MealType, Macros, ConstraintWeights, Recipe, Plan, PlannedMeal, PlannedMealStatus, PlanJobProgress } from '@/types'

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'SNACK']

const MEAL_COLOR: Record<MealType, string> = {
  BREAKFAST: '#F28C28',
  MORNING_SNACK: '#e8a23a',
  LUNCH: '#4F7942',
  AFTERNOON_SNACK: '#7a9e5c',
  DINNER: '#1A1A1A',
  SNACK: '#6b7280',
}

const DEFAULT_SELECTED: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER']

const optionalInt = z.coerce.number().int().optional().nullable().transform(v => v || null)
const optionalNum = z.coerce.number().optional().nullable().transform(v => v || null)

const schema = z.object({
  days: z.coerce.number().int().min(1).max(14),
  kcalTarget: z.coerce.number().min(500),
  proteinMin: optionalNum,
  budgetMax: optionalNum,
  prepTimeMax: optionalInt,
  maxRecipeRepetitions: z.coerce.number().int().min(1).optional().nullable().transform(v => (v == null || v < 1) ? null : v),
})
type FormValues = z.infer<typeof schema>

// ── Meal kcal distribution helpers ───────────────────────────────────────────

function equalMealKcals(meals: MealType[], total: number): Record<MealType, number> {
  const base: Record<string, number> = {}
  if (meals.length === 0) return base as Record<MealType, number>
  const share = Math.floor(total / meals.length)
  meals.forEach((m, i) => { base[m] = i === 0 ? total - share * (meals.length - 1) : share })
  return base as Record<MealType, number>
}

function distributeMealKcal(
  key: MealType,
  newVal: number,
  current: Record<MealType, number>,
  meals: MealType[],
  total: number,
): Record<MealType, number> {
  const others = meals.filter(m => m !== key)
  if (others.length === 0) return { ...current, [key]: total }
  const clamped = Math.min(total, Math.max(0, newVal))
  const remaining = total - clamped
  const sumOthers = others.reduce((s, m) => s + (current[m] ?? 0), 0)
  const next: Record<string, number> = { ...current, [key]: clamped }
  if (sumOthers === 0) {
    const share = Math.floor(remaining / others.length)
    others.forEach((m, i) => { next[m] = i === others.length - 1 ? remaining - share * (others.length - 1) : share })
  } else {
    let allocated = 0
    others.forEach((m, i) => {
      if (i === others.length - 1) {
        next[m] = Math.max(0, remaining - allocated)
      } else {
        const val = Math.max(0, Math.round(((current[m] ?? 0) / sumOthers) * remaining))
        next[m] = val
        allocated += val
      }
    })
  }
  return next as Record<MealType, number>
}

function scaleMealKcals(current: Record<MealType, number>, meals: MealType[], newTotal: number): Record<MealType, number> {
  const oldTotal = meals.reduce((s, m) => s + (current[m] ?? 0), 0)
  if (oldTotal === 0) return equalMealKcals(meals, newTotal)
  const next: Record<string, number> = {}
  let allocated = 0
  meals.forEach((m, i) => {
    if (i === meals.length - 1) {
      next[m] = Math.max(0, newTotal - allocated)
    } else {
      const val = Math.round(((current[m] ?? 0) / oldTotal) * newTotal)
      next[m] = val
      allocated += val
    }
  })
  return next as Record<MealType, number>
}

type WeightKey = keyof ConstraintWeights

function distributeWeights(
  key: WeightKey,
  newValue: number,
  current: ConstraintWeights,
  activeKeys: WeightKey[],
): ConstraintWeights {
  const others = activeKeys.filter(k => k !== key)
  if (others.length === 0) return current

  const sumOthers = others.reduce((s, k) => s + current[k], 0)
  const remaining = 100 - newValue
  const next = { ...current, [key]: newValue }

  if (sumOthers === 0) {
    const share = Math.floor(remaining / others.length)
    others.forEach((k, i) => { next[k] = i === others.length - 1 ? remaining - share * (others.length - 1) : share })
  } else {
    let allocated = 0
    others.forEach((k, i) => {
      if (i === others.length - 1) {
        next[k] = Math.max(0, remaining - allocated)
      } else {
        const val = Math.max(0, Math.round((current[k] / sumOthers) * remaining))
        next[k] = val
        allocated += val
      }
    })
  }
  return next
}

function equalWeights(activeKeys: WeightKey[]): ConstraintWeights {
  const base: ConstraintWeights = { leftovers: 0, budget: 0, prepTime: 0, recipeRepeat: 0 }
  if (activeKeys.length === 0) return base
  const share = Math.floor(100 / activeKeys.length)
  activeKeys.forEach((k, i) => { base[k] = i === 0 ? 100 - share * (activeKeys.length - 1) : share })
  return base
}

const ZERO_MACROS: Macros = { kcal: 0, protein: 0, fat: 0, carbs: 0 }

function sumMacros(meals: GeneratedMeal[]): Macros {
  return meals.reduce((acc, m) => ({
    kcal: acc.kcal + (m.macros?.kcal ?? 0),
    protein: acc.protein + (m.macros?.protein ?? 0),
    fat: acc.fat + (m.macros?.fat ?? 0),
    carbs: acc.carbs + (m.macros?.carbs ?? 0),
  }), { ...ZERO_MACROS })
}

export function MealPlan() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { plan, setPlan, updateMeal } = useMealPlanStore()
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]))
  const [showPreferencesForm, setShowPreferencesForm] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Try the new Plan API first
  const { data: activePlan, isLoading: activePlanLoading } = useQuery({
    queryKey: ['plan', 'active'],
    queryFn: planService.getActive,
    staleTime: 60_000,
  })

  const { data: savedPlan } = useQuery({
    queryKey: ['saved-meal-plans'],
    queryFn: mealPlansService.listSaved,
    enabled: plan === null,
    select: plans => plans.length > 0 ? savedPlanToMealPlan(plans[0]) : null,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (savedPlan && !plan) {
      setPlan(savedPlan)
    }
  }, [savedPlan, plan, setPlan])

  const { data: userSettings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: usersService.getMe,
    staleTime: 5 * 60 * 1000,
  })

  const { data: fridgeItems = [] } = useQuery({
    queryKey: ['fridge'],
    queryFn: fridgeService.list,
    staleTime: 60_000,
  })

  const prefsApplied = useRef(false)
  useEffect(() => {
    if (prefsApplied.current || !userSettings?.mealPlanPreferences) return
    const p = userSettings.mealPlanPreferences
    prefsApplied.current = true
    if (p.selectedMealTypes && p.selectedMealTypes.length > 0) {
      const meals = (p.selectedMealTypes as MealType[]).filter(m => MEAL_ORDER.includes(m))
        .sort((a, b) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b))
      if (meals.length > 0) {
        setSelectedMeals(meals)
        if (p.mealCalorieTargets) {
          const kcals: Record<string, number> = {}
          meals.forEach(m => { kcals[m] = p.mealCalorieTargets?.[m] ?? 0 })
          setMealKcals(kcals as Record<MealType, number>)
        } else {
          setMealKcals(equalMealKcals(meals, p.kcalTarget ?? 2000))
        }
      }
    }
  }, [userSettings])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { days: 7, kcalTarget: 2000, proteinMin: 150, maxRecipeRepetitions: 2 },
  })

  const kcalTarget = Number(watch('kcalTarget') ?? 2000)
  const budgetMaxRaw = watch('budgetMax')
  const prepTimeMaxRaw = watch('prepTimeMax')
  const budgetEnabled = !!budgetMaxRaw
  const prepTimeEnabled = !!prepTimeMaxRaw

  // ── Selected meals & calorie knobs ────────────────────────────────────────
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>(DEFAULT_SELECTED)
  const [mealKcals, setMealKcals] = useState<Record<MealType, number>>(
    () => equalMealKcals(DEFAULT_SELECTED, 2000)
  )

  function toggleMeal(meal: MealType) {
    setSelectedMeals(prev => {
      const next = prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal].sort(
        (a, b) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b)
      )
      if (next.length === 0) return prev  // keep at least one
      setMealKcals(equalMealKcals(next, kcalTarget || 2000))
      return next
    })
  }

  function handleMealKcalChange(meal: MealType, value: number) {
    setMealKcals(prev => distributeMealKcal(meal, value, prev, selectedMeals, kcalTarget || 2000))
  }

  // When kcalTarget changes, scale all knobs proportionally
  const prevKcal = useRef(kcalTarget)
  useEffect(() => {
    if (kcalTarget > 0 && kcalTarget !== prevKcal.current) {
      setMealKcals(prev => scaleMealKcals(prev, selectedMeals, kcalTarget))
      prevKcal.current = kcalTarget
    }
  }, [kcalTarget, selectedMeals])

  // ── Constraint weights ────────────────────────────────────────────────────
  const activeKeys = (['leftovers', 'budget', 'prepTime', 'recipeRepeat'] as WeightKey[]).filter(k => {
    if (k === 'budget') return budgetEnabled
    if (k === 'prepTime') return prepTimeEnabled
    return true
  })

  const [weights, setWeights] = useState<ConstraintWeights>(() => equalWeights(['leftovers', 'recipeRepeat']))

  const prevActiveRef = useRef(activeKeys.join(','))
  useEffect(() => {
    const next = activeKeys.join(',')
    if (next !== prevActiveRef.current) {
      prevActiveRef.current = next
      setWeights(equalWeights(activeKeys))
    }
  })

  function handleWeightChange(key: WeightKey, value: number) {
    setWeights(prev => distributeWeights(key, value, prev, activeKeys))
  }

  const forceRef = useRef(false)
  const lastBodyRef = useRef<GenerateMealPlanRequest | null>(null)
  const pollAbortRef = useRef<AbortController | null>(null)
  const [jobProgress, setJobProgress] = useState<PlanJobProgress | null>(null)

  // Abort an in-flight polling loop when the page unmounts so we don't keep hitting the
  // status endpoint after the user navigates away.
  useEffect(() => () => pollAbortRef.current?.abort(), [])

  const mutation = useMutation({
    mutationFn: async (body: GenerateMealPlanRequest) => {
      pollAbortRef.current?.abort()
      const controller = new AbortController()
      pollAbortRef.current = controller
      setJobProgress(null)
      return mealPlansService.generateAsync(body, {
        signal: controller.signal,
        onProgress: setJobProgress,
      })
    },
    onSuccess: (result, body) => {
      forceRef.current = false
      setJobProgress(null)
      setPlan(result)
      setExpandedDays(new Set([0]))
      capture('plan_generated', { days: result.days, meal_count: result.meals?.length ?? 0, flow: 'async' })
      usersService.updateSettings({
        mealPlanPreferences: {
          days: body.days,
          selectedMealTypes: body.selectedMeals,
          kcalTarget: body.constraints.kcalTarget,
          proteinMin: body.constraints.proteinMin ?? undefined,
          budgetMax: body.constraints.budgetMax ?? undefined,
          prepTimeMax: body.constraints.prepTimeMax ?? undefined,
          maxRecipeRepetitions: body.constraints.maxRecipeRepetitions ?? undefined,
          constraintWeights: body.constraints.constraintWeights ?? undefined,
          mealCalorieTargets: body.constraints.mealCalorieTargets ?? undefined,
        },
      }).catch(() => {/* non-critical */})
    },
  })

  const is409 = mutation.isError && axios.isAxiosError(mutation.error) && mutation.error.response?.status === 409
  const is422 = mutation.isError && axios.isAxiosError(mutation.error) && mutation.error.response?.status === 422

  const activeDietaryRestrictions: string[] = (() => {
    const dp = userSettings?.dietaryPreferences as DietaryPreferences | null | undefined
    if (!dp) return []
    return (Object.keys(dp) as (keyof DietaryPreferences)[]).filter(k => dp[k])
  })()

  function buildBody(v: FormValues): GenerateMealPlanRequest {
    const mealCalorieTargets = Object.fromEntries(
      selectedMeals.map(m => [m, mealKcals[m] ?? 0])
    )
    return {
      days: v.days,
      selectedMeals,
      constraints: {
        kcalTarget: v.kcalTarget,
        proteinMin: v.proteinMin ?? null,
        budgetMax: v.budgetMax ?? null,
        prepTimeMax: v.prepTimeMax ?? null,
        maxRecipeRepetitions: v.maxRecipeRepetitions ?? null,
        constraintWeights: weights,
        mealCalorieTargets,
        fridgeIngredientIds: fridgeItems.length > 0 ? [...new Set(fridgeItems.map(fi => fi.ingredientId))] : null,
        dietaryRestrictions: activeDietaryRestrictions.length > 0 ? activeDietaryRestrictions : null,
      },
    }
  }

  function onSubmit(v: FormValues) {
    const body = buildBody(v)
    lastBodyRef.current = body
    forceRef.current = false
    mutation.mutate(body)
  }

  function handleForceGenerate() {
    if (lastBodyRef.current) {
      forceRef.current = true
      mutation.mutate(lastBodyRef.current)
    }
  }

  function toggleDay(day: number) {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day); else next.add(day)
      return next
    })
  }

  const totalMacros = plan ? sumMacros(plan.meals) : null
  const totalCost = plan?.meals.some(m => m.estimatedCost != null)
    ? plan.meals.reduce((s, m) => s + (m.estimatedCost ?? 0), 0)
    : null
  const costPerDay = totalCost != null && plan ? totalCost / plan.days : null

  // If there is an active calendar plan, render the new view
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
            <Button variant="outline" size="sm" onClick={() => setShowPreferencesForm(false)}>
              {t('common.back')}
            </Button>
          }
        />
        <div className="mt-6">
          <PlanPreferencesForm onSuccess={() => setShowPreferencesForm(false)} />
        </div>
      </div>
    )
  }

  if (activePlan) {
    return <PlanCalendarView plan={activePlan} onRegenerate={() => setShowPreferencesForm(true)} />
  }

  return (
    <div>
      <Header
        title={t('mealPlan.title')}
        subtitle={t('mealPlan.subtitle')}
        actions={
          plan && (
            <Button variant="outline" onClick={() => navigate('/app/shopping-list')}>
              <ShoppingCart className="h-4 w-4" /> {t('mealPlan.shoppingList')}
            </Button>
          )
        }
      />

      {/* New plan CTA — opens preferences form */}
      {!plan && (
        <Card className="mb-6">
          <CardContent className="py-8 flex flex-col items-center text-center">
            <p className="text-sm text-gray-500 mb-4">{t('plan.noActive')}</p>
            <Button size="lg" onClick={() => setShowPreferencesForm(true)}>
              {t('plan.newPlan')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Legacy generation form */}
      <Card className="mb-6">
        <CardHeader><CardTitle>{t('mealPlan.form.title')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>{t('mealPlan.form.days')} <span className="text-gray-400 text-xs">{t('mealPlan.form.daysHint')}</span></Label>
              <Input type="number" min="1" max="14" {...register('days')} />
              {errors.days && <p className="text-xs text-red-500">{errors.days.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('mealPlan.form.kcalTarget')}</Label>
              <Input type="number" min="500" {...register('kcalTarget')} />
              {errors.kcalTarget && <p className="text-xs text-red-500">{errors.kcalTarget.message}</p>}
            </div>

            {/* Meal selection checkboxes */}
            <div className="col-span-2 md:col-span-3 pt-1">
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">{t('mealPlan.form.selectMeals')}</p>
              <div className="flex flex-wrap gap-2">
                {MEAL_ORDER.map(meal => {
                  const active = selectedMeals.includes(meal)
                  return (
                    <button
                      key={meal}
                      type="button"
                      onClick={() => toggleMeal(meal)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        active
                          ? 'text-white border-transparent'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}
                      style={active ? { background: MEAL_COLOR[meal] } : undefined}
                    >
                      {t(`mealPlan.meals.${meal}`)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Per-meal calorie knobs */}
            {selectedMeals.length > 0 && (
              <div className="col-span-2 md:col-span-3">
                <p className="text-sm font-medium text-[#1A1A1A] mb-0.5">{t('mealPlan.form.mealCalories')}</p>
                <p className="text-xs text-gray-400 mb-4">{t('mealPlan.form.mealCaloriesHint')}</p>
                <div className="flex flex-wrap gap-6 justify-start">
                  {selectedMeals.map(meal => (
                    <Knob
                      key={meal}
                      value={mealKcals[meal] ?? 0}
                      min={0}
                      max={kcalTarget || 2000}
                      onChange={v => handleMealKcalChange(meal, v)}
                      label={t(`mealPlan.meals.${meal}`)}
                      color={MEAL_COLOR[meal]}
                      size={88}
                      formatValue={v => `${v}`}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label>{t('mealPlan.form.proteinMin')}</Label>
              <Input type="number" min="0" placeholder={t('mealPlan.form.optional')} {...register('proteinMin')} />
            </div>

            {/* Advanced settings disclosure */}
            <div className="col-span-2 md:col-span-3">
              <button
                type="button"
                onClick={() => setAdvancedOpen(v => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-[#4F7942] hover:text-[#3d6033] transition-colors"
                aria-expanded={advancedOpen}
              >
                {advancedOpen
                  ? <ChevronUp className="h-4 w-4 shrink-0" />
                  : <ChevronDown className="h-4 w-4 shrink-0" />
                }
                {advancedOpen ? t('preferences.advancedToggleOpen') : t('preferences.advancedToggle')}
              </button>

              {advancedOpen && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>{t('mealPlan.form.budgetMax')}</Label>
                    <Input type="number" min="0" placeholder={t('mealPlan.form.optional')} {...register('budgetMax')} />
                  </div>
                  <div className="space-y-1">
                    <Label>{t('mealPlan.form.prepTimeMax')}</Label>
                    <Input type="number" min="0" placeholder={t('mealPlan.form.optional')} {...register('prepTimeMax')} />
                  </div>
                  <div className="space-y-1">
                    <Label>{t('mealPlan.form.maxRepeats')}</Label>
                    <p className="text-xs text-gray-400 mb-1">{t('mealPlan.form.maxRepeatsHint')}</p>
                    <Input type="number" min="1" placeholder={t('mealPlan.form.optional')} {...register('maxRecipeRepetitions')} />
                    {errors.maxRecipeRepetitions && <p className="text-xs text-red-500">{errors.maxRecipeRepetitions.message}</p>}
                  </div>

                  {/* Optimisation priority sliders */}
                  <div className="col-span-2 md:col-span-3 pt-2">
                    <p className="text-sm font-medium text-[#1A1A1A] mb-0.5">{t('mealPlan.form.weightsTitle')}</p>
                    <p className="text-xs text-gray-400 mb-3">{t('mealPlan.form.weightsHint')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                      {([
                        { key: 'leftovers' as WeightKey, label: t('mealPlan.form.weightLeftovers'), enabled: true },
                        { key: 'budget' as WeightKey, label: t('mealPlan.form.weightBudget'), enabled: budgetEnabled },
                        { key: 'prepTime' as WeightKey, label: t('mealPlan.form.weightPrepTime'), enabled: prepTimeEnabled },
                        { key: 'recipeRepeat' as WeightKey, label: t('mealPlan.form.weightRecipeRepeat'), enabled: true },
                      ]).map(({ key, label, enabled }) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <Label className={!enabled ? 'text-gray-400' : undefined}>{label}</Label>
                            <span className={`text-sm font-semibold tabular-nums ${enabled ? 'text-[#4F7942]' : 'text-gray-300'}`}>
                              {weights[key]}%
                            </span>
                          </div>
                          <Slider
                            value={weights[key]}
                            disabled={!enabled}
                            onChange={v => handleWeightChange(key, v)}
                          />
                          {!enabled && (
                            <p className="text-xs text-gray-400">{t('mealPlan.form.weightDisabled')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active dietary restrictions badge */}
            {activeDietaryRestrictions.length > 0 && (
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-gray-500 mb-1.5">{t('mealPlan.form.dietaryActive')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeDietaryRestrictions.map(key => (
                    <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF5F0] border border-[#E8956D]/40 text-xs font-medium text-[#E8956D]">
                      {t(`dietary.${key}`)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="col-span-2 md:col-span-3 flex items-center gap-3 pt-1">
              <Button type="submit" size="lg" disabled={mutation.isPending} className="min-w-40">
                {mutation.isPending ? (
                  <><Spinner className="h-4 w-4" /> {t('mealPlan.form.solving')}</>
                ) : (
                  <><Zap className="h-4 w-4" /> {t('mealPlan.form.generate')}</>
                )}
              </Button>
              {mutation.isPending && (
                <p className="text-sm text-gray-500">
                  {jobProgress?.status === 'PENDING' && jobProgress.queuePosition != null
                    ? t('mealPlan.form.queuePending', { position: jobProgress.queuePosition })
                    : jobProgress?.status === 'RUNNING'
                      ? t('mealPlan.form.queueRunning')
                      : t('mealPlan.form.solverNote')}
                  {jobProgress?.status === 'PENDING' && jobProgress.estimatedWaitSeconds != null && (
                    <span className="text-gray-400">{' · '}{t('mealPlan.form.queueEta', { seconds: jobProgress.estimatedWaitSeconds })}</span>
                  )}
                </p>
              )}
              {mutation.isError && !is409 && !is422 && (
                <p className="text-sm text-red-500">
                  {(mutation.error as Error).message ?? t('mealPlan.form.error')}
                </p>
              )}
            </div>

            {is422 && (
              <div className="col-span-2 md:col-span-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-800">{t('mealPlan.form.infeasibleTitle')}</p>
                <p className="text-sm text-red-700 mt-1">{t('mealPlan.form.infeasibleDesc')}</p>
              </div>
            )}

            {is409 && (
              <div className="col-span-2 md:col-span-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-800">{t('mealPlan.form.existingPlanWarning')}</p>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => mutation.reset()}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="button" size="sm" disabled={mutation.isPending} onClick={handleForceGenerate}>
                    {t('mealPlan.form.generateAnyway')}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {plan && (
        <div>
          {/* Saved confirmation */}
          {plan.savedPlanId && (
            <div className="flex items-center gap-2 mb-4 text-sm text-[#4F7942]">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{t('mealPlan.savedConfirmation')}</span>
            </div>
          )}

          {/* Total summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: t('mealPlan.summary.totalKcal'), value: formatMacro(totalMacros != null ? totalMacros.kcal / plan.days : undefined, ' kcal'), color: '#F28C28' },
              { label: t('mealPlan.summary.totalProtein'), value: formatMacro(totalMacros != null ? totalMacros.protein / plan.days : undefined, 'g'), color: '#F28C28' },
              { label: t('mealPlan.summary.avgCarbs'), value: formatMacro(totalMacros != null ? totalMacros.carbs / plan.days : undefined, 'g'), color: '#F28C28' },
              { label: t('mealPlan.summary.totalFat'), value: formatMacro(totalMacros != null ? totalMacros.fat / plan.days : undefined, 'g'), color: '#4F7942' },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-lg font-headline font-bold" style={{ color }}>{value}</p>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500 mb-1">{t('mealPlan.summary.totalCost')}</p>
                <p className="text-lg font-headline font-bold" style={{ color: '#4F7942' }}>{formatCurrency(totalCost)}</p>
                {costPerDay != null && (
                  <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(costPerDay)} {t('mealPlan.summary.costPerDay')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Day cards */}
          <div className="space-y-3">
            {Array.from({ length: plan.days }, (_, day) => {
              const dayMeals = plan.meals
                .filter(m => m.day === day)
                .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType))
              const dayMacros = sumMacros(dayMeals)
              const dayCost = dayMeals.every(m => m.estimatedCost != null)
                ? dayMeals.reduce((s, m) => s + (m.estimatedCost ?? 0), 0) : null
              const expanded = expandedDays.has(day)

              return (
                <Card key={day}>
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className="w-full text-left"
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-4">
                        <MacroRing macros={dayMacros} size={56} />
                        <div className="flex-1 min-w-0">
                          <p className="font-headline font-bold text-sm text-[#1A1A1A]">
                            {t('mealPlan.day', { day: day + 1 })}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                            <span>{dayMacros.kcal.toFixed(0)} kcal</span>
                            <span>{dayMacros.protein.toFixed(0)}g {t('mealPlan.protein')}</span>
                            <span>{dayMacros.fat.toFixed(0)}g {t('mealPlan.fat')}</span>
                            <span>{dayMacros.carbs.toFixed(0)}g {t('mealPlan.carbs')}</span>
                            {dayCost != null && <span className="text-[#4F7942] font-semibold">{formatCurrency(dayCost)}</span>}
                          </div>
                        </div>
                        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                      </div>
                    </CardContent>
                  </button>

                  {expanded && (
                    <div className="border-t border-[#e5e4e7] px-5 pb-4 pt-3 space-y-3">
                      {dayMeals.map(meal => (
                        <MealSlotCard
                          key={meal.id}
                          meal={meal}
                          savedPlanId={plan.savedPlanId}
                          onUpdate={updateMeal}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
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

function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr)
  const dayOfWeek = date.toLocaleDateString('hu-HU', { weekday: 'long' })
  const dayDate = date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
  return `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}, ${dayDate}`
}

function PlanCalendarView({ plan, onRegenerate }: { plan: Plan; onRegenerate: () => void }) {
  const { t } = useTranslation()
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
                        {formatDayHeader(date)}
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

// ── MealDetailDialog ──────────────────────────────────────────────────────────

function MealDetailDialog({ meal, open, onClose }: { meal: GeneratedMeal; open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'
  const [photoFailed, setPhotoFailed] = useState(false)
  useEffect(() => { setPhotoFailed(false) }, [meal.recipe.id, open])

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', meal.recipe.id],
    queryFn: () => recipesService.get(meal.recipe.id),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  const displayName = getRecipeName(recipe ?? meal.recipe, lang)
  const steps = getRecipeSteps(recipe ?? meal.recipe, lang)
  const photoUrl = recipePhotoUrl(recipe ?? meal.recipe)

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="leading-snug pr-6">{displayName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
        ) : (
          <div className="space-y-4">
            {/* Photo — hidden entirely if image fails to load */}
            {!photoFailed && (
              <div className="w-full h-40 rounded-[12px] overflow-hidden bg-[#F9F7F2]">
                <img
                  src={photoUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={() => setPhotoFailed(true)}
                />
              </div>
            )}

            {/* Timing + macros row */}
            {recipe && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F9F7F2] rounded-[10px] p-2.5 text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">{t('recipes.detail.prep')}</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{recipe.prepTimeMinutes}m</p>
                </div>
                <div className="bg-[#F9F7F2] rounded-[10px] p-2.5 text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">{t('recipes.detail.cook')}</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{recipe.cookTimeMinutes}m</p>
                </div>
              </div>
            )}

            {/* Macros */}
            {meal.macros && (
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  { labelKey: 'recipes.detail.kcal', value: meal.macros.kcal },
                  { labelKey: 'recipes.detail.protein', value: meal.macros.protein },
                  { labelKey: 'recipes.detail.fat', value: meal.macros.fat },
                  { labelKey: 'recipes.detail.carbs', value: meal.macros.carbs },
                ].map(({ labelKey, value }) => (
                  <div key={labelKey} className="bg-[#F9F7F2] rounded-[8px] p-1.5">
                    <span className="sr-only">{t(labelKey)}: {Number(value).toFixed(0)}</span>
                    <p className="text-xs font-bold text-[#1A1A1A]" aria-hidden="true">{Number(value).toFixed(0)}</p>
                    <p className="text-[10px] text-gray-400" aria-hidden="true">{t(labelKey)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Steps */}
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
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── MealSlotCard ──────────────────────────────────────────────────────────────

const MULTIPLIER_STEP = 0.1
const MULTIPLIER_MIN = 0.5
const MULTIPLIER_MAX = 3.0

function MealSlotCard({
  meal,
  savedPlanId,
  onUpdate,
}: {
  meal: GeneratedMeal
  savedPlanId: string | null
  onUpdate: (updated: GeneratedMeal) => void
}) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'
  const [editing, setEditing] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [multiplier, setMultiplier] = useState(meal.servingMultiplier)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const originalMealRef = useRef<GeneratedMeal>(meal)
  const lastSavedRef = useRef({ multiplier: meal.servingMultiplier, recipeId: meal.recipe.id })
  const latestEditRef = useRef({ multiplier: meal.servingMultiplier, recipe: meal.recipe })
  const saveVersionRef = useRef(0)

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [])

  function handleEdit() {
    originalMealRef.current = meal
    lastSavedRef.current = { multiplier: meal.servingMultiplier, recipeId: meal.recipe.id }
    latestEditRef.current = { multiplier: meal.servingMultiplier, recipe: meal.recipe }
    setMultiplier(meal.servingMultiplier)
    setSaveError(null)
    setSaveStatus('idle')
    setEditing(true)
  }

  function handleCancel() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = null
    onUpdate(originalMealRef.current)
    setEditing(false)
    setSaveError(null)
    setSaveStatus('idle')
  }

  function applyChange(newMultiplier: number, newRecipe: Recipe) {
    const newMacros: Macros | null = newRecipe.macros
      ? {
          kcal: newRecipe.macros.kcal * newMultiplier,
          protein: newRecipe.macros.protein * newMultiplier,
          fat: newRecipe.macros.fat * newMultiplier,
          carbs: newRecipe.macros.carbs * newMultiplier,
        }
      : null
    onUpdate({ ...meal, servingMultiplier: newMultiplier, recipe: newRecipe, macros: newMacros })
    latestEditRef.current = { multiplier: newMultiplier, recipe: newRecipe }
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setSaveStatus('idle')
    setSaveError(null)
    const version = ++saveVersionRef.current
    debounceTimer.current = setTimeout(() => doBackendSave(version), 3000)
  }

  async function doBackendSave(version: number) {
    if (!savedPlanId) return
    setSaveStatus('saving')
    try {
      const { multiplier: mult, recipe } = latestEditRef.current
      const body: { recipeId?: string; servingMultiplier?: number } = {}
      const multRounded = Math.round(mult * 10) / 10
      if (Math.abs(multRounded - lastSavedRef.current.multiplier) > 0.001)
        body.servingMultiplier = multRounded
      if (recipe.id !== lastSavedRef.current.recipeId)
        body.recipeId = recipe.id
      if (Object.keys(body).length === 0) {
        if (saveVersionRef.current === version) setSaveStatus('saved')
        return
      }
      const updated = await mealPlansService.updateSlot(savedPlanId, meal.id, body)
      if (saveVersionRef.current === version) {
        lastSavedRef.current = { multiplier: updated.servingMultiplier, recipeId: updated.recipeId }
        onUpdate(savedSlotToMeal(updated))
        setSaveStatus('saved')
      }
    } catch {
      if (saveVersionRef.current === version) {
        setSaveStatus('error')
        setSaveError(t('mealPlan.editSlot.saveError'))
      }
    }
  }

  function stepMultiplier(delta: number) {
    const next = Math.round((latestEditRef.current.multiplier + delta) * 10) / 10
    const clamped = Math.min(MULTIPLIER_MAX, Math.max(MULTIPLIER_MIN, next))
    setMultiplier(clamped)
    applyChange(clamped, latestEditRef.current.recipe)
  }

  function handleRecipeSelect(recipe: Recipe) {
    applyChange(latestEditRef.current.multiplier, recipe)
  }

  const displayName = getRecipeName(meal.recipe, lang)

  return (
    <div className="bg-[#F9F7F2] rounded-[12px] overflow-hidden">
      {/* View row */}
      <div className="flex gap-3 p-3">
        <div className="shrink-0">
          <span
            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
            style={{ background: MEAL_COLOR[meal.mealType], fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t(`mealPlan.meals.${meal.mealType}`)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#1A1A1A] leading-snug truncate">{displayName}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {meal.recipe.prepTimeMinutes + meal.recipe.cookTimeMinutes}m
            </span>
            <span>×{meal.servingMultiplier?.toFixed(1)} {t('mealPlan.serving')}</span>
            {meal.macros && <span>{meal.macros.kcal.toFixed(0)} kcal</span>}
            {meal.estimatedCost != null && (
              <span className="text-[#4F7942] font-medium">
                {formatCurrency(meal.estimatedCost)}
              </span>
            )}
          </div>
          {(meal.recipe.tags ?? []).length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1">
              {(meal.recipe.tags ?? []).map(tag => (
                <Badge key={tag} variant="gray">{t(`recipes.tags.${tag}`, { defaultValue: tag })}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-start gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="p-1 rounded-md text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-200/60 transition-colors"
            aria-label={t('mealPlan.viewRecipe')}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {savedPlanId && !editing && (
            <button
              type="button"
              onClick={handleEdit}
              className="p-1 rounded-md text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-200/60 transition-colors"
              aria-label={t('mealPlan.editSlot.edit')}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
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
                onClick={() => stepMultiplier(-MULTIPLIER_STEP)}
                disabled={multiplier <= MULTIPLIER_MIN}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-10 text-center text-sm font-semibold tabular-nums text-[#1A1A1A]">
                ×{multiplier.toFixed(1)}
              </span>
              <button
                type="button"
                onClick={() => stepMultiplier(MULTIPLIER_STEP)}
                disabled={multiplier >= MULTIPLIER_MAX}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Recipe substitution */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <span className="text-xs text-gray-500 block truncate">{displayName}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              className="shrink-0 text-xs h-7 px-2 gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              {t('mealPlan.editSlot.swapRecipe')}
            </Button>
          </div>

          {/* Status + Cancel */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === 'saving' && (
                <><Spinner className="h-3 w-3" /><span className="text-gray-400">{t('mealPlan.editSlot.saving')}</span></>
              )}
              {saveStatus === 'saved' && (
                <><Check className="h-3 w-3 text-[#4F7942]" /><span className="text-[#4F7942]">{t('mealPlan.editSlot.saved')}</span></>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-500">{saveError}</span>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              {t('mealPlan.editSlot.cancel')}
            </Button>
          </div>
        </div>
      )}

      <MealDetailDialog
        meal={meal}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      <RecipePickerDialog
        open={pickerOpen}
        currentRecipeId={meal.recipe.id}
        onSelect={handleRecipeSelect}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  )
}
