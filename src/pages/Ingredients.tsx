import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search, CheckCircle } from 'lucide-react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ingredientsService } from '@/services/ingredients'
import type { Ingredient, IngredientCategory } from '@/types'

const CATEGORIES: IngredientCategory[] = ['PROTEIN', 'CARB', 'FAT', 'VEGGIE', 'SPICE']
const CATEGORY_COLOR: Record<string, 'green' | 'orange' | 'gray' | 'black'> = {
  PROTEIN: 'orange', CARB: 'black', FAT: 'gray', VEGGIE: 'green', SPICE: 'gray',
}

const schema = z.object({
  name: z.string().min(1, 'Required'),
  aliases: z.string(),
  category: z.enum(['PROTEIN', 'CARB', 'FAT', 'VEGGIE', 'SPICE']),
  kcal: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  density: z.coerce.number().optional().nullable(),
  vegetarian: z.boolean(),
  vegan: z.boolean(),
  lactoseFree: z.boolean(),
  milkProteinFree: z.boolean(),
  glutenFree: z.boolean(),
  paleo: z.boolean(),
})
type FormValues = z.infer<typeof schema>

function toRequest(v: FormValues) {
  return {
    name: v.name,
    aliases: v.aliases.split(',').map(s => s.trim()).filter(Boolean),
    category: v.category,
    macros: { kcal: v.kcal, protein: v.protein, fat: v.fat, carbs: v.carbs },
    constraints: {
      vegetarian: v.vegetarian, vegan: v.vegan, lactoseFree: v.lactoseFree,
      milkProteinFree: v.milkProteinFree, glutenFree: v.glutenFree, paleo: v.paleo,
    },
    density: v.density ?? null,
  }
}

function defaultValues(ing?: Ingredient): FormValues {
  return {
    name: ing?.name ?? '',
    aliases: ing?.aliases?.join(', ') ?? '',
    category: ing?.category ?? 'PROTEIN',
    kcal: ing?.macros.kcal ?? 0,
    protein: ing?.macros.protein ?? 0,
    fat: ing?.macros.fat ?? 0,
    carbs: ing?.macros.carbs ?? 0,
    density: ing?.density ?? null,
    vegetarian: ing?.constraints.vegetarian ?? false,
    vegan: ing?.constraints.vegan ?? false,
    lactoseFree: ing?.constraints.lactoseFree ?? false,
    milkProteinFree: ing?.constraints.milkProteinFree ?? false,
    glutenFree: ing?.constraints.glutenFree ?? false,
    paleo: ing?.constraints.paleo ?? false,
  }
}

export function Ingredients() {
  const qc = useQueryClient()
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Ingredient | null | 'new'>(null)

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientsService.list,
  })

  const createMutation = useMutation({
    mutationFn: ingredientsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ingredients'] }); setEditTarget(null) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof toRequest> }) =>
      ingredientsService.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ingredients'] }); setEditTarget(null) },
  })
  const deleteMutation = useMutation({
    mutationFn: ingredientsService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  })
  const approveMutation = useMutation({
    mutationFn: ingredientsService.approveTranslation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  })

  const filtered = ingredients.filter(i => {
    if (!search) return true
    const displayName = i.translations?.[lang]?.name ?? i.name
    const displayAliases = i.translations?.[lang]?.aliases ?? i.aliases ?? []
    return displayName.toLowerCase().includes(search.toLowerCase()) ||
      displayAliases.some(a => a.toLowerCase().includes(search.toLowerCase()))
  })

  return (
    <div>
      <Header
        title={t('ingredients.title')}
        subtitle={t('ingredients.subtitle', { count: ingredients.length })}
        actions={
          <Button onClick={() => setEditTarget('new')}>
            <Plus className="h-4 w-4" /> {t('ingredients.addIngredient')}
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('ingredients.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-gray-400">{t('ingredients.noResults')}</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(ing => {
            const displayName = ing.translations?.[lang]?.name ?? ing.name
            const displayAliases = ing.translations?.[lang]?.aliases ?? ing.aliases
            return (
              <Card key={ing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm text-[#1A1A1A]">{displayName}</p>
                        {ing.machineTranslated && (
                          <span
                            title={t('ingredients.machineTranslated.tooltip')}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 cursor-default"
                          >
                            {t('ingredients.machineTranslated.badge')}
                          </span>
                        )}
                      </div>
                      {displayAliases?.length > 0 && (
                        <p className="text-xs text-gray-400">{displayAliases.join(', ')}</p>
                      )}
                    </div>
                    <Badge variant={CATEGORY_COLOR[ing.category] ?? 'gray'}>{ing.category}</Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-center mb-3">
                    {[
                      { label: 'kcal', value: ing.macros.kcal, color: '#F28C28' },
                      { label: 'P', value: ing.macros.protein, color: '#F28C28' },
                      { label: 'F', value: ing.macros.fat, color: '#4F7942' },
                      { label: 'C', value: ing.macros.carbs, color: '#1A1A1A' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-[#F9F7F2] rounded-[8px] p-1.5">
                        <p className="text-xs font-bold" style={{ color }}>{Number(value).toFixed(0)}</p>
                        <p className="text-[10px] text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditTarget(ing)}>
                      <Pencil className="h-3.5 w-3.5" /> {t('ingredients.edit')}
                    </Button>
                    {ing.machineTranslated && (
                      <Button
                        variant="secondary"
                        size="sm"
                        title={t('ingredients.machineTranslated.approveTitle')}
                        onClick={() => approveMutation.mutate(ing.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-[#4F7942]" />
                        {t('ingredients.machineTranslated.approve')}
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => {
                      if (confirm(t('ingredients.delete', { name: displayName }))) deleteMutation.mutate(ing.id)
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

      <IngredientFormDialog
        open={editTarget !== null}
        ingredient={editTarget === 'new' ? undefined : editTarget ?? undefined}
        onOpenChange={open => { if (!open) setEditTarget(null) }}
        onSubmit={values => {
          const body = toRequest(values)
          if (editTarget === 'new') {
            createMutation.mutate(body)
          } else if (editTarget) {
            updateMutation.mutate({ id: (editTarget as Ingredient).id, body })
          }
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

// ── Form dialog ────────────────────────────────────────────────────────────

function IngredientFormDialog({
  open, ingredient, onOpenChange, onSubmit, isPending,
}: {
  open: boolean
  ingredient?: Ingredient
  onOpenChange: (o: boolean) => void
  onSubmit: (v: FormValues) => void
  isPending: boolean
}) {
  const { t } = useTranslation()
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    values: defaultValues(ingredient),
  })

  const DIETARY = [
    { name: 'vegetarian' as const, label: t('ingredients.dietary.vegetarian') },
    { name: 'vegan' as const, label: t('ingredients.dietary.vegan') },
    { name: 'lactoseFree' as const, label: t('ingredients.dietary.lactoseFree') },
    { name: 'milkProteinFree' as const, label: t('ingredients.dietary.milkProteinFree') },
    { name: 'glutenFree' as const, label: t('ingredients.dietary.glutenFree') },
    { name: 'paleo' as const, label: t('ingredients.dietary.paleo') },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{ingredient ? t('ingredients.form.editTitle') : t('ingredients.form.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>{t('ingredients.form.name')}</Label>
              <Input {...register('name')} placeholder={t('ingredients.form.namePlaceholder')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t('ingredients.form.aliases')} <span className="text-gray-400 font-normal">{t('ingredients.form.aliasesHint')}</span></Label>
              <Input {...register('aliases')} placeholder={t('ingredients.form.aliasesPlaceholder')} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t('ingredients.form.category')}</Label>
              <Controller name="category" control={control} render={({ field }) => (
                <Select {...field}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              )} />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[#1A1A1A] mb-2">
              {t('ingredients.form.macros')} <span className="text-xs text-gray-400 font-normal">{t('ingredients.form.macrosHint')}</span>
            </p>
            <div className="grid grid-cols-4 gap-2">
              {(['kcal', 'protein', 'fat', 'carbs'] as const).map(f => (
                <div key={f} className="space-y-1">
                  <Label className="text-xs capitalize">{f}</Label>
                  <Input type="number" step="0.1" min="0" {...register(f)} className="text-sm" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('ingredients.form.density')} <span className="text-gray-400 font-normal text-xs">{t('ingredients.form.densityHint')}</span></Label>
            <Input type="number" step="0.01" min="0" {...register('density')} className="w-32" />
          </div>

          <div>
            <p className="text-sm font-medium text-[#1A1A1A] mb-2">{t('ingredients.form.dietaryFlags')}</p>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
              {DIETARY.map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" {...register(name)} className="accent-[#F28C28] h-4 w-4 rounded" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>{t('ingredients.form.cancel')}</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner className="h-4 w-4" /> : ingredient ? t('ingredients.form.save') : t('ingredients.form.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
