/**
 * PremiumTrialOfferCard — KALMIO-145 / E6.6
 *
 * Presents the 14-day premium trial offer to a graduated user.
 *
 * Per founder decision (gamification-stories.md §10, KALMIO-145):
 * - No card capture at trial start.
 * - Trial ends automatically after 14 days.
 * - No billing surprise.
 *
 * The "Activate trial" CTA is intentionally a placeholder — the full payment /
 * entitlement flow is out of scope for this ticket. It logs a TODO reference
 * until W14 (KALMIO Founding Member tier) lands.
 *
 * Mobile-first. WCAG 2.1 AA: focus-visible ring, sufficient contrast.
 */

import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'

// ── Component ─────────────────────────────────────────────────────────────────

export function PremiumTrialOfferCard() {
  const { t } = useTranslation()

  function handleActivateTrial() {
    // TODO (KALMIO W14 / Founding Member tier): wire up Stripe/Barion trial
    // activation entitlement flow.  The backend endpoint and payment provider
    // integration are out of scope for KALMIO-145.
    console.log('[KALMIO-145] Premium trial CTA clicked — activation pending W14 implementation.')
  }

  return (
    <div className="rounded-2xl bg-[#f5f0e8] border border-[#d4c9b0]/60 shadow-sm px-5 py-5">
      {/* Duration badge */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#4F7942]/10 px-3 py-1 mb-3">
        <Sparkles className="h-3 w-3 text-[#4F7942]" aria-hidden="true" />
        <span className="text-xs font-semibold text-[#4F7942] tracking-wide uppercase">
          {t('grove.premiumTrial.durationBadge')}
        </span>
      </div>

      {/* Title + body */}
      <h3 className="font-semibold text-[15px] text-[#1A1A1A] leading-snug mb-1.5">
        {t('grove.premiumTrial.title')}
      </h3>
      <p className="text-sm text-[#3d2008]/65 leading-relaxed mb-2">
        {t('grove.premiumTrial.description')}
      </p>

      {/* No billing assurance */}
      <p className="text-xs text-[#3d2008]/50 mb-4">
        {t('grove.premiumTrial.noBilling')}
      </p>

      {/* CTA */}
      <button
        type="button"
        onClick={handleActivateTrial}
        className="
          w-full rounded-xl bg-[#4F7942] px-4 py-3
          text-sm font-semibold text-white text-center
          hover:bg-[#3e6133]
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-[#4F7942] focus-visible:ring-offset-2
          transition-colors
        "
      >
        {t('grove.premiumTrial.cta')}
      </button>
    </div>
  )
}
