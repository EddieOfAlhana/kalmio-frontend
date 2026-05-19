import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Clock, Pencil, Plus, SendHorizonal, Sparkles, Undo2, Wand2, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { recipesService } from '@/services/recipes'
import { ingredientsService } from '@/services/ingredients'
import { aiRecipeImportService } from '@/services/aiRecipeImport'
import { AiRecipeImportModal } from '@/components/recipes/AiRecipeImportModal'
import { IngredientSearchDialog } from '@/components/IngredientSearchDialog'
import { RecipeFormDialog, toRequest } from '@/pages/Recipes'
import { formatCurrency } from '@/lib/utils'
import type {
  HealthifySuggestion,
  Ingredient,
  Recipe,
  RecipeImportConfirmRequest,
  RecipeImportPreview,
  RecipeImportSource,
} from '@/types'

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

interface ImportState {
  recipe: Recipe
  unmatchedLines: string[]
  healthifySuggestions: HealthifySuggestion[]
  source: RecipeImportSource
  sourceUrl: string | null
}

export function MyRecipes() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Recipe | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importState, setImportState] = useState<ImportState | null>(null)
  const [ingSearchOpen, setIngSearchOpen] = useState(false)
  const [resolvingLine, setResolvingLine] = useState<string | null>(null)
  const [enrichingLines, setEnrichingLines] = useState<Set<string>>(new Set())

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

  const confirmImportMutation = useMutation({
    mutationFn: (body: RecipeImportConfirmRequest) => aiRecipeImportService.confirmImport(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-recipes'] })
      setImportState(null)
      toast({ title: t('aiImport.preview.saveSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('aiImport.preview.saveError'), variant: 'destructive' })
    },
  })

  function handlePreviewReceived(preview: RecipeImportPreview, source: RecipeImportSource, sourceUrl?: string | null) {
    setImportState({
      recipe: preview.recipe,
      unmatchedLines: preview.unmatchedLines,
      healthifySuggestions: preview.healthifySuggestions,
      source,
      sourceUrl: sourceUrl ?? null,
    })
  }

  function handleResolveLine(line: string) {
    setResolvingLine(line)
    setIngSearchOpen(true)
  }

  function handleIngredientResolved(ing: Ingredient) {
    setIngSearchOpen(false)
    if (!importState || !resolvingLine) return
    setImportState({
      ...importState,
      recipe: {
        ...importState.recipe,
        ingredients: [
          ...importState.recipe.ingredients,
          { id: crypto.randomUUID(), ingredientId: ing.id, amount: 100, unit: 'G' },
        ],
      },
      unmatchedLines: importState.unmatchedLines.filter(l => l !== resolvingLine),
    })
    setResolvingLine(null)
  }

  function handleDismissLine(line: string) {
    if (!importState) return
    setImportState({
      ...importState,
      unmatchedLines: importState.unmatchedLines.filter(l => l !== line),
    })
  }

  async function handleEnrichLine(line: string) {
    if (!importState || enrichingLines.has(line)) return
    setEnrichingLines(prev => {
      const next = new Set(prev)
      next.add(line)
      return next
    })
    try {
      const created = await ingredientsService.createFromText(line)
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      setImportState(curr => {
        if (!curr) return curr
        return {
          ...curr,
          recipe: {
            ...curr.recipe,
            ingredients: [
              ...curr.recipe.ingredients,
              { id: crypto.randomUUID(), ingredientId: created.id, amount: 100, unit: 'G' },
            ],
          },
          unmatchedLines: curr.unmatchedLines.filter(l => l !== line),
        }
      })
      toast({ title: t('aiImport.preview.enrichSuccess', { name: created.name }), variant: 'success' })
    } catch (err) {
      const status = (err as { response?: { status?: number; data?: { type?: string } } })?.response?.status
      const type = (err as { response?: { data?: { type?: string } } })?.response?.data?.type
      let key = 'aiImport.preview.enrichError'
      if (status === 402) key = 'aiImport.preview.enrichErrorPremium'
      else if (status === 429) {
        key = type === 'urn:kalmio:error:monthly-quota-exceeded'
          ? 'aiImport.preview.enrichErrorMonthly'
          : 'aiImport.preview.enrichErrorRateLimit'
      } else if (status === 503) key = 'aiImport.preview.enrichErrorUnavailable'
      else if (status === 502) key = 'aiImport.preview.enrichErrorParse'
      toast({ title: t(key), variant: 'destructive' })
    } finally {
      setEnrichingLines(prev => {
        const next = new Set(prev)
        next.delete(line)
        return next
      })
    }
  }

  function handleImportSubmit(values: ReturnType<typeof toRequest>) {
    if (!importState) return
    const body: RecipeImportConfirmRequest = {
      ...values,
      culturalTags: importState.recipe.culturalTags?.length
        ? importState.recipe.culturalTags
        : ['USER_IMPORTED'],
      source: importState.source,
      sourceUrl: importState.sourceUrl,
      appliedHealthifyCount: 0,
    }
    confirmImportMutation.mutate(body)
  }

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
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setImportModalOpen(true)}>
              <Sparkles className="h-4 w-4" />
              {t('aiImport.openButton')}
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('myContent.recipes.addNew')}
            </Button>
          </div>
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

      <AiRecipeImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onPreview={handlePreviewReceived}
      />

      {/* The import preview-edit dialog re-uses RecipeFormDialog. The key forces a fresh
          mount when the import session changes or when ingredient resolution alters the
          ingredient list — without it, react-hook-form keeps stale values. */}
      <RecipeFormDialog
        key={importState
          ? `import-${importState.unmatchedLines.length}-${importState.recipe.ingredients.length}`
          : 'import-closed'}
        open={importState !== null}
        recipe={importState?.recipe}
        ingredientMap={ingredientMap}
        onOpenChange={open => { if (!open) setImportState(null) }}
        onSubmit={values => handleImportSubmit(toRequest(values))}
        isPending={confirmImportMutation.isPending}
        error={confirmImportMutation.error?.message}
        titleOverride={t('aiImport.preview.title')}
        submitLabelOverride={t('aiImport.preview.save')}
        extraSubmitDisabled={(importState?.unmatchedLines.length ?? 0) > 0}
        headerSlot={importState && (
          <ImportPreviewHeader
            unmatchedLines={importState.unmatchedLines}
            healthifySuggestions={importState.healthifySuggestions}
            enrichingLines={enrichingLines}
            onResolveLine={handleResolveLine}
            onEnrichLine={handleEnrichLine}
            onDismissLine={handleDismissLine}
          />
        )}
      />

      <IngredientSearchDialog
        open={ingSearchOpen}
        onOpenChange={open => {
          setIngSearchOpen(open)
          if (!open) setResolvingLine(null)
        }}
        excludeIds={importState?.recipe.ingredients.map(i => i.ingredientId) ?? []}
        onSelect={handleIngredientResolved}
      />
    </div>
  )
}

// ── Import preview header (unmatched-lines banner + healthify accordion) ────

function ImportPreviewHeader({
  unmatchedLines,
  healthifySuggestions,
  enrichingLines,
  onResolveLine,
  onEnrichLine,
  onDismissLine,
}: {
  unmatchedLines: string[]
  healthifySuggestions: HealthifySuggestion[]
  enrichingLines: Set<string>
  onResolveLine: (line: string) => void
  onEnrichLine: (line: string) => void
  onDismissLine: (line: string) => void
}) {
  const { t } = useTranslation()
  const [healthifyOpen, setHealthifyOpen] = useState(false)

  return (
    <div className="space-y-3">
      {unmatchedLines.length > 0 && (
        <div className="rounded-[12px] border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">
            {t('aiImport.preview.unmatchedTitle', { count: unmatchedLines.length })}
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            {t('aiImport.preview.unmatchedDescription')}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {unmatchedLines.map(line => {
              const isEnriching = enrichingLines.has(line)
              return (
                <span
                  key={line}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-amber-300 px-2 py-1 text-xs text-amber-900"
                >
                  <button
                    type="button"
                    onClick={() => onResolveLine(line)}
                    disabled={isEnriching}
                    className="font-medium hover:underline disabled:opacity-50"
                  >
                    {line}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnrichLine(line)}
                    disabled={isEnriching}
                    aria-label={t('aiImport.preview.unmatchedEnrich')}
                    title={t('aiImport.preview.unmatchedEnrich')}
                    className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[#F28C28] hover:bg-amber-100 disabled:opacity-60"
                  >
                    {isEnriching ? (
                      <Spinner className="h-3 w-3" />
                    ) : (
                      <Wand2 className="h-3 w-3" aria-hidden />
                    )}
                    <span className="text-[11px] font-medium">
                      {t('aiImport.preview.unmatchedEnrichShort')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismissLine(line)}
                    disabled={isEnriching}
                    aria-label={t('aiImport.preview.unmatchedDismiss')}
                    className="rounded-full p-0.5 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {healthifySuggestions.length > 0 && (
        <div className="rounded-[12px] border border-[#4F7942]/40 bg-[#F1F5EB] text-sm">
          <button
            type="button"
            onClick={() => setHealthifyOpen(o => !o)}
            aria-expanded={healthifyOpen}
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
          >
            <span className="font-medium text-[#365229]">
              {t('aiImport.preview.healthifyTitle', { count: healthifySuggestions.length })}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[#365229] transition-transform ${healthifyOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {healthifyOpen && (
            <ul className="space-y-2 border-t border-[#4F7942]/30 px-3 py-2.5">
              {healthifySuggestions.map((s, i) => (
                <li key={i} className="space-y-0.5">
                  <p className="text-sm font-medium text-[#1A1A1A]">{s.swap}</p>
                  {s.reason && (
                    <p className="text-xs text-gray-600">{s.reason}</p>
                  )}
                  <p className="text-[11px] text-[#365229]">
                    {t('aiImport.preview.healthifyDelta', {
                      kcal: Math.round(s.kcalDelta),
                      protein: Math.round(s.proteinDelta),
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
