import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Plus, SendHorizonal, Undo2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { ingredientsService } from '@/services/ingredients'
import type { Ingredient } from '@/types'

const CATEGORY_COLOR: Record<string, 'green' | 'orange' | 'gray' | 'black'> = {
  PROTEIN: 'orange', CARB: 'black', FAT: 'gray', VEGGIE: 'green', SPICE: 'gray',
}

function VisibilityBadge({ visibility }: { visibility: Ingredient['visibility'] }) {
  const { t } = useTranslation()
  if (visibility === 'PUBLIC') return null
  if (visibility === 'PENDING_REVIEW') {
    return <Badge variant="amber">{t('myContent.status.pendingReview')}</Badge>
  }
  return <Badge variant="gray">{t('myContent.status.private')}</Badge>
}

export function MyIngredients() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['my-ingredients'],
    queryFn: ingredientsService.mine,
  })

  const submitMutation = useMutation({
    mutationFn: (id: string) => ingredientsService.submitForReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-ingredients'] })
      toast({ title: t('myContent.ingredients.submitSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.ingredients.submitError'), variant: 'destructive' })
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => ingredientsService.withdrawFromReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-ingredients'] })
      toast({ title: t('myContent.ingredients.withdrawSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.ingredients.withdrawError'), variant: 'destructive' })
    },
  })

  return (
    <div>
      <Header
        title={t('myContent.ingredients.title')}
        subtitle={t('myContent.ingredients.subtitle', { count: ingredients.length })}
        actions={
          <Button asChild>
            <Link to="/app/ingredients">
              <Plus className="h-4 w-4" />
              {t('myContent.ingredients.addNew')}
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : ingredients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-sm font-medium text-[#1A1A1A]">{t('myContent.ingredients.empty.title')}</p>
            <p className="text-xs text-gray-400">{t('myContent.ingredients.empty.description')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ingredients.map(ing => {
            const displayName = ing.translations?.[lang]?.name ?? ing.name
            const isPending = submitMutation.isPending || withdrawMutation.isPending
            return (
              <Card key={ing.id}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-[#1A1A1A] truncate">{displayName}</p>
                        <VisibilityBadge visibility={ing.visibility} />
                      </div>

                      <div className="flex gap-2 text-xs text-gray-400">
                        <Badge variant={CATEGORY_COLOR[ing.category] ?? 'gray'}>
                          {ing.category}
                        </Badge>
                        {ing.macros && (
                          <span>{Math.round(ing.macros.kcal)} kcal · {Math.round(ing.macros.protein)}g P</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {ing.visibility === 'PRIVATE' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => submitMutation.mutate(ing.id)}
                        >
                          <SendHorizonal className="h-3.5 w-3.5" />
                          {t('myContent.ingredients.submit')}
                        </Button>
                      )}
                      {ing.visibility === 'PENDING_REVIEW' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => withdrawMutation.mutate(ing.id)}
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                          {t('myContent.ingredients.withdraw')}
                        </Button>
                      )}
                      {ing.visibility === 'PUBLIC' && (
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
    </div>
  )
}
