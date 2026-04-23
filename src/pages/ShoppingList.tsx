import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ShoppingCart, ExternalLink, AlertCircle, Package } from 'lucide-react'
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
        <Header title="Shopping List" />
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center">
            <ShoppingCart className="h-10 w-10 text-[#F28C28] mb-3" />
            <h3 className="font-headline font-bold text-[#1A1A1A] mb-1">No active meal plan</h3>
            <p className="text-sm text-gray-500 mb-4">Generate a meal plan first to create a shopping list.</p>
            <Button onClick={() => navigate('/meal-plans')}>Go to Meal Plans</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const shoppingList = mutation.data

  // Group items by category
  const grouped = shoppingList
    ? shoppingList.items.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
        const cat = item.ingredientCategory ?? 'OTHER'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
      }, {})
    : {}

  const missingCount = shoppingList?.items.filter(i => !i.retailProduct).length ?? 0

  return (
    <div>
      <Header
        title="Shopping List"
        subtitle={plan ? `Based on your ${plan.days}-day meal plan` : undefined}
        actions={
          <Button variant="secondary" onClick={() => navigate('/meal-plans')}>
            Back to Plan
          </Button>
        }
      />

      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-gray-500">Building your shopping list…</p>
        </div>
      )}

      {mutation.isError && (
        <Card className="border-red-200">
          <CardContent className="py-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{(mutation.error as Error).message ?? 'Failed to build shopping list'}</p>
          </CardContent>
        </Card>
      )}

      {shoppingList && (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500 mb-1">Total items</p>
                <p className="text-xl font-headline font-bold text-[#1A1A1A]">{shoppingList.items.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500 mb-1">Estimated total</p>
                <p className="text-xl font-headline font-bold text-[#4F7942]">
                  {formatCurrency(shoppingList.totalEstimatedCost, shoppingList.currency)}
                </p>
              </CardContent>
            </Card>
            {missingCount > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4">
                  <p className="text-xs text-amber-600 mb-1">No retail match</p>
                  <p className="text-xl font-headline font-bold text-amber-700">{missingCount} items</p>
                </CardContent>
              </Card>
            )}
          </div>

          {missingCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-[12px] px-4 py-3 mb-4 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {missingCount} ingredient{missingCount > 1 ? 's have' : ' has'} no Tesco product match. Buy these separately.
            </div>
          )}

          {/* Grouped list */}
          {Object.entries(grouped).map(([category, items]) => (
            <Card key={category} className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant={CATEGORY_COLOR[category as IngredientCategory] ?? 'gray'}>{category}</Badge>
                  <span className="text-gray-400 font-normal text-sm">{items.length} items</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {items.map(item => (
                  <ShoppingItem key={item.ingredientId + item.unit} item={item} currency={shoppingList.currency} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function ShoppingItem({ item, currency }: { item: ShoppingListItem; currency: string }) {
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
        <p className="font-semibold text-sm text-[#1A1A1A]">{item.ingredientName}</p>
        <p className="text-xs text-gray-500">
          Total needed: <span className="font-medium">{item.totalAmount.toFixed(1)} {item.unit}</span>
        </p>

        {hasProduct ? (
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <p className="text-xs text-[#1A1A1A]">
              <span className="font-medium">{item.retailProduct!.name}</span>
              {item.retailProduct!.brand && <span className="text-gray-400"> · {item.retailProduct!.brand}</span>}
            </p>
            <p className="text-xs text-gray-400">
              {item.retailProduct!.packageSize}{item.retailProduct!.unit} · {formatCurrency(item.retailProduct!.price, currency)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-amber-600 mt-1">No retail product available — buy separately</p>
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
            Tesco <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}
