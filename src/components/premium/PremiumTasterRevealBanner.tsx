/**
 * PremiumTasterRevealBanner — KALMIO-173 / E10.5
 *
 * Bottom-sheet style modal shown exactly once when the user transitions to a
 * stage that carries a premium taster grant (SUHANG: 1 day, FIATAL: 3 days,
 * TERMO: 14 days). Different copy is shown per stage.
 *
 * Non-repeat guarantee: the parent hook (usePremiumTaster) checks
 * `kalmio:premiumTasterShown:<STAGE>` in localStorage and passes `onDismiss`,
 * which writes the flag. This component is purely presentational.
 *
 * Tone: warm, brief, no motivational copy. Passes billionaire's-assistant filter.
 *
 * Accessibility: role="dialog" modal. Dismiss via the button or Escape key.
 * All interactive elements are keyboard-reachable.
 *
 * Mobile-first: designed at 375px, scales naturally to desktop.
 */

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence, type Variants, type Easing } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { UserStageValue } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TasterStage = Extract<UserStageValue, 'SUHANG' | 'FIATAL' | 'TERMO'>

export interface PremiumTasterRevealBannerProps {
  /** The stage whose taster grant is being revealed. */
  stage: TasterStage
  /** Called after the user dismisses the banner. Parent should stop rendering. */
  onDismiss: () => void
}

// ─── Animation variants ───────────────────────────────────────────────────────

const EASE_OUT: Easing = 'easeOut'
const EASE_IN: Easing = 'easeIn'

const backdropVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: EASE_OUT } },
  exit:    { opacity: 0, transition: { duration: 0.22, ease: EASE_IN } },
}

const panelVariants: Variants = {
  hidden:  { opacity: 0, y: 48, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 26, delay: 0.07 },
  },
  exit: {
    opacity: 0, y: 32, scale: 0.97,
    transition: { duration: 0.2, ease: EASE_IN },
  },
}

// ─── Stage-colour map ─────────────────────────────────────────────────────────

/**
 * Each stage has a subtle accent colour that matches its Diófa visual identity.
 * SUHANG: young-green; FIATAL: mid-green; TERMO: deep forest-green.
 */
const STAGE_ACCENT: Record<TasterStage, string> = {
  SUHANG: '#6B9E5E',
  FIATAL: '#4F7942',
  TERMO:  '#3a5f30',
}

// ─── i18n key helper ──────────────────────────────────────────────────────────

function stageKey(stage: TasterStage): 'suhang' | 'fiatal' | 'termo' {
  return stage.toLowerCase() as 'suhang' | 'fiatal' | 'termo'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PremiumTasterRevealBanner({ stage, onDismiss }: PremiumTasterRevealBannerProps) {
  const { t } = useTranslation()
  const ctaRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()

  const sk = stageKey(stage)
  const accent = STAGE_ACCENT[stage]

  // Focus the primary CTA once the panel has settled.
  useEffect(() => {
    const id = window.setTimeout(() => ctaRef.current?.focus(), 420)
    return () => window.clearTimeout(id)
  }, [])

  // Escape closes the banner.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onDismiss])

  function handleCta() {
    onDismiss()
    navigate('/app/premium')
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="premium-taster-backdrop"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-label={t(`premium.tasterReveal.${sk}.ariaLabel`)}
        onClick={e => {
          if (e.target === e.currentTarget) onDismiss()
        }}
      >
        {/* Panel */}
        <motion.div
          key="premium-taster-panel"
          className="relative w-full max-w-sm bg-[#F5EDD8] rounded-2xl overflow-hidden shadow-2xl"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Accent bar at top — stage colour */}
          <div className="h-1 w-full" style={{ backgroundColor: accent }} />

          {/* Close button */}
          <button
            type="button"
            onClick={onDismiss}
            className="
              absolute top-4 right-4 z-10
              w-8 h-8 flex items-center justify-center rounded-full
              text-[#3d2008]/60 hover:text-[#3d2008] hover:bg-[#e8d9b8]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#4F7942] focus-visible:ring-offset-1
              transition-colors
            "
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Body */}
          <div className="px-6 pt-6 pb-5 space-y-3">
            {/* Duration badge */}
            <span
              className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {t(`premium.tasterReveal.${sk}.badge`)}
            </span>

            {/* Headline */}
            <h2 className="font-headline font-bold text-lg text-[#1A1A1A] leading-snug">
              {t(`premium.tasterReveal.${sk}.title`)}
            </h2>

            {/* Sub-copy */}
            <p className="text-sm text-[#3d2008]/75 leading-relaxed">
              {t(`premium.tasterReveal.${sk}.sub`)}
            </p>
          </div>

          {/* CTAs */}
          <div className="px-6 pb-6 pt-1 flex flex-col gap-2">
            <button
              ref={ctaRef}
              type="button"
              onClick={handleCta}
              className="
                w-full rounded-xl text-white
                px-6 py-3 text-sm font-semibold
                hover:opacity-90 active:opacity-80
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-offset-2
                transition-opacity
              "
              style={{ backgroundColor: accent }}
            >
              {t(`premium.tasterReveal.${sk}.cta`)}
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="
                w-full rounded-xl bg-transparent
                px-6 py-2 text-sm font-medium text-[#3d2008]/60
                hover:text-[#3d2008]/90
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[#4F7942] focus-visible:ring-offset-1
                transition-colors
              "
            >
              {t('premium.tasterReveal.dismiss')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
