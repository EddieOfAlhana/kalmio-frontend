import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { CalendarStrip } from '@/components/dashboard/CalendarStrip'
import { DailyTimeline } from '@/components/dashboard/DailyTimeline'
import { planService } from '@/services/plans'
import { usePointsToast } from '@/hooks/usePointsToast'
import type { CalendarDayDto } from '@/types'

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

  return (
    <div className="flex flex-col">
      <Header title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <CalendarStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onDayData={setSelectedDayData}
      />
      <DailyTimeline
        date={selectedDate}
        hasShoppingDay={selectedDayData?.hasShoppingDay ?? false}
        activePlanId={activePlan?.id ?? null}
      />
    </div>
  )
}
