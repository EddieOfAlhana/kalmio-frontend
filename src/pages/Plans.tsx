/**
 * Plans — plan list / dashboard page.
 *
 * Shows active, upcoming, and past plans with filter chips.
 * Each plan is a PlanCard linking to /app/plans/:id.
 * "New plan" button leads to /app/plans/new (wizard).
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { PlanCard } from '@/components/plan/PlanCard'
import { multiMemberPlanService } from '@/services/multiMemberPlanService'
import { usersService } from '@/services/users'
import { filterPlans, type FilterStatus } from './planUtils'



export function Plans() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterStatus>('all')

  const { data: plans = [], isLoading, isError } = useQuery({
    queryKey: ['multiplans'],
    queryFn: () => multiMemberPlanService.list(),
    staleTime: 30_000,
  })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
    staleTime: 60_000,
  })

  // Build a name map from plan member IDs.
  // In the absence of a batch-lookup endpoint, we show member ID initials for non-self members.
  const memberNames: Record<string, string> = {}
  if (me?.id) memberNames[me.id] = ([me.firstName, me.lastName].filter(Boolean).join(' ') || me.email) ?? me.id

  const filtered = filterPlans(plans, filter)

  const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: t('plan.filter.all') },
    { key: 'active', label: t('plan.filter.active') },
    { key: 'upcoming', label: t('plan.filter.upcoming') },
    { key: 'past', label: t('plan.filter.past') },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      <Header
        title={t('plan.listTitle')}
        actions={
          <Button onClick={() => navigate('/app/plans/new')} size="sm" className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" aria-hidden />
            {t('plan.newPlanCta')}
          </Button>
        }
      />

      {/* Filter chips */}
      <div
        className="flex gap-2 flex-wrap mb-6"
        role="group"
        aria-label={t('plan.filter.label')}
      >
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
              ${filter === f.key
                ? 'bg-[#4f46e5] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'}
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center py-10" aria-live="polite" aria-busy="true">
          <Spinner />
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-600 py-4">{t('common.errorGeneric')}</p>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-[#6b7280] text-sm">{t('plan.noPlans')}</p>
          <Button onClick={() => navigate('/app/plans/new')} size="sm">
            {t('plan.newPlanCta')}
          </Button>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(plan => (
            <PlanCard key={plan.id} plan={plan} memberNames={memberNames} />
          ))}
        </div>
      )}
    </div>
  )
}
