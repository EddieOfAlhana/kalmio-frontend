import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { CalendarStrip } from '@/components/dashboard/CalendarStrip'
import { DailyTimeline } from '@/components/dashboard/DailyTimeline'
import { WeeklySummaryModule } from '@/components/dashboard/WeeklySummaryModule'
import { planService } from '@/services/plans'
import { usersService } from '@/services/users'
import { usePointsToast } from '@/hooks/usePointsToast'
import type { CalendarDayDto, DashboardModuleId } from '@/types'

/**
 * Maps each module identifier (from the dashboard-state API) to the
 * Dashboard components that should be gated by it.
 *
 * Modules not yet rendered in Dashboard.tsx are listed here for forward
 * compatibility — they will simply not match any rendered element until
 * the component is added.
 *
 * Identifiers defined in DashboardModuleId:
 *   current-plan, shopping-list, fridge-basic, diofa-widget,
 *   macro-tracker, prep-tasks, weekly-summary, taste-signals,
 *   replan-diff, grooming-prompt, off-plan-meals, points-counter, achievements
 *
 * Current rendered mapping:
 *   DailyTimeline    ← 'current-plan'  (includes today's meals & prep tasks)
 *   WeeklySummaryModule ← 'weekly-summary'
 */

/** Returns true when the module should be shown. Falls back to visible when
 *  visibleModules is undefined (backend not yet deployed / degraded). */
function isVisible(
  moduleId: DashboardModuleId,
  visibleModules: DashboardModuleId[] | undefined,
): boolean {
  if (visibleModules === undefined) return true
  return visibleModules.includes(moduleId)
}

export function Dashboard() {
  const { t } = useTranslation()
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const [selectedDayData, setSelectedDayData] = useState<CalendarDayDto | undefined>()

  usePointsToast()

  const { data: activePlan } = useQuery({
    queryKey: ['plan', 'active'],
    queryFn: planService.getActive,
    staleTime: 60_000,
  })

  const { data: dashboardState } = useQuery({
    queryKey: ['users', 'me', 'dashboard-state'],
    queryFn: usersService.getMyDashboardState,
    staleTime: 30_000,
    // If the backend endpoint is not yet deployed (404/5xx), treat as all-visible.
    retry: false,
  })

  const visibleModules = dashboardState?.visibleModules

  return (
    <div className="flex flex-col">
      <Header title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <CalendarStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onDayData={setSelectedDayData}
      />
      {isVisible('current-plan', visibleModules) && (
        <DailyTimeline
          date={selectedDate}
          hasShoppingDay={selectedDayData?.hasShoppingDay ?? false}
          activePlanId={activePlan?.id ?? null}
        />
      )}
      {isVisible('weekly-summary', visibleModules) && (
        <div className="px-4 pb-6">
          <WeeklySummaryModule />
        </div>
      )}
    </div>
  )
}
