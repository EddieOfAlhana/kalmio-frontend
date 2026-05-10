import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { planService } from '@/services/plans'
import { cn } from '@/lib/utils'
import type { MealType } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type CaloriePreset = 'low' | 'moderate' | 'high'
type ShoppingCadence = 7 | 14

const CALORIE_MAP: Record<CaloriePreset, number> = {
  low: 1600,
  moderate: 2000,
  high: 2400,
}

const DIETARY_OPTIONS: { key: string; labelKey: string }[] = [
  { key: 'vegetarian', labelKey: 'dietary.vegetarian' },
  { key: 'vegan', labelKey: 'dietary.vegan' },
  { key: 'glutenFree', labelKey: 'dietary.glutenFree' },
  { key: 'dairyFree', labelKey: 'dietary.dairyFree' },
  { key: 'lactoseFree', labelKey: 'dietary.lactoseFree' },
  { key: 'eggFree', labelKey: 'dietary.eggFree' },
  { key: 'nutFree', labelKey: 'dietary.nutFree' },
  { key: 'peanutFree', labelKey: 'dietary.peanutFree' },
]

const DAY_KEYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'SNACK']

function buildMealCalorieTargets(total: number): Record<string, number> {
  const targets: Record<string, number> = {
    BREAKFAST: Math.round(total * 0.25),
    LUNCH: Math.round(total * 0.35),
    DINNER: Math.round(total * 0.30),
    SNACK: Math.round(total * 0.10),
  }
  return targets
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PlanPreferencesForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [householdSize, setHouseholdSize] = useState(1)
  const [caloriePreset, setCaloriePreset] = useState<CaloriePreset>('moderate')
  const [restrictions, setRestrictions] = useState<Set<string>>(new Set())
  const [cadence, setCadence] = useState<ShoppingCadence>(7)
  const [shoppingDay, setShoppingDay] = useState<string>('sunday')

  const mutation = useMutation({
    mutationFn: planService.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plan', 'active'] })
      navigate('/app/meal-plans')
    },
  })

  function toggleRestriction(key: string) {
    setRestrictions(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const kcal = CALORIE_MAP[caloriePreset]
    const mealCalorieTargets = buildMealCalorieTargets(kcal)
    const dietaryRestrictions = restrictions.size > 0 ? Array.from(restrictions) : null

    mutation.mutate({
      startDate: todayIso(),
      cycleDays: cadence,
      constraints: {
        days: cadence,
        selectedMeals: MEAL_ORDER.filter(m =>
          m === 'BREAKFAST' || m === 'LUNCH' || m === 'DINNER' || m === 'SNACK'
        ),
        constraints: {
          kcalTarget: kcal,
          proteinMin: 0,
          mealCalorieTargets,
          dietaryRestrictions,
        },
      },
    })
  }

  const caloriePresets: { key: CaloriePreset; labelKey: string; subKey: string }[] = [
    { key: 'low', labelKey: 'preferences.caloriePresets.low', subKey: 'preferences.caloriePresets.lowSub' },
    { key: 'moderate', labelKey: 'preferences.caloriePresets.moderate', subKey: 'preferences.caloriePresets.moderateSub' },
    { key: 'high', labelKey: 'preferences.caloriePresets.high', subKey: 'preferences.caloriePresets.highSub' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-lg mx-auto">
      {/* Title */}
      <div>
        <h2 className="font-headline font-bold text-xl text-[#1A1A1A]">{t('preferences.title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('preferences.subtitle')}</p>
      </div>

      {/* 1. Household size */}
      <section>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-3">{t('preferences.householdSize')}</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setHouseholdSize(n)}
              className={cn(
                'w-10 h-10 rounded-[10px] border text-sm font-semibold transition-colors',
                householdSize === n
                  ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                  : 'border-gray-200 bg-white text-[#1A1A1A] hover:border-gray-400'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Calorie preset */}
      <section>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-3">{t('preferences.calorieTarget')}</p>
        <div className="grid grid-cols-3 gap-2">
          {caloriePresets.map(({ key, labelKey, subKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => setCaloriePreset(key)}
              className={cn(
                'rounded-[12px] border p-3 text-left transition-colors',
                caloriePreset === key
                  ? 'border-[#4F7942] bg-[#4F7942]/8'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              )}
            >
              <p className="font-semibold text-sm text-[#1A1A1A]">{t(labelKey)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t(subKey)}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Dietary restrictions */}
      <section>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-3">{t('preferences.restrictions')}</p>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map(({ key, labelKey }) => {
            const active = restrictions.has(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleRestriction(key)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-sm font-medium transition-colors',
                  active
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                )}
              >
                {t(labelKey)}
              </button>
            )
          })}
        </div>
      </section>

      {/* 4. Shopping cadence */}
      <section>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-3">{t('preferences.shoppingCadence')}</p>
        <div className="grid grid-cols-2 gap-2">
          {([7, 14] as ShoppingCadence[]).map(days => (
            <button
              key={days}
              type="button"
              onClick={() => setCadence(days)}
              className={cn(
                'rounded-[12px] border p-3 text-left transition-colors',
                cadence === days
                  ? 'border-[#4F7942] bg-[#4F7942]/8'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              )}
            >
              <p className="font-semibold text-sm text-[#1A1A1A]">
                {days === 7 ? t('preferences.cadenceWeekly') : t('preferences.cadenceBiweekly')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{days} {days === 7 ? 'nap' : 'nap'}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Shopping day */}
      <section>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-3">{t('preferences.shoppingDay')}</p>
        <select
          value={shoppingDay}
          onChange={e => setShoppingDay(e.target.value)}
          className="flex h-10 w-full rounded-[12px] border border-input bg-background px-3 py-2 text-sm"
        >
          {DAY_KEYS.map(day => (
            <option key={day} value={day}>
              {t(`preferences.days.${day}`)}
            </option>
          ))}
        </select>
      </section>

      {/* Submit */}
      <div className="pt-2">
        {mutation.isError && (
          <p className="text-xs text-red-500 mb-3">{t('preferences.error')}</p>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? (
            <><Spinner className="h-4 w-4" /> {t('preferences.generating')}</>
          ) : (
            t('preferences.generate')
          )}
        </Button>
      </div>
    </form>
  )
}
