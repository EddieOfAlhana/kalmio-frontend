import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { prepTaskService } from '@/services/dashboard'
import type { PrepTaskCard, PrepType, PrepWindow } from '@/types'

interface TodaysPrepModuleProps {
  tasks: PrepTaskCard[]
  dashboardDate: string
}

function prepTypeLabel(prepType: PrepType, t: (key: string) => string): string {
  const key = `dashboard.prep.prepTypeLabels.${prepType}`
  return t(key)
}

function windowLabel(window: PrepWindow, t: (key: string) => string): string {
  const key = `dashboard.prep.windowLabels.${window}`
  return t(key)
}

interface PrepTaskRowProps {
  task: PrepTaskCard
  dashboardDate: string
}

function PrepTaskRow({ task, dashboardDate }: PrepTaskRowProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const markDone = useMutation({
    mutationFn: () => {
      if (!task.id) return Promise.reject(new Error('no id'))
      return prepTaskService.updateStatus(task.id, 'DONE')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardDate] })
      toast({ title: t('dashboard.prep.markDone'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const hasId = !!task.id
  const typeLabel = prepTypeLabel(task.prepType, t)
  const wLabel = windowLabel(task.window, t)

  return (
    <div className="flex items-start gap-3 p-3 rounded-[12px] bg-[#F9F7F2]">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium capitalize">{wLabel}</p>
        <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">{task.recipeName}</p>
        <p className="text-xs text-gray-400">{typeLabel}</p>
        {task.durationMin != null && (
          <p className="text-xs text-gray-400 mt-0.5">
            {t('dashboard.prep.durationMin', { count: task.durationMin })}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {hasId ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => markDone.mutate()}
            disabled={markDone.isPending}
            aria-label={t('dashboard.prep.markDone')}
          >
            {markDone.isPending ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className="sr-only">{t('dashboard.prep.markDone')}</span>
          </Button>
        ) : (
          <Button size="sm" variant="secondary" disabled>
            {t('common.comingSoon')}
          </Button>
        )}
      </div>
    </div>
  )
}

export function TodaysPrepModule({ tasks, dashboardDate }: TodaysPrepModuleProps) {
  const { t } = useTranslation()

  if (tasks.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.prep.todayTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 space-y-2">
        {tasks.map((task, idx) => (
          <PrepTaskRow
            key={task.id ?? `${task.recipeId}-${task.window}-${idx}`}
            task={task}
            dashboardDate={dashboardDate}
          />
        ))}
      </CardContent>
    </Card>
  )
}
