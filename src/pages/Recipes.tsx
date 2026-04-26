import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search, Clock, X, CheckCircle } from 'lucide-react'
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { IngredientSearchDialog } from '@/components/IngredientSearchDialog'
import { recipesService } from '@/services/recipes'
import { ingredientsService } from '@/services/ingredients'
import { formatCurrency } from '@/lib/utils'
import type { Recipe, RecipeTag, Unit } from '@/types'

const TAGS: RecipeTag[] = ['QUICK', 'CHEAP', 'MEALPREP', 'HIGH_PROTEIN']
const UNITS: Unit[] = ['G', 'ML', 'PIECE']
const TAG_COLOR: Record<string, 'green' | 'orange' | 'gray'> = {
  QUICK: 'orange', CHEAP: 'green', MEALPREP: 'gray', HIGH_PROTEIN: 'orange',
}

const schema = z.object({
  name: z.string().min(1, 'Required'),
  prepTimeMinutes: z.coerce.number().int().min(1),
  cookTimeMinutes: z.coerce.number().int().min(1),
  servings: z.coerce.number().int().min(1),
  steps: z.string(),
  tags: z.array(z.enum(['QUICK', 'CHEAP', 'MEALPREP', 'HIGH_PROTEIN'])),
  ingredients: z.array(z.object({
    ingredientId: z.string().min(1),
    ingredientName: z.string(),
    amount: z.coerce.number().min(0.001),
    unit: z.enum(['G', 'ML', 'PIECE']),
  })).min(1, 'Add at least one ingredient'),
})
type FormValues = z.infer<typeof schema>

function toRequest(v: FormValues) {
  return {
    name: v.name,
    steps: v.steps.split('\n').map(s => s.trim()).filter(Boolean),
    prepTimeMinutes: v.prepTimeMinutes,
    cookTimeMinutes: v.cookTimeMinutes,
    servings: v.servings,
    tags: v.tags,
    ingredients: v.ingredients.map(i => ({
      ingredientId: i.ingredientId,
      amount: i.amount,
      unit: i.unit,
    })),
  }
}

function defaultValues(recipe?: Recipe, ingredientMap?: Map<string, string>): FormValues {
  return {
    name: recipe?.name ?? '',
    prepTimeMinutes: recipe?.prepTimeMinutes ?? 15,
    cookTimeMinutes: recipe?.cookTimeMinutes ?? 30,
    servings: recipe?.servings ?? 2,
    steps: recipe?.steps?.join('\n') ?? '',
    tags: (recipe?.tags ?? []) as RecipeTag[],
    ingredients: recipe?.ingredients?.map(i => ({
      ingredientId: i.ingredientId,
      ingredientName: ingredientMap?.get(i.ingredientId) ?? i.ingredientId,
      amount: i.amount,
      unit: i.unit,
    })) ?? [],
  }
}

export function Recipes() {
  const qc = useQueryClient()
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Recipe | null | 'new'>(null)

  const { data: recipes = [], isLoading } = useQuery({ queryKey: ['recipes'], queryFn: recipesService.list })
  const { data: ingredients = [] } = useQuery({ queryKey: ['ingredients'], queryFn: ingredientsService.list, staleTime: 30_000 })
  const ingredientMap = new Map(ingredients.map(i => [i.id, i.translations?.[lang]?.name ?? i.name]))

  const createMutation = useMutation({
    mutationFn: recipesService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recipes'] }); setEditTarget(null) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof toRequest> }) =>
      recipesService.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recipes'] }); setEditTarget(null) },
  })
  const deleteMutation = useMutation({
    mutationFn: recipesService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })
  const approveMutation = useMutation({
    mutationFn: recipesService.approveTranslation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })

  const filtered = recipes.filter(r => {
    if (!search) return true
    const displayName = r.translations?.[lang]?.name ?? r.name
    return displayName.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div>
      <Header
        title={t('recipes.title')}
        subtitle={t('recipes.subtitle', { count: recipes.length })}
        actions={
          <Button onClick={() => setEditTarget('new')}>
            <Plus className="h-4 w-4" /> {t('recipes.addRecipe')}
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder={t('recipes.search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-gray-400">{t('recipes.noResults')}</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(r => {
            const displayName = r.translations?.[lang]?.name ?? r.name
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm text-[#1A1A1A] leading-snug">{displayName}</p>
                        {r.machineTranslated && (
                          <span
                            title={t('recipes.machineTranslated.tooltip')}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 cursor-default shrink-0"
                          >
                            {t('recipes.machineTranslated.badge')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                      {(r.tags ?? []).map(tag => (
                        <Badge key={tag} variant={TAG_COLOR[tag] ?? 'gray'}>{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.prepTimeMinutes + r.cookTimeMinutes}m</span>
                    <span>{t('recipes.servings', { count: r.servings })}</span>
                    {r.estimatedCostPerServing != null && (
                      <span className="text-[#4F7942] font-semibold">{formatCurrency(r.estimatedCostPerServing)}/srv</span>
                    )}
                  </div>

                  {r.macros && (
                    <div className="grid grid-cols-4 gap-1 text-center mb-3">
                      {[
                        { label: 'kcal', value: r.macros.kcal },
                        { label: 'P', value: r.macros.protein },
                        { label: 'F', value: r.macros.fat },
                        { label: 'C', value: r.macros.carbs },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-[#F9F7F2] rounded-[8px] p-1.5">
                          <p className="text-xs font-bold text-[#1A1A1A]">{Number(value).toFixed(0)}</p>
                          <p className="text-[10px] text-gray-400">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1"
                      onClick={() => setEditTarget(r)}>
                      <Pencil className="h-3.5 w-3.5" /> {t('recipes.edit')}
                    </Button>
                    {r.machineTranslated && (
                      <Button
                        variant="secondary"
                        size="sm"
                        title={t('recipes.machineTranslated.approveTitle')}
                        onClick={() => approveMutation.mutate(r.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-[#4F7942]" />
                        {t('recipes.machineTranslated.approve')}
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => {
                      if (confirm(t('recipes.delete', { name: displayName }))) deleteMutation.mutate(r.id)
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <RecipeFormDialog
        open={editTarget !== null}
        recipe={editTarget === 'new' ? undefined : editTarget ?? undefined}
        ingredientMap={ingredientMap}
        onOpenChange={open => { if (!open) setEditTarget(null) }}
        onSubmit={values => {
          const body = toRequest(values)
          if (editTarget === 'new') createMutation.mutate(body)
          else if (editTarget) updateMutation.mutate({ id: (editTarget as Recipe).id, body })
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
        error={createMutation.error?.message ?? updateMutation.error?.message}
      />
    </div>
  )
}

// ── Recipe form dialog ─────────────────────────────────────────────────────

function RecipeFormDialog({
  open, recipe, ingredientMap, onOpenChange, onSubmit, isPending, error,
}: {
  open: boolean
  recipe?: Recipe
  ingredientMap: Map<string, string>
  onOpenChange: (o: boolean) => void
  onSubmit: (v: FormValues) => void
  isPending: boolean
  error?: string
}) {
  const { t } = useTranslation()
  const [ingSearchOpen, setIngSearchOpen] = useState(false)

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    values: defaultValues(recipe, ingredientMap),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })
  const selectedTags = watch('tags')
  const ingredientIds = fields.map(f => f.ingredientId)

  function toggleTag(tag: RecipeTag) {
    const current = selectedTags ?? []
    setValue('tags', current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{recipe ? t('recipes.form.editTitle') : t('recipes.form.newTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto max-h-[70dvh] pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>{t('recipes.form.name')}</Label>
              <Input {...register('name')} placeholder={t('recipes.form.namePlaceholder')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>{t('recipes.form.prepTime')}</Label>
              <Input type="number" min="1" {...register('prepTimeMinutes')} />
            </div>
            <div className="space-y-1">
              <Label>{t('recipes.form.cookTime')}</Label>
              <Input type="number" min="1" {...register('cookTimeMinutes')} />
            </div>
            <div className="space-y-1">
              <Label>{t('recipes.form.servings')}</Label>
              <Input type="number" min="1" {...register('servings')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('recipes.form.steps')} <span className="text-gray-400 font-normal text-xs">{t('recipes.form.stepsHint')}</span></Label>
            <Textarea {...register('steps')} rows={4} placeholder={t('recipes.form.stepsPlaceholder')} />
          </div>

          <div>
            <Label className="mb-2 block">{t('recipes.form.tags')}</Label>
            <div className="flex gap-2 flex-wrap">
              {TAGS.map(tag => (
                <button
                  key={tag} type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-colors ${
                    selectedTags?.includes(tag)
                      ? 'bg-[#F28C28] text-white border-[#F28C28]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#F28C28]'
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{t('recipes.form.ingredients')}</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setIngSearchOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> {t('recipes.form.add')}
              </Button>
            </div>
            {errors.ingredients && (
              <p className="text-xs text-red-500 mb-1">{errors.ingredients.message ?? errors.ingredients.root?.message}</p>
            )}

            {fields.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center border border-dashed rounded-[12px]">
                {t('recipes.form.noIngredients')}
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex items-center gap-2 bg-[#F9F7F2] rounded-[12px] px-3 py-2">
                    <span className="flex-1 text-sm font-medium text-[#1A1A1A] truncate">
                      {field.ingredientName}
                    </span>
                    <Input
                      type="number" step="0.1" min="0.001"
                      {...register(`ingredients.${idx}.amount`)}
                      className="w-20 h-8 text-sm"
                    />
                    <Controller name={`ingredients.${idx}.unit`} control={control} render={({ field: f }) => (
                      <Select {...f} className="w-20 h-8 text-sm">
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </Select>
                    )} />
                    <button type="button" onClick={() => remove(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-[12px] px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>{t('recipes.form.cancel')}</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner className="h-4 w-4" /> : recipe ? t('recipes.form.save') : t('recipes.form.create')}
            </Button>
          </div>
        </form>

        <IngredientSearchDialog
          open={ingSearchOpen}
          onOpenChange={setIngSearchOpen}
          excludeIds={ingredientIds}
          onSelect={ing => {
            append({ ingredientId: ing.id, ingredientName: ing.name, amount: 100, unit: 'G' })
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
