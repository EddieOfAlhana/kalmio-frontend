/**
 * ApprovalTray — household-scope replan diff review panel.
 *
 * Shows a list of replan_suggestions with diff rendering.
 * Per-suggestion accept/reject/edit actions + bulk accept for low-risk.
 *
 * BE4 endpoints are not yet available; the tray renders gracefully with empty data.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, X, Pencil, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { multiMemberPlanService } from '@/services/multiMemberPlanService'
import type { ReplanSuggestion } from '@/types'

interface ApprovalTrayProps {
  planId: string
  suggestions: ReplanSuggestion[]
  isLoading?: boolean
  onEditSlot?: (mealId: string) => void
}

function RiskBadge({ level }: { level: ReplanSuggestion['riskLevel'] }) {
  const { t } = useTranslation()
  const classes = {
    LOW: 'bg-emerald-50 text-emerald-700',
    MEDIUM: 'bg-amber-50 text-amber-700',
    HIGH: 'bg-red-50 text-red-700',
  }[level]
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${classes}`}>
      {t(`approval.risk.${level.toLowerCase()}`)}
    </span>
  )
}

export function ApprovalTray({ planId, suggestions, isLoading = false, onEditSlot }: ApprovalTrayProps) {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = suggestions.filter(s => !dismissed.has(s.id))
  const lowRiskIds = visible.filter(s => s.riskLevel === 'LOW').map(s => s.id)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['multiplan', planId] })

  const acceptMut = useMutation({
    mutationFn: (id: string) => multiMemberPlanService.acceptSuggestion(planId, id),
    onSuccess: (_d, id) => {
      setDismissed(prev => new Set([...prev, id]))
      invalidate()
      toast({ title: t('approval.acceptedOne') })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  const rejectMut = useMutation({
    mutationFn: (id: string) => multiMemberPlanService.rejectSuggestion(planId, id),
    onSuccess: (_d, id) => {
      setDismissed(prev => new Set([...prev, id]))
      invalidate()
      toast({ title: t('approval.rejectedOne') })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  const acceptAllMut = useMutation({
    mutationFn: () => multiMemberPlanService.acceptAllSuggestions(planId),
    onSuccess: () => {
      setDismissed(prev => new Set([...prev, ...lowRiskIds]))
      invalidate()
      toast({ title: t('approval.acceptedAll') })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6" aria-live="polite" aria-busy="true">
        <Spinner />
      </div>
    )
  }

  if (visible.length === 0) {
    return null
  }

  const locale = i18n.resolvedLanguage === 'hu' ? 'hu-HU' : 'en-GB'
  const formatDate = (d: string) =>
    new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(d))

  return (
    <section aria-label={t('approval.sectionLabel')} className="flex flex-col gap-3">
      {/* Banner */}
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
        <Bell className="w-4 h-4 text-amber-600 shrink-0" aria-hidden />
        <p className="text-sm text-amber-800 font-medium flex-1">
          {t('approval.bannerText', { count: visible.length })}
        </p>
        {lowRiskIds.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs"
            onClick={() => acceptAllMut.mutate()}
            disabled={acceptAllMut.isPending}
          >
            {acceptAllMut.isPending ? <Spinner className="w-3 h-3" /> : t('approval.acceptAll')}
          </Button>
        )}
      </div>

      {/* Suggestion list */}
      <div className="flex flex-col gap-2">
        {visible.map(s => (
          <div
            key={s.id}
            className="flex flex-col gap-2 bg-white rounded-xl border border-[#e5e4e7] px-4 py-3"
          >
            {/* Diff header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#6b7280] capitalize">{formatDate(s.date)}</span>
                  <span className="text-xs text-[#6b7280]">·</span>
                  <span className="text-xs text-[#6b7280]">{t(`plan.mealTypes.${s.mealType}`, s.mealType)}</span>
                  <RiskBadge level={s.riskLevel} />
                </div>
                <p className="text-sm text-[#1A1A1A] mt-1">
                  {s.oldRecipeName
                    ? t('approval.swapDiff', { from: s.oldRecipeName, to: s.newRecipeName })
                    : t('approval.addDiff', { to: s.newRecipeName })}
                </p>
                <p className="text-xs text-[#9ca3af] mt-0.5 italic">{s.reason}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t('approval.accept')}
                onClick={() => acceptMut.mutate(s.id)}
                disabled={acceptMut.isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('approval.accept')}
              </button>
              <button
                type="button"
                aria-label={t('approval.reject')}
                onClick={() => rejectMut.mutate(s.id)}
                disabled={rejectMut.isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <X className="w-3.5 h-3.5" />
                {t('approval.reject')}
              </button>
              {onEditSlot && (
                <button
                  type="button"
                  aria-label={t('approval.edit')}
                  onClick={() => {}}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {t('approval.edit')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
