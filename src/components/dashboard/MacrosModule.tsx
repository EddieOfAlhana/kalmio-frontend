import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dashboardService } from '@/services/dashboard'

interface MacrosModuleProps {
  date: string
}

export function MacrosModule({ date }: MacrosModuleProps) {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['macros', date],
    queryFn: () => dashboardService.getMacros(date),
    staleTime: 30_000,
  })

  if (isLoading || !data) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.macros.title')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-500">
          {Math.round(data.consumed.kcal)} / {Math.round(data.target.kcal)}{' '}
          {t('dashboard.macros.kcal')} &middot;{' '}
          {Math.round(data.consumed.protein)} / {Math.round(data.target.protein)}g{' '}
          {t('dashboard.macros.protein')}
        </p>
      </CardContent>
    </Card>
  )
}
