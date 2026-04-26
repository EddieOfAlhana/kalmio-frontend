import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { UtensilsCrossed, ChefHat, Leaf, ShoppingCart, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/Header'
import { MacroRing } from '@/components/ui/macro-ring'
import { formatCurrency } from '@/lib/utils'
import { recipesService } from '@/services/recipes'
import { ingredientsService } from '@/services/ingredients'
import { useMealPlanStore } from '@/store/mealPlan'

export function Dashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const activePlan = useMealPlanStore(s => s.plan)

  const { data: recipes = [] } = useQuery({ queryKey: ['recipes'], queryFn: recipesService.list, staleTime: 30_000 })
  const { data: ingredients = [] } = useQuery({ queryKey: ['ingredients'], queryFn: ingredientsService.list, staleTime: 30_000 })

  const dailySummaries = activePlan
    ? Array.from({ length: activePlan.days }, (_, day) => {
        const dayMeals = activePlan.meals.filter(m => m.day === day)
        const kcal = dayMeals.reduce((s, m) => s + (m.macros?.kcal ?? 0), 0)
        const protein = dayMeals.reduce((s, m) => s + (m.macros?.protein ?? 0), 0)
        const fat = dayMeals.reduce((s, m) => s + (m.macros?.fat ?? 0), 0)
        const carbs = dayMeals.reduce((s, m) => s + (m.macros?.carbs ?? 0), 0)
        const cost = dayMeals.every(m => m.estimatedCost != null)
          ? dayMeals.reduce((s, m) => s + (m.estimatedCost ?? 0), 0)
          : null
        return { day, kcal, protein, fat, carbs, cost }
      })
    : []

  return (
    <div>
      <Header
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <Button onClick={() => navigate('/app/meal-plans')}>
            <UtensilsCrossed className="h-4 w-4" />
            {t('dashboard.newPlan')}
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { icon: ChefHat, label: t('dashboard.stats.recipes'), value: recipes.length, to: '/app/recipes', color: '#F28C28' },
          { icon: Leaf, label: t('dashboard.stats.ingredients'), value: ingredients.length, to: '/app/ingredients', color: '#4F7942' },
          { icon: UtensilsCrossed, label: t('dashboard.stats.activePlan'), value: activePlan ? `${activePlan.days}d` : '—', to: '/app/meal-plans', color: '#1A1A1A' },
          { icon: ShoppingCart, label: t('dashboard.stats.totalCost'), value: activePlan ? formatCurrency(activePlan.totalEstimatedCost) : '—', to: '/app/shopping-list', color: '#F28C28' },
        ].map(({ icon: Icon, label, value, to, color }) => (
          <button key={label} onClick={() => navigate(to)} className="text-left focus:outline-none">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg" style={{ background: `${color}18` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{label}</span>
                </div>
                <p className="text-xl font-headline font-bold text-[#1A1A1A]">{value}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Active plan summary */}
      {activePlan ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-headline font-bold text-[#1A1A1A]">
              {t('dashboard.activePlan.title', { days: activePlan.days })}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/meal-plans')}>
              {t('dashboard.activePlan.view')} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {dailySummaries.slice(0, 4).map(day => (
              <Card key={day.day}>
                <CardContent className="pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-3">
                    {t('dashboard.activePlan.day', { day: day.day + 1 })}
                  </p>
                  <div className="flex items-center gap-3">
                    <MacroRing
                      macros={{ kcal: day.kcal, protein: day.protein, fat: day.fat, carbs: day.carbs }}
                      size={64}
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 rounded-full bg-[#F28C28] shrink-0" />
                        <span className="text-gray-500">{t('dashboard.activePlan.protein')}</span>
                        <span className="font-semibold ml-auto">{day.protein.toFixed(0)}g</span>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 rounded-full bg-[#4F7942] shrink-0" />
                        <span className="text-gray-500">{t('dashboard.activePlan.fat')}</span>
                        <span className="font-semibold ml-auto">{day.fat.toFixed(0)}g</span>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 rounded-full bg-[#1A1A1A] shrink-0" />
                        <span className="text-gray-500">{t('dashboard.activePlan.carbs')}</span>
                        <span className="font-semibold ml-auto">{day.carbs.toFixed(0)}g</span>
                      </div>
                      {day.cost != null && (
                        <div className="pt-1 text-[#4F7942] font-semibold">
                          {formatCurrency(day.cost)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {activePlan.days > 4 && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/app/meal-plans')}>
              {t('dashboard.activePlan.moreDays', { count: activePlan.days - 4 })} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center">
            <UtensilsCrossed className="h-10 w-10 text-[#F28C28] mb-3" />
            <h3 className="font-headline font-bold text-[#1A1A1A] mb-1">{t('dashboard.noActivePlan.title')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('dashboard.noActivePlan.description')}</p>
            <Button onClick={() => navigate('/app/meal-plans')}>{t('dashboard.noActivePlan.button')}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
