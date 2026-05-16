import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { capture } from '@/lib/analytics'
import { offPlanMealsService } from '@/services/offPlanMeals'
import type { LogOffPlanMealRequest } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────

type OffPlanMealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

interface FormState {
  mealType: OffPlanMealType | ''
  displayName: string
  kcal: string
  proteinG: string
  fatG: string
  carbG: string
}

const INITIAL_FORM: FormState = {
  mealType: '',
  displayName: '',
  kcal: '',
  proteinG: '',
  fatG: '',
  carbG: '',
}

const MEAL_TYPE_OPTIONS: OffPlanMealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']

// ── Props ─────────────────────────────────────────────────────────────────

interface OffPlanMealLogModalProps {
  date: string
  onClose: () => void
}

// ── Component ─────────────────────────────────────────────────────────────

export function OffPlanMealLogModal({ date, onClose }: OffPlanMealLogModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const logMutation = useMutation({
    mutationFn: (req: LogOffPlanMealRequest) => offPlanMealsService.log(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', date] })
      capture('off_plan_meal_logged')
      onClose()
    },
    onError: () => {
      setErrors(prev => ({ ...prev, _submit: t('dashboard.offPlanMeal.submitError') }))
    },
  })

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.displayName.trim()) {
      next.displayName = t('common.required')
    }
    const kcalNum = parseFloat(form.kcal)
    if (!form.kcal || isNaN(kcalNum) || kcalNum < 0) {
      next.kcal = t('common.required')
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const req: LogOffPlanMealRequest = {
      date,
      displayName: form.displayName.trim(),
      kcal: parseFloat(form.kcal),
      ...(form.mealType ? { mealType: form.mealType } : {}),
      ...(form.proteinG ? { proteinG: parseFloat(form.proteinG) } : {}),
      ...(form.fatG ? { fatG: parseFloat(form.fatG) } : {}),
      ...(form.carbG ? { carbG: parseFloat(form.carbG) } : {}),
    }
    logMutation.mutate(req)
  }

  function field(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const isPending = logMutation.isPending

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('dashboard.offPlanMeal.modalTitle')}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-gray-800">
            {t('dashboard.offPlanMeal.modalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M12.207 3.793a1 1 0 0 0-1.414 0L8 6.586 5.207 3.793a1 1 0 0 0-1.414 1.414L6.586 8l-2.793 2.793a1 1 0 1 0 1.414 1.414L8 9.414l2.793 2.793a1 1 0 0 0 1.414-1.414L9.414 8l2.793-2.793a1 1 0 0 0 0-1.414Z" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 px-5 py-4">
          {/* Meal type */}
          <div className="flex flex-col gap-1">
            <label htmlFor="offplan-mealtype" className="text-[12px] font-medium text-gray-500">
              {t('dashboard.offPlanMeal.mealType')}
              <span className="ml-1 text-gray-400 font-normal">({t('common.optional')})</span>
            </label>
            <select
              id="offplan-mealtype"
              value={form.mealType}
              onChange={e => field('mealType', e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:border-transparent"
            >
              <option value="">{t('dashboard.offPlanMeal.mealTypePlaceholder')}</option>
              {MEAL_TYPE_OPTIONS.map(mt => (
                <option key={mt} value={mt}>
                  {t(`dashboard.offPlanMeal.mealTypes.${mt}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="offplan-name" className="text-[12px] font-medium text-gray-500">
              {t('dashboard.offPlanMeal.name')}
              <span className="ml-1 text-red-400 text-[11px]">*</span>
            </label>
            <input
              id="offplan-name"
              type="text"
              autoFocus
              value={form.displayName}
              onChange={e => field('displayName', e.target.value)}
              placeholder={t('dashboard.offPlanMeal.namePlaceholder')}
              className={[
                'rounded-xl border px-3 py-2.5 text-[13px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:border-transparent',
                errors.displayName ? 'border-red-300' : 'border-gray-200',
              ].join(' ')}
            />
            {errors.displayName && (
              <p className="text-[11px] text-red-500">{errors.displayName}</p>
            )}
          </div>

          {/* Kcal */}
          <div className="flex flex-col gap-1">
            <label htmlFor="offplan-kcal" className="text-[12px] font-medium text-gray-500">
              {t('dashboard.offPlanMeal.kcal')}
              <span className="ml-1 text-red-400 text-[11px]">*</span>
            </label>
            <input
              id="offplan-kcal"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={form.kcal}
              onChange={e => field('kcal', e.target.value)}
              placeholder="0"
              className={[
                'rounded-xl border px-3 py-2.5 text-[13px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:border-transparent',
                errors.kcal ? 'border-red-300' : 'border-gray-200',
              ].join(' ')}
            />
            {errors.kcal && (
              <p className="text-[11px] text-red-500">{errors.kcal}</p>
            )}
          </div>

          {/* Optional macros — protein / fat / carbs in a row */}
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-medium text-gray-500">
              {t('dashboard.offPlanMeal.optionalMacros')}
              <span className="ml-1 text-gray-400 font-normal">({t('common.optional')})</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: 'proteinG' as const, label: t('dashboard.offPlanMeal.protein') },
                  { key: 'fatG'     as const, label: t('dashboard.offPlanMeal.fat') },
                  { key: 'carbG'    as const, label: t('dashboard.offPlanMeal.carbs') },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <label htmlFor={`offplan-${key}`} className="text-[11px] text-gray-400">
                    {label}
                  </label>
                  <input
                    id={`offplan-${key}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    value={form[key]}
                    onChange={e => field(key, e.target.value)}
                    placeholder="0"
                    className="rounded-xl border border-gray-200 px-2.5 py-2 text-[13px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:border-transparent w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit error */}
          {'_submit' in errors && (
            <p className="text-[11px] text-red-500">{(errors as Record<string, string>)['_submit']}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-[#1A1A1A] py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
            >
              {isPending
                ? t('dashboard.offPlanMeal.submitting')
                : t('dashboard.offPlanMeal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
