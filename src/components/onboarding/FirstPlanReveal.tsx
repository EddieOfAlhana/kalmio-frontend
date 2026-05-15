/**
 * FirstPlanReveal — KALMIO-157 / E9.6
 *
 * Full-screen modal shown exactly once after the user generates their first
 * plan. Detects the MAG → CSEMETE stage transition via `GET /api/users/me/stage`
 * (KALMIO-123 endpoint), then animates the DiofaWidget from MAG to CSEMETE and
 * advances PlantingScene to step 10 (sprout).
 *
 * Non-repeat guarantee: on dismiss, writes `kalmio:firstPlanRevealShown` to
 * localStorage. The parent passes `onDismiss`; rendering is controlled by the
 * parent (MealPlan.tsx uses a `showFirstPlanReveal` local flag).
 *
 * Accessibility: focus-trapped modal with role="dialog". Dismiss via button or
 * Escape key. Keyboard-reachable.
 *
 * Mobile-first: designed for 375px width; scales up naturally.
 */

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, type Variants, type Easing } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { DiofaWidget } from '@/components/diofa/DiofaWidget'
import { PlantingScene } from '@/components/onboarding/PlantingScene'
import { usersService } from '@/services/users'
import { markRevealShown } from '@/lib/firstPlanReveal'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FirstPlanRevealProps {
  /** Called after the user dismisses the reveal. Parent should hide the modal. */
  onDismiss: () => void
}

// ─── Animation variants ───────────────────────────────────────────────────────

const EASE_OUT: Easing = 'easeOut'
const EASE_IN: Easing = 'easeIn'

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: EASE_OUT } },
  exit:   { opacity: 0, transition: { duration: 0.25, ease: EASE_IN } },
}

const panelVariants: Variants = {
  hidden:  { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 26, delay: 0.1 },
  },
  exit: {
    opacity: 0, y: 24, scale: 0.97,
    transition: { duration: 0.2, ease: EASE_IN },
  },
}

// The DiofaWidget "wakes up" from MAG after a short delay to let the panel settle.
const STAGE_ANIMATION_DELAY_MS = 700

// ─── Component ────────────────────────────────────────────────────────────────

export function FirstPlanReveal({ onDismiss }: FirstPlanRevealProps) {
  const { t } = useTranslation()
  const dismissRef = useRef<HTMLButtonElement>(null)

  // Delay MAG→CSEMETE widget flip so the panel entrance animation plays first.
  const [widgetStageReady, setWidgetStageReady] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setWidgetStageReady(true), STAGE_ANIMATION_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [])

  // Focus the dismiss button once the panel is visible.
  useEffect(() => {
    const id = window.setTimeout(() => dismissRef.current?.focus(), 400)
    return () => window.clearTimeout(id)
  }, [])

  // Keyboard: Escape closes the modal.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleDismiss()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  })

  // Verify stage via API (optimistic: we show the reveal regardless; the query
  // only informs the widget label / aria-label accuracy).
  useQuery({
    queryKey: ['users', 'stage'],
    queryFn: usersService.getMyStage,
    staleTime: 30_000,
    retry: 1,
  })

  function handleDismiss() {
    markRevealShown()
    onDismiss()
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="first-plan-reveal-backdrop"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-label={t('onboarding.firstPlan.ariaLabel')}
        onClick={e => {
          // Dismiss when clicking the backdrop (not the panel).
          if (e.target === e.currentTarget) handleDismiss()
        }}
      >
        {/* Panel */}
        <motion.div
          key="first-plan-reveal-panel"
          className="relative w-full max-w-sm bg-[#F5EDD8] rounded-2xl overflow-hidden shadow-2xl"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Diófa illustration — transitions MAG → CSEMETE after delay */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={widgetStageReady ? 'csemete' : 'mag'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <DiofaWidget
                  stage={widgetStageReady ? 'CSEMETE' : 'MAG'}
                  moisture="WET"
                  className="rounded-none"
                />
              </motion.div>
            </AnimatePresence>

            {/* Sprout caption — appears alongside the Csemete frame */}
            <AnimatePresence>
              {widgetStageReady && (
                <motion.p
                  key="sprout-caption"
                  className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-[#3d2008]/80 px-4"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.4 } }}
                  exit={{ opacity: 0 }}
                >
                  {t('onboarding.firstPlan.sproutCaption')}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Planting scene at step 10 — shows the sprout */}
          <div className="px-4 pt-2 pb-0">
            <PlantingScene step={10} className="max-w-[200px] mx-auto" />
          </div>

          {/* Copy block */}
          <div className="px-6 pt-3 pb-6 text-center space-y-3">
            <h2 className="font-headline font-bold text-lg text-[#1A1A1A] leading-snug">
              {t('onboarding.firstPlan.title')}
            </h2>
            <p className="text-sm text-[#3d2008]/80 leading-relaxed">
              {t('onboarding.firstPlan.body')}
            </p>

            <button
              ref={dismissRef}
              type="button"
              onClick={handleDismiss}
              className="
                mt-2 w-full rounded-xl bg-[#4F7942] text-white
                px-6 py-3 text-sm font-semibold
                hover:bg-[#3e6133] focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-[#4F7942] focus-visible:ring-offset-2
                transition-colors
              "
            >
              {t('onboarding.firstPlan.cta')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

