/**
 * PlannerDayCard — condensed day view card.
 *
 * Shows: date label (Hungarian short form), day totals (kcal/P/F/C/cost),
 * circular calorie indicator, one row per meal slot.
 */
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { PlannerMealRow } from './PlannerMealRow'
import type { PlannedMealSummary, MealType } from '@/types'

interface DayTotals {
  kcal: number
  protein: number
  fat: number
  carbs: number
  cost: number
}

function computeDayTotals(meals: PlannedMealSummary[]): DayTotals {
  return meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + (m.macros?.kcal ?? 0),
      protein: acc.protein + (m.macros?.protein ?? 0),
      fat: acc.fat + (m.macros?.fat ?? 0),
      carbs: acc.carbs + (m.macros?.carbs ?? 0),
      cost: acc.cost + (m.estimatedCostPerServing ?? 0),
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0, cost: 0 }
  )
}

/** Circular calorie indicator — SVG ring. */
function CalorieRing({ kcal, target = 2000 }: { kcal: number; target?: number }) {
  const pct = Math.min(kcal / target, 1)
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const color = pct > 1.05 ? '#ef4444' : pct > 0.85 ? '#10b981' : '#6366f1'

  return (
    <svg width={44} height={44} aria-label={`${kcal} kcal`} role="img">
      <circle cx={22} cy={22} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4} />
      <circle
        cx={22} cy={22} r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
      <text x={22} y={22} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={600} fill="#1A1A1A">
        {kcal >= 1000 ? `${(kcal / 1000).toFixed(1)}k` : String(kcal)}
      </text>
    </svg>
  )
}

interface PlannerDayCardProps {
  date: string  // "YYYY-MM-DD"
  meals: PlannedMealSummary[]
  allMemberIds: string[]
  memberNames: Record<string, string>
  onViewRecipe?: (recipeId: string) => void
  onEditSlot?: (mealId: string) => void
}

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'SNACK']

export function PlannerDayCard({
  date,
  meals,
  allMemberIds,
  memberNames,
  onViewRecipe,
  onEditSlot,
}: PlannerDayCardProps) {
  const { t, i18n } = useTranslation()
  const totals = computeDayTotals(meals)

  const dateObj = new Date(date)
  const locale = i18n.resolvedLanguage === 'hu' ? 'hu-HU' : 'en-GB'
  const dateLabel = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', weekday: 'short' }).format(dateObj)

  const sortedMeals = [...meals].sort(
    (a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType)
  )

  return (
    <Card>
      <CardContent className="p-0">
        {/* Day header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#e5e4e7]">
          <span className="font-headline font-bold text-sm text-[#1A1A1A] capitalize">{dateLabel}</span>
          <div className="flex items-center gap-3">
            {/* Macro summary — cost hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#6b7280]">
              <span>{Math.round(totals.protein)}g P</span>
              <span>{Math.round(totals.fat)}g F</span>
              <span>{Math.round(totals.carbs)}g C</span>
              {totals.cost > 0 && (
                <span className="hidden md:inline">
                  {t('plan.planner.costLabel', { cost: Math.round(totals.cost) })}
                </span>
              )}
            </div>
            <CalorieRing kcal={Math.round(totals.kcal)} />
          </div>
        </div>

        {/* Meal rows */}
        <div className="flex flex-col divide-y divide-[#f3f4f6] px-1 pb-1">
          {sortedMeals.length === 0 ? (
            <p className="text-xs text-[#9ca3af] px-3 py-3">{t('plan.planner.noMealsDay')}</p>
          ) : (
            sortedMeals.map(meal => (
              <PlannerMealRow
                key={meal.id}
                meal={meal}
                allMemberIds={allMemberIds}
                memberNames={memberNames}
                divergentMemberIds={[]}
                onViewRecipe={onViewRecipe}
                onEditSlot={onEditSlot}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
