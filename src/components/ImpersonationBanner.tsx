import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'

export function ImpersonationBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const impersonationToken = useAuthStore((s) => s.impersonationToken)
  const impersonatedEmail = useAuthStore((s) => s.impersonatedEmail)
  const stopImpersonation = useAuthStore((s) => s.stopImpersonation)

  if (!impersonationToken) return null

  function handleExit() {
    stopImpersonation()
    qc.clear()
    navigate('/app/admin/users')
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
      <span>{t('impersonation.banner', { email: impersonatedEmail })}</span>
      <button
        type="button"
        onClick={handleExit}
        className="underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded"
      >
        {t('impersonation.exit')}
      </button>
    </div>
  )
}
