import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShoppingCart, ExternalLink, AlertCircle, Package, Trash2, Archive } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { mealPlansService } from '@/services/mealPlans'
import { useMealPlanStore } from '@/store/mealPlan'
import { formatCurrency } from '@/lib/utils'
import type { ShoppingListItem, IngredientCategory } from '@/types'

const CATEGORY_COLOR: Record<IngredientCategory, 'green' | 'orange' | 'gray' | 'black'> = {
  PROTEIN: 'orange', CARB: 'black', FAT: 'gray', VEGGIE: 'green', SPICE: 'gray',
}

export function ShoppingList() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const plan = useMealPlanStore(s => s.plan)

  const mutation = useMutation({
    mutationFn: mealPlansService.shoppingList,
  })

  useEffect(() => {
    if (!plan) return
    mutation.mutate({
      meals: plan.meals.map(m => ({ recipeId: m.recipe.id, servingMultiplier: m.servingMultiplier })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id])

  if (!plan) {
    return (
      <div>
        <Header title={t('shoppingList.title')} />
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center">
            <ShoppingCart className="h-10 w-10 text-[#F28C28] mb-3" />
            <h3 className="font-headline font-bold text-[#1A1A1A] mb-1">{t('shoppingList.noActivePlan.title')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('shoppingList.noActivePlan.description')}</p>
            <Button onClick={() => navigate('/app/meal-plans')}>{t('shoppingList.noActivePlan.button')}</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const shoppingList = mutation.data

  const grouped = shoppingList
    ? shoppingList.items.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
        const cat = item.ingredientCategory ?? 'OTHER'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
      }, {})
    : {}

  const missingCount = shoppingList?.items.filter(i => !i.retailProduct).length ?? 0
  const wasteItems = shoppingList?.items.filter(
    i => i.retailProduct?.wasteAmount != null && i.retailProduct.wasteAmount > 0
  ) ?? []

  const totalWasteGrams = wasteItems
    .filter(i => i.retailProduct!.unit === 'G')
    .reduce((sum, i) => sum + (i.retailProduct!.wasteAmount ?? 0), 0)

  const totalWasteCost = shoppingList?.totalWasteCost
    ?? wasteItems.reduce((sum, i) => sum + (i.retailProduct!.wasteCost ?? 0), 0)

  return (
    <div>
      <Header
        title={t('shoppingList.title')}
        subtitle={plan ? t('shoppingList.subtitle', { days: plan.days }) : undefined}
        actions={
          <Button variant="secondary" onClick={() => navigate('/app/meal-plans')}>
            {t('shoppingList.backToPlan')}
          </Button>
        }
      />

      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-gray-500">{t('shoppingList.building')}</p>
        </div>
      )}

      {mutation.isError && (
        <Card className="border-red-200">
          <CardContent className="py-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{(mutation.error as Error).message ?? t('shoppingList.error')}</p>
          </CardContent>
        </Card>
      )}

      {shoppingList && (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500 mb-1">{t('shoppingList.summary.totalItems')}</p>
                <p className="text-xl font-headline font-bold text-[#1A1A1A]">{shoppingList.items.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500 mb-1">{t('shoppingList.summary.estimatedTotal')}</p>
                <p className="text-xl font-headline font-bold text-[#4F7942]">
                  {formatCurrency(shoppingList.totalEstimatedCost, shoppingList.currency)}
                </p>
              </CardContent>
            </Card>
            {shoppingList.totalWasteCost != null && (
              <Card className={shoppingList.totalWasteCost > 0 ? 'border-orange-200 bg-orange-50' : ''}>
                <CardContent className="pt-4">
                  <p className={`text-xs mb-1 ${shoppingList.totalWasteCost > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {t('shoppingList.summary.totalWaste')}
                  </p>
                  <p className={`text-xl font-headline font-bold ${shoppingList.totalWasteCost > 0 ? 'text-orange-700' : 'text-[#4F7942]'}`}>
                    {formatCurrency(shoppingList.totalWasteCost, shoppingList.currency)}
                  </p>
                </CardContent>
              </Card>
            )}
            {missingCount > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4">
                  <p className="text-xs text-amber-600 mb-1">{t('shoppingList.summary.noRetailMatch')}</p>
                  <p className="text-xl font-headline font-bold text-amber-700">{missingCount} {t('shoppingList.items')}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {missingCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-[12px] px-4 py-3 mb-4 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {t('shoppingList.missingItems', { count: missingCount })}
            </div>
          )}

          {/* Grouped list */}
          {Object.entries(grouped).map(([category, items]) => (
            <Card key={category} className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant={CATEGORY_COLOR[category as IngredientCategory] ?? 'gray'}>{category}</Badge>
                  <span className="text-gray-400 font-normal text-sm">{items.length} {t('shoppingList.items')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {items.map(item => (
                  <ShoppingItem key={item.ingredientId + item.unit} item={item} currency={shoppingList.currency} />
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Waste summary */}
          <Card className={wasteItems.length > 0 ? 'border-orange-200' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trash2 className="h-4 w-4 text-orange-500" />
                {t('shoppingList.waste.summaryTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {wasteItems.length === 0 ? (
                <p className="text-sm text-[#4F7942]">{t('shoppingList.waste.none')}</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    {t('shoppingList.waste.summaryDesc')}
                    {shoppingList.items.some(i => i.pantryItem) && (
                      <span className="ml-1 text-green-600">{t('shoppingList.waste.pantryExcluded')}</span>
                    )}
                  </p>
                  <div className="space-y-2">
                    {wasteItems.map(item => (
                      <div key={item.ingredientId + item.unit} className="flex items-center justify-between text-sm">
                        <span className="text-[#1A1A1A] font-medium">{item.ingredientName}</span>
                        <span className="text-orange-600 text-xs">
                          {item.retailProduct!.wasteAmount!.toFixed(item.retailProduct!.unit === 'PIECE' ? 0 : 0)} {item.retailProduct!.unit}
                          {' · '}
                          {t('shoppingList.waste.cost', { cost: formatCurrency(item.retailProduct!.wasteCost, shoppingList.currency) })}
                        </span>
                      </div>
                    ))}
                  </div>
                  {(totalWasteCost > 0 || totalWasteGrams > 0) && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-100">
                      <span className="text-sm font-semibold text-[#1A1A1A]">{t('shoppingList.summary.totalWaste')}</span>
                      <span className="text-sm font-bold text-orange-700">
                        {totalWasteGrams > 0 && <>{Math.round(totalWasteGrams)} g</>}
                        {totalWasteGrams > 0 && totalWasteCost > 0 && ' · '}
                        {totalWasteCost > 0 && formatCurrency(totalWasteCost, shoppingList.currency)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function ShoppingItem({ item, currency }: { item: ShoppingListItem; currency: string }) {
  const { t } = useTranslation()
  const hasProduct = !!item.retailProduct

  return (
    <div className={`flex items-start gap-3 p-3 rounded-[12px] ${hasProduct ? 'bg-[#F9F7F2]' : 'bg-amber-50 border border-amber-200'}`}>
      <div className="shrink-0 mt-0.5">
        {hasProduct
          ? <Package className="h-4 w-4 text-[#4F7942]" />
          : <AlertCircle className="h-4 w-4 text-amber-500" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <p className="font-semibold text-sm text-[#1A1A1A]">{item.ingredientName}</p>
          {item.pantryItem && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
              <Archive className="h-2.5 w-2.5" />
              {t('shoppingList.pantryLabel')}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {t('shoppingList.totalNeeded')} <span className="font-medium">{item.totalAmount.toFixed(1)} {item.unit}</span>
        </p>

        {hasProduct ? (
          <div className="mt-1.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-[#1A1A1A]">
                <span className="font-medium">{item.retailProduct!.name}</span>
                {item.retailProduct!.brand && <span className="text-gray-400"> · {item.retailProduct!.brand}</span>}
              </p>
              <p className="text-xs text-gray-400">
                {item.retailProduct!.packageSize}{item.retailProduct!.unit} · {formatCurrency(item.retailProduct!.price, currency)}
              </p>
            </div>
            {item.retailProduct!.wasteAmount != null && item.retailProduct!.wasteAmount > 0 && (
              <p className="text-xs text-orange-500">
                {t('shoppingList.waste.amount', {
                  amount: item.retailProduct!.wasteAmount.toFixed(item.retailProduct!.unit === 'PIECE' ? 0 : 0),
                  unit: item.retailProduct!.unit,
                })}
                {item.retailProduct!.wasteCost != null && (
                  <> · {t('shoppingList.waste.cost', { cost: formatCurrency(item.retailProduct!.wasteCost, currency) })}</>
                )}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-600 mt-1">{t('shoppingList.noRetailProduct')}</p>
        )}
      </div>

      <div className="shrink-0 text-right">
        {item.retailProduct?.estimatedCost != null && (
          <p className="text-sm font-bold text-[#4F7942]">
            {formatCurrency(item.retailProduct.estimatedCost, currency)}
          </p>
        )}
        {item.retailProduct?.remoteUrl && (
          <a
            href={item.retailProduct.remoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#F28C28] hover:underline mt-1"
          >
            {t('shoppingList.tesco')} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}
