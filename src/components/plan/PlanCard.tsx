/**
 * PlanCard — summary card shown on the Plans list page.
 *
 * Shows: name, member chips, date range, meal coverage, shopping state, macro averages.
 */
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { MemberChip, OverflowChip } from './MemberChip'
import { MEMBER_COLORS } from './memberColors'
import type { MultiMemberPlan } from '@/types'

const MAX_CHIPS = 5

interface PlanCardProps {
  plan: MultiMemberPlan
  memberNames: Record<string, string>
}

export function PlanCard({ plan, memberNames }: PlanCardProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const visibleMembers = plan.memberIds.slice(0, MAX_CHIPS)
  const overflow = plan.memberIds.length - MAX_CHIPS

  const avgKcal = plan.meals.length > 0
    ? Math.round(plan.meals.reduce((sum, m) => sum + (m.macros?.kcal ?? 0), 0) / plan.meals.length)
    : null

  const isShopped = !!plan.shoppedAt

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage === 'hu' ? 'hu-HU' : 'en-GB', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(d))

  const mealTypeLabel = (mt: string) => t(`plan.mealTypes.${mt}`, mt)

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/app/plans/${plan.id}`)}
      role="article"
      aria-label={plan.name}
    >
      <CardContent className="flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-headline font-bold text-[#1A1A1A] text-base leading-tight truncate">
              {plan.name}
            </h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
            </p>
          </div>
          <span
            className={`
              shrink-0 px-2 py-0.5 rounded-full text-xs font-medium
              ${isShopped
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'}
            `}
          >
            {isShopped ? t('plan.card.shopped') : t('plan.card.pendingShopping')}
          </span>
        </div>

        {/* Member chips */}
        <div className="flex items-center gap-1">
          {visibleMembers.map((uid, i) => (
            <MemberChip
              key={uid}
              name={memberNames[uid] ?? uid}
              colorClass={MEMBER_COLORS[i % MEMBER_COLORS.length]}
              size="sm"
            />
          ))}
          {overflow > 0 && <OverflowChip count={overflow} />}
        </div>

        {/* Meal coverage + macro avg */}
        <div className="flex items-center justify-between text-xs text-[#6b7280]">
          <span>
            {plan.mealSlotsCovered.map(mealTypeLabel).join(' · ')}
          </span>
          {avgKcal !== null && (
            <span>{t('plan.card.avgKcal', { kcal: avgKcal })}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
