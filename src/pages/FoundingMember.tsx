/**
 * FoundingMember — KALMIO-20 stub
 *
 * Placeholder for the founding member join flow (to be built in a follow-up ticket).
 * Reachable at /app/founding-member for logged-in users redirected from the landing CTA.
 */

import { useTranslation } from 'react-i18next'

export function FoundingMember() {
  const { t } = useTranslation()

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#111]">
      <p className="text-white/60 text-base text-center">
        {t('foundingMember.comingSoon')}
      </p>
    </main>
  )
}
