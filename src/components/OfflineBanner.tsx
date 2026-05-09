import { WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const { t } = useTranslation()
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-neutral-800 px-4 py-2.5 text-sm text-white">
      <WifiOff size={14} />
      {t('common.offline')}
    </div>
  )
}
