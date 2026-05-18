import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'

/**
 * Persistent banner shown during any active impersonation session.
 *
 * Supports two contexts:
 *  - Admin impersonation: `impersonatedEmail` is an email address; returns to /app/admin/users.
 *  - Family impersonation: `impersonatedEmail` is a display name; returns to /app/family.
 *
 * The banner cannot be dismissed accidentally — there is no close button.
 * "Return to your view" always stops impersonation and clears the query cache.
 */
export function ImpersonationBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const impersonationToken = useAuthStore((s) => s.impersonationToken)
  const impersonatedEmail = useAuthStore((s) => s.impersonatedEmail)
  const impersonationContext = useAuthStore((s) => s.impersonationContext)
  const stopImpersonation = useAuthStore((s) => s.stopImpersonation)

  if (!impersonationToken) return null

  function handleExit() {
    stopImpersonation()
    qc.clear()
    if (impersonationContext === 'family') {
      navigate('/app/family')
    } else {
      navigate('/app/admin/users')
    }
  }

  const displayLabel = impersonatedEmail ?? ''
  const bannerKey =
    impersonationContext === 'family'
      ? 'family.impersonation.banner'
      : 'impersonation.banner'
  const exitKey =
    impersonationContext === 'family'
      ? 'family.impersonation.returnCta'
      : 'impersonation.exit'

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-4"
    >
      <span>{t(bannerKey, { name: displayLabel, email: displayLabel })}</span>
      <button
        type="button"
        onClick={handleExit}
        className="shrink-0 underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded"
      >
        {t(exitKey)}
      </button>
    </div>
  )
}
