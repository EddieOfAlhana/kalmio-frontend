import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Clock, Pencil, SendHorizonal, Undo2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { recipesService } from '@/services/recipes'
import { ingredientsService } from '@/services/ingredients'
import { RecipeFormDialog, toRequest } from '@/pages/Recipes'
import { formatCurrency } from '@/lib/utils'
import type { Recipe } from '@/types'

const TAG_COLOR: Record<string, 'green' | 'orange' | 'gray' | 'black'> = {
  QUICK: 'orange', CHEAP: 'green', MEALPREP: 'gray', HIGH_PROTEIN: 'orange',
  BREAKFAST: 'orange', MORNING_SNACK: 'orange',
  LUNCH: 'green', AFTERNOON_SNACK: 'gray',
  DINNER: 'black', SNACK: 'gray',
}

function VisibilityBadge({ visibility }: { visibility: Recipe['visibility'] }) {
  const { t } = useTranslation()
  if (visibility === 'PUBLIC') return null
  if (visibility === 'PENDING_REVIEW') {
    return (
      <Badge variant="amber">{t('myContent.status.pendingReview')}</Badge>
    )
  }
  return (
    <Badge variant="gray">{t('myContent.status.private')}</Badge>
  )
}

export function MyRecipes() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Recipe | null>(null)

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['my-recipes'],
    queryFn: recipesService.mine,
  })

  const { data: allIngredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientsService.list,
    staleTime: 30_000,
  })
  const ingredientMap = new Map(allIngredients.map(i => [i.id, i.translations?.[lang]?.name ?? i.name]))

  const createMutation = useMutation({
    mutationFn: recipesService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-recipes'] })
      setEditOpen(false)
      toast({ title: t('myContent.recipes.submitSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.recipes.submitError'), variant: 'destructive' })
    },
  })

  const submitMutation = useMutation({
    mutationFn: (id: string) => recipesService.submitForReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-recipes'] })
      toast({ title: t('myContent.recipes.submitSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.recipes.submitError'), variant: 'destructive' })
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => recipesService.withdrawFromReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-recipes'] })
      toast({ title: t('myContent.recipes.withdrawSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.recipes.withdrawError'), variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof toRequest> }) =>
      recipesService.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-recipes'] })
      setEditTarget(null)
      toast({ title: t('myContent.recipes.editSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.recipes.editError'), variant: 'destructive' })
    },
  })

  return (
    <div>
      <Header
        title={t('myContent.recipes.title')}
        subtitle={t('myContent.recipes.subtitle', { count: recipes.length })}
        actions={
          <Button onClick={() => setEditOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('myContent.recipes.addNew')}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-sm font-medium text-[#1A1A1A]">{t('myContent.recipes.empty.title')}</p>
            <p className="text-xs text-gray-400">{t('myContent.recipes.empty.description')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recipes.map(r => {
            const displayName = r.translations?.[lang]?.name ?? r.name
            const isPending = submitMutation.isPending || withdrawMutation.isPending
            return (
              <Card key={r.id}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-[#1A1A1A] truncate">{displayName}</p>
                        <VisibilityBadge visibility={r.visibility} />
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {(r.tags ?? []).slice(0, 3).map(tag => (
                          <Badge key={tag} variant={TAG_COLOR[tag] ?? 'gray'}>
                            {t(`recipes.tags.${tag}`, { defaultValue: tag })}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {r.prepTimeMinutes + r.cookTimeMinutes}m
                        </span>
                        <span>{t('recipes.servings', { count: r.servings })}</span>
                        {r.estimatedCostPerServing != null && (
                          <span className="text-[#4F7942] font-medium">
                            {formatCurrency(r.estimatedCostPerServing)}{t('recipes.detail.perServing')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditTarget(r)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {t('myContent.recipes.edit')}
                      </Button>
                      {r.visibility === 'PRIVATE' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => submitMutation.mutate(r.id)}
                        >
                          <SendHorizonal className="h-3.5 w-3.5" />
                          {t('myContent.recipes.submit')}
                        </Button>
                      )}
                      {r.visibility === 'PENDING_REVIEW' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => withdrawMutation.mutate(r.id)}
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                          {t('myContent.recipes.withdraw')}
                        </Button>
                      )}
                      {r.visibility === 'PUBLIC' && (
                        <span className="text-xs text-[#4F7942] font-medium">
                          {t('myContent.status.public')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <RecipeFormDialog
        open={editOpen}
        ingredientMap={ingredientMap}
        onOpenChange={open => { if (!open) setEditOpen(false) }}
        onSubmit={values => createMutation.mutate(toRequest(values))}
        isPending={createMutation.isPending}
        error={createMutation.error?.message}
      />

      <RecipeFormDialog
        open={editTarget !== null}
        recipe={editTarget ?? undefined}
        ingredientMap={ingredientMap}
        onOpenChange={open => { if (!open) setEditTarget(null) }}
        onSubmit={values => {
          if (editTarget) updateMutation.mutate({ id: editTarget.id, body: toRequest(values) })
        }}
        isPending={updateMutation.isPending}
        error={updateMutation.error?.message}
      />
    </div>
  )
}
