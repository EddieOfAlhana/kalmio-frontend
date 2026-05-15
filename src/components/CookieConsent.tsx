import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { acceptAnalytics, declineAnalytics, getConsent } from '@/lib/analytics'

export function CookieConsent() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => getConsent() === null)

  if (!visible) return null

  function handleAccept() {
    acceptAnalytics()
    setVisible(false)
  }

  function handleDecline() {
    declineAnalytics()
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label={t('common.cookieConsentRegion')}
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-lg bg-white rounded-t-2xl shadow-xl px-6 py-5">
        <p className="text-sm text-[#1A1A1A]/80 leading-relaxed">
          {'🍪 '}{t('consent.body')}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAccept}
            className="bg-[#F28C28] hover:bg-[#e07820] text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
          >
            {t('consent.accept')}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="border border-[#1A1A1A]/20 hover:border-[#1A1A1A]/40 text-[#1A1A1A]/60 hover:text-[#1A1A1A]/80 text-sm font-medium px-5 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30 focus-visible:ring-offset-2"
          >
            {t('consent.decline')}
          </button>
          <Link
            to="/privacy"
            className="text-xs text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60 underline underline-offset-2 transition-colors ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30 focus-visible:ring-offset-1 rounded"
          >
            {t('consent.learnMore')}
          </Link>
        </div>
      </div>
    </div>
  )
}
