import { useTranslation } from 'react-i18next'

interface PointsModuleProps {
  total: number
}

export function PointsModule({ total }: PointsModuleProps) {
  const { t } = useTranslation()

  return (
    <div className="text-center text-sm text-gray-400 py-2">
      {t('dashboard.points.total', { count: total })}
    </div>
  )
}
