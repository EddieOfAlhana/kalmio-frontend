import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/components/ui/toast'
import { usePoints } from './usePoints'
import type { PointEventDto } from '@/types'

export function pointsToastMessage(event: PointEventDto, t: (key: string) => string): string {
  switch (event.eventType) {
    case 'FIRST_PLAN':
      return t('points.toast.firstPlan')
    case 'FIRST_GROOMING':
      return t('points.toast.firstGrooming')
    case 'FIRST_PREP_DONE':
      return t('points.toast.firstPrepDone')
    case 'FIRST_REPLAN_ACCEPTED':
      return t('points.toast.firstReplanAccepted')
    case 'PLAN_GENERATED':
      return t('points.toast.planGenerated')
    case 'GROOMING_COMPLETED':
      return t('points.toast.groomingCompleted')
    case 'PREP_TASK_DONE':
      return t('points.toast.prepTaskDone')
    case 'REPLAN_ACCEPTED':
      return t('points.toast.replanAccepted')
    default:
      return `+${event.points} pont`
  }
}

export function usePointsToast() {
  const { t } = useTranslation()
  const { data } = usePoints()
  const prevTotalRef = useRef<number | null>(null)

  useEffect(() => {
    if (data === undefined) return

    const currentTotal = data.total

    if (prevTotalRef.current !== null && currentTotal > prevTotalRef.current) {
      const mostRecent = data.recentEvents[0]
      if (mostRecent) {
        toast({
          title: pointsToastMessage(mostRecent, t),
          variant: 'success',
          duration: 4000,
        })
      }
    }

    prevTotalRef.current = currentTotal
  }, [data, t])
}
