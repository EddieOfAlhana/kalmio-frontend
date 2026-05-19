/**
 * PlanDetail — condensed planner view for a single multi-member plan.
 *
 * Shows:
 * - Plan name + date range + member chip strip
 * - Approval tray (replan suggestions)
 * - Day-by-day condensed grid (PlannerDayCard per day)
 * - Co-planner management (from plan settings — accessible via a settings button)
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Settings } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Spinner } from '@/components/ui/spinner'
import { MemberChip, OverflowChip } from '@/components/plan/MemberChip'
import { MEMBER_COLORS } from '@/components/plan/memberColors'
import { PlannerDayCard } from '@/components/plan/PlannerDayCard'
import { ApprovalTray } from '@/components/plan/ApprovalTray'
import { multiMemberPlanService } from '@/services/multiMemberPlanService'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/store/auth'
import type { PlannedMealSummary, MultiMemberPlan } from '@/types'

const MAX_HEADER_CHIPS = 5

/** Group meals by date string "YYYY-MM-DD". */
function groupByDate(meals: PlannedMealSummary[]): Map<string, PlannedMealSummary[]> {
  const map = new Map<string, PlannedMealSummary[]>()
  for (const m of meals) {
    const list = map.get(m.date) ?? []
    list.push(m)
    map.set(m.date, list)
  }
  return map
}

/** Generate the list of YYYY-MM-DD dates for a plan's range. */
function planDates(plan: MultiMemberPlan): string[] {
  const dates: string[] = []
  const start = new Date(plan.startDate)
  for (let i = 0; i < plan.durationDays; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

export function PlanDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')

  const { data: plan, isLoading, isError } = useQuery({
    queryKey: ['multiplan', id],
    queryFn: () => multiMemberPlanService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
    staleTime: 60_000,
  })

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['replan-suggestions', id],
    queryFn: () => multiMemberPlanService.getReplanSuggestions(id!),
    enabled: !!id,
    staleTime: 30_000,
  })

  const myDisplayName = me
    ? ([me.firstName, me.lastName].filter(Boolean).join(' ') || me.email)
    : currentUserId.slice(0, 8)

  // Build member name map — self is known; others fall back to short ID
  const memberNames: Record<string, string> = {}
  if (plan) {
    for (const uid of plan.memberIds) {
      memberNames[uid] = uid === currentUserId ? myDisplayName : uid.slice(0, 8)
    }
  }

  const locale = i18n.resolvedLanguage === 'hu' ? 'hu-HU' : 'en-GB'

  if (isLoading) {
    return (
      <div className="flex justify-center py-16" aria-live="polite" aria-busy="true">
        <Spinner />
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-red-600">{t('common.errorGeneric')}</p>
      </div>
    )
  }

  const mealsGrouped = groupByDate(plan.meals)
  const dates = planDates(plan)

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(d))

  const visibleMembers = plan.memberIds.slice(0, MAX_HEADER_CHIPS)
  const overflow = plan.memberIds.length - MAX_HEADER_CHIPS

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      <Header
        title={plan.name}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/app/plans')}
              className="text-sm text-[#6b7280] hover:text-[#1A1A1A] flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
              aria-label={t('common.back')}
            >
              <ChevronLeft className="w-4 h-4" />
              {t('common.back')}
            </button>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] hover:text-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
              aria-label={t('plan.detail.settings')}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Plan meta */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {visibleMembers.map((uid, i) => (
            <MemberChip
              key={uid}
              name={memberNames[uid] ?? uid}
              colorClass={MEMBER_COLORS[i % MEMBER_COLORS.length]}
              size="md"
            />
          ))}
          {overflow > 0 && <OverflowChip count={overflow} size="md" />}
        </div>
        <div className="text-xs text-[#6b7280]">
          {formatDate(plan.startDate)} – {formatDate(plan.endDate)} · {plan.durationDays} {t('plan.wizard.days')}
        </div>
      </div>

      {/* Approval tray */}
      {(suggestions.length > 0 || suggestionsLoading) && (
        <div className="mb-6">
          <ApprovalTray
            planId={plan.id}
            suggestions={suggestions}
            isLoading={suggestionsLoading}
            onEditSlot={(mealId) => {
              const el = document.getElementById(`meal-slot-${mealId}`)
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              el?.classList.add('ring-2', 'ring-[#4f46e5]', 'ring-offset-2')
              setTimeout(() => {
                el?.classList.remove('ring-2', 'ring-[#4f46e5]', 'ring-offset-2')
              }, 2000)
            }}
          />
        </div>
      )}

      {/* Day cards */}
      <div className="flex flex-col gap-4">
        {dates.map(date => (
          <PlannerDayCard
            key={date}
            date={date}
            meals={mealsGrouped.get(date) ?? []}
            allMemberIds={plan.memberIds}
            memberNames={memberNames}
          />
        ))}
      </div>
    </div>
  )
}
