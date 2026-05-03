import { useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Fingerprint, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { usersService, type UpdateSettingsRequest } from '@/services/users'
import { listPasskeys, registerPasskey, deletePasskey, type PasskeyInfo } from '@/services/passkey'
import { useAuthStore } from '@/store/auth'

interface FormValues {
  languagePreference: string
  days: string
  mealsPerDay: string
  kcalTarget: string
  proteinMin: string
  budgetMax: string
  prepTimeMax: string
  maxRecipeRepetitions: string
}

function deviceLabel(): string {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) return 'Android'
  if (/Mac OS/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows PC'
  return 'My Device'
}

export function Settings() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const setAppRole = useAuthStore((s) => s.setAppRole)

  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([])
  const [passkeysLoading, setPasskeysLoading] = useState(true)
  const [passkeyAdding, setPasskeyAdding] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PasskeyInfo | null>(null)
  const [customName, setCustomName] = useState('')

  const loadPasskeys = useCallback(async () => {
    setPasskeysLoading(true)
    try {
      const data = await listPasskeys()
      setPasskeys(data)
    } catch {
      setPasskeys([])
    } finally {
      setPasskeysLoading(false)
    }
  }, [])

  useEffect(() => { loadPasskeys() }, [loadPasskeys])

  const addPasskey = async () => {
    setPasskeyAdding(true)
    setPasskeyError(null)
    try {
      const name = customName.trim() || deviceLabel()
      await registerPasskey(name)
      setCustomName('')
      await loadPasskeys()
      toast({ title: t('settings.security.addSuccess'), variant: 'success' })
    } catch {
      setPasskeyError(t('settings.security.addError'))
      toast({ title: t('settings.security.addError'), variant: 'destructive' })
    } finally {
      setPasskeyAdding(false)
    }
  }

  const confirmRemovePasskey = async () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setRemovingId(id)
    setDeleteTarget(null)
    setPasskeyError(null)
    try {
      await deletePasskey(id)
      await loadPasskeys()
      toast({ title: t('settings.security.removeSuccess'), variant: 'success' })
    } catch {
      setPasskeyError(t('settings.security.removeError'))
      toast({ title: t('settings.security.removeError'), variant: 'destructive' })
    } finally {
      setRemovingId(null)
    }
  }

  const { data: settings, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
  })

  const { register, handleSubmit, reset } = useForm<FormValues>()

  useEffect(() => {
    if (settings) {
      reset({
        languagePreference: settings.languagePreference ?? i18n.resolvedLanguage ?? 'hu',
        days: settings.mealPlanPreferences?.days?.toString() ?? '',
        mealsPerDay: settings.mealPlanPreferences?.mealsPerDay?.toString() ?? '',
        kcalTarget: settings.mealPlanPreferences?.kcalTarget?.toString() ?? '',
        proteinMin: settings.mealPlanPreferences?.proteinMin?.toString() ?? '',
        budgetMax: settings.mealPlanPreferences?.budgetMax?.toString() ?? '',
        prepTimeMax: settings.mealPlanPreferences?.prepTimeMax?.toString() ?? '',
        maxRecipeRepetitions: settings.mealPlanPreferences?.maxRecipeRepetitions?.toString() ?? '',
      })
    }
  }, [settings, reset, i18n.resolvedLanguage])

  const mutation = useMutation({
    mutationFn: (body: UpdateSettingsRequest) => usersService.updateSettings(body),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data)
      setAppRole(data.role)
      if (data.languagePreference) {
        i18n.changeLanguage(data.languagePreference)
      }
    },
  })

  const onSubmit = (values: FormValues) => {
    const prefs = {
      days: values.days ? parseInt(values.days) : undefined,
      mealsPerDay: values.mealsPerDay ? parseInt(values.mealsPerDay) : undefined,
      kcalTarget: values.kcalTarget ? parseFloat(values.kcalTarget) : undefined,
      proteinMin: values.proteinMin ? parseFloat(values.proteinMin) : undefined,
      budgetMax: values.budgetMax ? parseFloat(values.budgetMax) : undefined,
      prepTimeMax: values.prepTimeMax ? parseInt(values.prepTimeMax) : undefined,
      maxRecipeRepetitions: values.maxRecipeRepetitions ? parseInt(values.maxRecipeRepetitions) : undefined,
    }
    const hasPrefs = Object.values(prefs).some(v => v !== undefined)
    mutation.mutate({
      languagePreference: values.languagePreference || null,
      mealPlanPreferences: hasPrefs ? prefs : null,
    })
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  return (
    <div>
      <Header
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        {/* Language */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.language')}</h2>
            <div>
              <Label>{t('settings.languageLabel')}</Label>
              <Select {...register('languagePreference')} className="mt-1">
                <option value="hu">Magyar</option>
                <option value="en">English</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Meal plan defaults */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.mealPlanDefaults')}</h2>
            <p className="text-xs text-gray-400">{t('settings.mealPlanDefaultsHint')}</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('mealPlan.form.days')}</Label>
                <Input type="number" min={1} max={14} {...register('days')} className="mt-1" placeholder="7" />
              </div>
              <div>
                <Label>{t('mealPlan.form.mealsPerDay')}</Label>
                <Input type="number" min={1} max={6} {...register('mealsPerDay')} className="mt-1" placeholder="3" />
              </div>
            </div>

            <div>
              <Label>{t('mealPlan.form.kcalTarget')}</Label>
              <Input type="number" min={0} {...register('kcalTarget')} className="mt-1" placeholder="2000" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('mealPlan.form.proteinMin')}</Label>
                <Input type="number" min={0} {...register('proteinMin')} className="mt-1" placeholder="150" />
              </div>
              <div>
                <Label>{t('mealPlan.form.budgetMax')}</Label>
                <Input type="number" min={0} {...register('budgetMax')} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('mealPlan.form.prepTimeMax')}</Label>
                <Input type="number" min={0} {...register('prepTimeMax')} className="mt-1" />
              </div>
              <div>
                <Label>{t('mealPlan.form.maxRepeats')}</Label>
                <Input type="number" min={1} {...register('maxRecipeRepetitions')} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t('common.save') + '…' : t('common.save')}
        </Button>
      </form>

      {/* ── Security ── */}
      <div className="space-y-4 max-w-lg mt-2">
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div>
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.security.title')}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{t('settings.security.passkeysHint')}</p>
            </div>

            {passkeysLoading ? (
              <div className="flex justify-center py-2"><Spinner /></div>
            ) : passkeys.length === 0 ? (
              <p className="text-xs text-gray-400">{t('settings.security.noPasskeys')}</p>
            ) : (
              <ul className="space-y-2">
                {passkeys.map((pk) => (
                  <li key={pk.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Fingerprint size={15} className="text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{pk.friendlyName || t('settings.security.unnamedPasskey')}</p>
                        <p className="text-xs text-gray-400">
                          {t('settings.security.registeredOn', {
                            date: new Date(pk.createdAt).toLocaleDateString(),
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={removingId === pk.id}
                      onClick={() => setDeleteTarget(pk)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      {removingId === pk.id ? <Spinner /> : <Trash2 size={14} />}
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2">
              <Input
                placeholder={t('settings.security.namePlaceholder')}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="text-sm"
                maxLength={50}
              />
              <Button
                type="button"
                onClick={addPasskey}
                disabled={passkeyAdding}
                className="w-full gap-2 bg-midnight-black hover:bg-midnight-black/90 text-white rounded-xl"
              >
                {passkeyAdding ? <Spinner /> : <Fingerprint size={15} />}
                {passkeyAdding ? t('settings.security.adding') : t('settings.security.addPasskey')}
              </Button>
            </div>

            {passkeyError && <p className="text-xs text-red-500">{passkeyError}</p>}
          </CardContent>
        </Card>

      </div>

      {mutation.isError && (
        <p className="text-sm text-red-500 mt-2">{t('settings.saveError')}</p>
      )}
      {mutation.isSuccess && (
        <p className="text-sm text-green-600 mt-2">{t('settings.saveSuccess')}</p>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.security.confirmDeleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('settings.security.confirmDeleteDesc', {
                name: deleteTarget?.friendlyName || t('settings.security.unnamedPasskey'),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={confirmRemovePasskey}
              disabled={!!removingId}
            >
              {removingId ? <Spinner /> : t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
