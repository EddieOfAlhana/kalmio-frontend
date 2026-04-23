import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap, Clock, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { MacroRing } from '@/components/ui/macro-ring'
import { mealPlansService } from '@/services/mealPlans'
import { useMealPlanStore } from '@/store/mealPlan'
import { formatCurrency, formatMacro } from '@/lib/utils'
import type { GeneratedMeal, MealType, Macros } from '@/types'

const MEAL_COLOR: Record<MealType, string> = {
  BREAKFAST: '#F28C28', LUNCH: '#4F7942', DINNER: '#1A1A1A', SNACK: '#6b7280',
}

const schema = z.object({
  days: z.coerce.number().int().min(1).max(14),
  mealsPerDay: z.coerce.number().int().min(1).max(6),
  kcalTarget: z.coerce.number().min(500),
  proteinMin: z.coerce.number().optional().nullable(),
  budgetMax: z.coerce.number().optional().nullable(),
  prepTimeMax: z.coerce.number().int().optional().nullable(),
})
type FormValues = z.infer<typeof schema>

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
  const { plan, setPlan } = useMealPlanStore()
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]))

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { days: 7, mealsPerDay: 3, kcalTarget: 2000, proteinMin: 150 },
  })

  const mutation = useMutation({
    mutationFn: mealPlansService.generate,
    onSuccess: result => { setPlan(result); setExpandedDays(new Set([0])) },
  })

  function onSubmit(v: FormValues) {
    mutation.mutate({
      days: v.days,
      mealsPerDay: v.mealsPerDay,
      constraints: {
        kcalTarget: v.kcalTarget,
        proteinMin: v.proteinMin ?? null,
        budgetMax: v.budgetMax ?? null,
        prepTimeMax: v.prepTimeMax ?? null,
      },
    })
  }

  function toggleDay(day: number) {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day); else next.add(day)
      return next
    })
  }

  const totalMacros = plan ? sumMacros(plan.meals) : null

  return (
    <div>
      <Header
        title="Meal Plan"
        subtitle="Solver-generated, nutrition-optimised weekly plans"
        actions={
          plan && (
            <Button variant="outline" onClick={() => navigate('/shopping-list')}>
              <ShoppingCart className="h-4 w-4" /> Shopping List
            </Button>
          )
        }
      />

      {/* Generation form */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Generate New Plan</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Days <span className="text-gray-400 text-xs">(1–14)</span></Label>
              <Input type="number" min="1" max="14" {...register('days')} />
              {errors.days && <p className="text-xs text-red-500">{errors.days.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Meals / day <span className="text-gray-400 text-xs">(1–6)</span></Label>
              <Input type="number" min="1" max="6" {...register('mealsPerDay')} />
            </div>
            <div className="space-y-1">
              <Label>Calorie target (kcal) *</Label>
              <Input type="number" min="500" {...register('kcalTarget')} />
              {errors.kcalTarget && <p className="text-xs text-red-500">{errors.kcalTarget.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Min protein (g)</Label>
              <Input type="number" min="0" placeholder="optional" {...register('proteinMin')} />
            </div>
            <div className="space-y-1">
              <Label>Budget max (HUF)</Label>
              <Input type="number" min="0" placeholder="optional" {...register('budgetMax')} />
            </div>
            <div className="space-y-1">
              <Label>Max prep time (min)</Label>
              <Input type="number" min="0" placeholder="optional" {...register('prepTimeMax')} />
            </div>

            <div className="col-span-2 md:col-span-3 flex items-center gap-3 pt-1">
              <Button type="submit" size="lg" disabled={mutation.isPending} className="min-w-40">
                {mutation.isPending ? (
                  <><Spinner className="h-4 w-4" /> Solving…</>
                ) : (
                  <><Zap className="h-4 w-4" /> Generate Plan</>
                )}
              </Button>
              {mutation.isPending && (
                <p className="text-sm text-gray-500">The solver may take up to 15 seconds…</p>
              )}
              {mutation.isError && (
                <p className="text-sm text-red-500">
                  {(mutation.error as Error).message ?? 'Generation failed. Make sure you have recipes.'}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {plan && (
        <div>
          {/* Total summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total kcal', value: formatMacro(totalMacros?.kcal, ' kcal'), color: '#F28C28' },
              { label: 'Total protein', value: formatMacro(totalMacros?.protein, 'g'), color: '#F28C28' },
              { label: 'Total fat', value: formatMacro(totalMacros?.fat, 'g'), color: '#4F7942' },
              { label: 'Total cost', value: formatCurrency(plan.totalEstimatedCost), color: '#4F7942' },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-lg font-headline font-bold" style={{ color }}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Day cards */}
          <div className="space-y-3">
            {Array.from({ length: plan.days }, (_, day) => {
              const dayMeals = plan.meals.filter(m => m.day === day)
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
                          <p className="font-headline font-bold text-sm text-[#1A1A1A]">Day {day + 1}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                            <span>{dayMacros.kcal.toFixed(0)} kcal</span>
                            <span>{dayMacros.protein.toFixed(0)}g protein</span>
                            <span>{dayMacros.fat.toFixed(0)}g fat</span>
                            <span>{dayMacros.carbs.toFixed(0)}g carbs</span>
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
                        <MealSlotCard key={meal.id} meal={meal} />
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

function MealSlotCard({ meal }: { meal: GeneratedMeal }) {
  return (
    <div className="flex gap-3 bg-[#F9F7F2] rounded-[12px] p-3">
      <div className="shrink-0">
        <span
          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
          style={{ background: MEAL_COLOR[meal.mealType], fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {meal.mealType}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#1A1A1A] leading-snug truncate">{meal.recipe.name}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {meal.recipe.prepTimeMinutes + meal.recipe.cookTimeMinutes}m
          </span>
          <span>×{meal.servingMultiplier?.toFixed(1)} serving</span>
          {meal.macros && <span>{meal.macros.kcal.toFixed(0)} kcal</span>}
          {meal.estimatedCost != null && (
            <span className="text-[#4F7942] font-medium">
              {formatCurrency(meal.estimatedCost)}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 shrink-0 flex-wrap justify-end items-start">
        {(meal.recipe.tags ?? []).map(t => <Badge key={t} variant="gray">{t}</Badge>)}
      </div>
    </div>
  )
}
