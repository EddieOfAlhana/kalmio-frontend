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
import { dashboardService } from '@/services/dashboard'
import { planService } from '@/services/plans'

export function Dashboard() {
  const { t } = useTranslation()
  const today = new Date().toISOString().split('T')[0]

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
        <TodaysMealsModule
          meals={dashboard?.todaysMeals ?? []}
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
        <PointsModule total={dashboard?.pointsTotal ?? 0} />
      </div>
    </div>
  )
}
