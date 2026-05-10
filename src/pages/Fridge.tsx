import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Refrigerator, Plus, Trash2, Search, Archive } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { IngredientSearchDialog } from '@/components/IngredientSearchDialog'
import { fridgeService } from '@/services/fridge'
import type { FridgeItem, Ingredient, IngredientCategory, Unit } from '@/types'

const CATEGORY_COLOR: Record<IngredientCategory, 'green' | 'orange' | 'gray' | 'black'> = {
  PROTEIN: 'orange', CARB: 'black', FAT: 'gray', VEGGIE: 'green', SPICE: 'gray',
}

const UNITS: Unit[] = ['G', 'ML', 'PIECE']

export function Fridge() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<Unit>('G')

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['fridge'],
    queryFn: fridgeService.list,
  })

  const addMutation = useMutation({
    mutationFn: fridgeService.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fridge'] })
      setAddDialogOpen(false)
      setSelectedIngredient(null)
      setAmount('')
      setUnit('G')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: fridgeService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fridge'] }),
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(i => i.ingredientName.toLowerCase().includes(q))
  }, [items, search])

  const nonPantry = filtered.filter(i => !i.pantryItem)
  const pantry = filtered.filter(i => i.pantryItem)

  function handleIngredientSelect(ing: Ingredient) {
    setSelectedIngredient(ing)
    setUnit(ing.gramsPerPiece ? 'PIECE' : 'G')
    setIngredientDialogOpen(false)
    setAddDialogOpen(true)
  }

  function handleAdd() {
    if (!selectedIngredient || !amount || isNaN(Number(amount))) return
    addMutation.mutate({
      ingredientId: selectedIngredient.id,
      amount: Number(amount),
      unit,
    })
  }

  return (
    <div>
      <Header
        title={t('fridge.title')}
        subtitle={t('fridge.subtitle', { count: items.length })}
        actions={
          <Button onClick={() => setIngredientDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t('fridge.addItem')}
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder={t('fridge.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center">
            <Refrigerator className="h-10 w-10 text-[#F28C28] mb-3" />
            <h3 className="font-headline font-bold text-[#1A1A1A] mb-1">{t('fridge.empty.title')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('fridge.empty.description')}</p>
            <Button onClick={() => setIngredientDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('fridge.addItem')}
            </Button>
          </CardContent>
        </Card>
      )}

      {nonPantry.length > 0 && (
        <FridgeGroup
          title={t('fridge.nonPantryGroup')}
          titleHint={t('fridge.nonPantryHint')}
          items={nonPantry}
          onDelete={id => deleteMutation.mutate(id)}
          deletingId={deleteMutation.isPending ? undefined : undefined}
        />
      )}

      {pantry.length > 0 && (
        <FridgeGroup
          title={t('fridge.pantryGroup')}
          titleHint={t('fridge.pantryHint')}
          items={pantry}
          onDelete={id => deleteMutation.mutate(id)}
        />
      )}

      <IngredientSearchDialog
        open={ingredientDialogOpen}
        onOpenChange={setIngredientDialogOpen}
        onSelect={handleIngredientSelect}
        excludeIds={items.map(i => i.ingredientId)}
      />

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('fridge.addDialog.title')}</DialogTitle>
          </DialogHeader>
          {selectedIngredient && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Badge variant={CATEGORY_COLOR[selectedIngredient.category] ?? 'gray'}>
                  {selectedIngredient.category}
                </Badge>
                <span className="font-semibold">{selectedIngredient.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('fridge.addDialog.amount')}</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 200"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t('fridge.addDialog.unit')}</Label>
                  <select
                    className="flex h-10 w-full rounded-[12px] border border-input bg-background px-3 py-2 text-sm"
                    value={unit}
                    onChange={e => setUnit(e.target.value as Unit)}
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setAddDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={!amount || isNaN(Number(amount)) || Number(amount) <= 0 || addMutation.isPending}
                >
                  {addMutation.isPending ? t('fridge.addDialog.adding') : t('fridge.addDialog.add')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FridgeGroup({
  title,
  titleHint,
  items,
  onDelete,
}: {
  title: string
  titleHint: string
  items: FridgeItem[]
  onDelete: (id: string) => void
  deletingId?: string
}) {
  const { t } = useTranslation()
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{title}</span>
          <span className="text-xs font-normal text-gray-400">{titleHint}</span>
          <Badge variant="gray">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-[12px] bg-[#F9F7F2]"
          >
            <div className="flex items-center gap-2 min-w-0">
              {item.pantryItem && (
                <Archive className="h-3.5 w-3.5 text-green-600 shrink-0" />
              )}
              {item.ingredientCategory && (
                <Badge variant={CATEGORY_COLOR[item.ingredientCategory] ?? 'gray'} className="shrink-0">
                  {item.ingredientCategory}
                </Badge>
              )}
              <span className="font-medium text-sm text-[#1A1A1A] truncate">{item.ingredientName}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <span className="text-sm font-semibold text-[#4F7942]">
                {Number(item.amount).toFixed(item.unit === 'PIECE' ? 0 : 1)} {item.unit}
              </span>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title={t('common.delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
