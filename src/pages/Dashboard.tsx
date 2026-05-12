import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { TodaysMealsModule } from '@/components/dashboard/TodaysMealsModule'
import { TodaysPrepModule } from '@/components/dashboard/TodaysPrepModule'
import { TomorrowPrepModule } from '@/components/dashboard/TomorrowPrepModule'
import { PlanGlanceModule } from '@/components/dashboard/PlanGlanceModule'
import { ActivationCard } from '@/components/dashboard/ActivationCard'
import { PointsModule } from '@/components/dashboard/PointsModule'
import { MacrosModule } from '@/components/dashboard/MacrosModule'
import { ReplanDiffCard } from '@/components/dashboard/ReplanDiffCard'
import { dashboardService } from '@/services/dashboard'
import { planService } from '@/services/plans'
import { usePointsToast } from '@/hooks/usePointsToast'

export function Dashboard() {
  const { t } = useTranslation()
  const today = new Date().toISOString().split('T')[0]
  const [replanDismissed, setReplanDismissed] = useState(false)

  usePointsToast()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', today],
    queryFn: () => dashboardService.get(today),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  const { data: activePlan } = useQuery({
    queryKey: ['plan', 'active'],
    queryFn: planService.getActive,
    staleTime: 60_000,
  })

  const hasActivePlan = dashboard?.activeFlags?.hasActivePlan ?? !!activePlan

  return (
    <div>
      <Header
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />
      <div className="space-y-6">
        {dashboard?.activeFlags?.hasReplanDiff && activePlan && !replanDismissed && (
          <ReplanDiffCard
            planId={activePlan.id}
            onAccept={() => setReplanDismissed(true)}
            onDecline={() => setReplanDismissed(true)}
          />
        )}
        <TodaysMealsModule
          meals={dashboard?.todaysMeals ?? []}
          offPlanMeals={dashboard?.offPlanMeals ?? []}
          activePlan={activePlan}
          isLoading={isLoading}
        />
        {hasActivePlan && <MacrosModule date={today} />}
        {(dashboard?.todaysPrepTasks?.length ?? 0) > 0 && (
          <TodaysPrepModule
            tasks={dashboard!.todaysPrepTasks}
            dashboardDate={today}
          />
        )}
        {(dashboard?.tomorrowsPrepTasks?.length ?? 0) > 0 && (
          <TomorrowPrepModule tasks={dashboard!.tomorrowsPrepTasks} />
        )}
        {hasActivePlan ? (
          <PlanGlanceModule glance={dashboard?.planGlance ?? null} />
        ) : (
          <ActivationCard />
        )}
        <PointsModule />
      </div>
    </div>
  )
}
