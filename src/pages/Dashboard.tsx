import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { CalendarStrip } from '@/components/dashboard/CalendarStrip'
import { DailyTimeline } from '@/components/dashboard/DailyTimeline'
import { WeeklySummaryModule } from '@/components/dashboard/WeeklySummaryModule'
import { DiofaWidget } from '@/components/diofa/DiofaWidget'
import { MoistureHistoryStrip } from '@/components/diofa/MoistureHistoryStrip'
import { planService } from '@/services/plans'
import { usersService } from '@/services/users'
import { momentumService } from '@/services/momentum'
import { usePointsToast } from '@/hooks/usePointsToast'
import type { CalendarDayDto, MoistureBand } from '@/types'
import type { DiofaStage, DiofaMoisture } from '@/components/diofa/DiofaWidget'
import { isVisible } from '@/lib/dashboardVisibility'
import { LockedModulePlaceholder } from '@/components/dashboard/LockedModulePlaceholder'
import { TeachOnReturnHint } from '@/components/dashboard/TeachOnReturnHint'
import { useEngagementGap } from '@/hooks/useEngagementGap'

// Maps the 4-value MoistureBand from the backend to the 3-value DiofaMoisture used by the widget.
function toWidgetMoisture(band: MoistureBand): DiofaMoisture {
  if (band === 'SATURATED') return 'WET'
  if (band === 'MOIST') return 'OK'
  return 'DRY' // DRY | DRYING
}

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

export function Dashboard() {
  const { t } = useTranslation()
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const [selectedDayData, setSelectedDayData] = useState<CalendarDayDto | undefined>()

  usePointsToast()

  // Computes the engagement gap bucket once on mount; also writes today's date
  // to localStorage so future sessions can compute their own gap.
  const engagementGapBucket = useEngagementGap()

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

  // Fetch recent moisture history to derive the widget's current moisture band.
  // Only one day is needed (today), but the service minimum is the history window.
  // Re-use the same key shape TanStack Query uses elsewhere for momentum history.
  const { data: moistureHistory } = useQuery({
    queryKey: ['momentum', 'history', 1],
    queryFn: () => momentumService.getHistory(1),
    staleTime: 30_000,
    retry: false,
    enabled: isVisible('diofa-widget', visibleModules),
  })

  const diofaStage = (dashboardState?.stage as DiofaStage | undefined) ?? 'MAG'
  const todayBand = moistureHistory?.[moistureHistory.length - 1]?.band
  const diofaMoisture: DiofaMoisture = todayBand ? toWidgetMoisture(todayBand) : 'OK'

  return (
    <div className="flex flex-col">
      <Header title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <CalendarStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onDayData={setSelectedDayData}
      />
      {isVisible('current-plan', visibleModules) ? (
        <DailyTimeline
          date={selectedDate}
          hasShoppingDay={selectedDayData?.hasShoppingDay ?? false}
          activePlanId={activePlan?.id ?? null}
        />
      ) : (
        visibleModules !== undefined && (
          <LockedModulePlaceholder moduleId="current-plan" />
        )
      )}
      {isVisible('diofa-widget', visibleModules) ? (
        <section aria-label={t('diofa.sectionLabel')} className="px-4 pb-4 space-y-3">
          <TeachOnReturnHint bucket={engagementGapBucket} />
          <DiofaWidget stage={diofaStage} moisture={diofaMoisture} />
          <MoistureHistoryStrip />
        </section>
      ) : (
        visibleModules !== undefined && (
          <LockedModulePlaceholder moduleId="diofa-widget" />
        )
      )}
      {isVisible('weekly-summary', visibleModules) ? (
        <div className="px-4 pb-6">
          <WeeklySummaryModule />
        </div>
      ) : (
        visibleModules !== undefined && (
          <LockedModulePlaceholder moduleId="weekly-summary" />
        )
      )}
    </div>
  )
}
