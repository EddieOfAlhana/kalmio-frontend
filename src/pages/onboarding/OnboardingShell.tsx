/**
 * OnboardingShell — KALMIO-167
 *
 * Multi-step onboarding container.  Owns:
 *   1. A 10-step progress indicator (OnboardingProgressBar, top of screen).
 *   2. A "Kihagyom most" link visible from step 2 onward (SkipConfirmModal).
 *   3. Resume: reads the last persisted step from localStorage on mount
 *      and lands the returning user there automatically.
 *   4. Step content: renders a step-specific content panel.  Steps that
 *      belong to KALMIO-166 (mini-tutorial components) are stubbed with
 *      <StepPlaceholder /> until that branch merges.
 *
 * Route: /app/onboarding  (ProtectedRoute, no AppShell chrome — full-screen)
 *
 * Step → scene mapping (gamification-progression.md §4.1, mirrored in
 * PlantingScene.tsx): shell step is 1-indexed; PlantingScene step is 0-indexed.
 *   Shell step 1  → PlantingScene 0  — Welcome
 *   Shell step 2  → PlantingScene 1  — Household size
 *   Shell step 3  → PlantingScene 2  — Activity + calories
 *   Shell step 4  → PlantingScene 3  — Dietary restrictions
 *   Shell step 5  → PlantingScene 4  — Shopping cadence
 *   Shell step 6  → PlantingScene 5  — Forbidden ingredients
 *   Shell step 7  → PlantingScene 6  — Taste swipe
 *   Shell step 8  → PlantingScene 7  — Plan generation (loading)
 *   Shell step 9  → PlantingScene 8  — First plan reveal
 *   Shell step 10 → PlantingScene 9/10 — User accepts plan / Csemete
 *
 * TODO (KALMIO-166): Replace <StepPlaceholder /> with the real mini-tutorial
 * components once that branch has merged:
 *   step 2 → <MiniTutorialHousehold />
 *   step 3 → <MiniTutorialCalories />
 *   step 4 → <MiniTutorialDiet />
 *   step 5 → <MiniTutorialShopping />
 *   step 6 → <MiniTutorialForbidden />
 *   step 7 → <MiniTutorialTasteSwipe />
 *   step 8 → <MiniTutorialPlanGeneration />
 *   step 9 → <MiniTutorialPlanReveal />
 *   step 10 → <MiniTutorialCsemete />
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar'
import { SkipConfirmModal } from '@/components/onboarding/SkipConfirmModal'
import { PlantingScene, type PlantingStep } from '@/components/onboarding/PlantingScene'
import {
  readOnboardingStep,
  writeOnboardingStep,
  clearOnboardingStep,
} from '@/hooks/useOnboardingProgress'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 10

// ---------------------------------------------------------------------------
// Step-content placeholder — removed once KALMIO-166 ships real components
// ---------------------------------------------------------------------------

interface StepPlaceholderProps {
  step: number
}

function StepPlaceholder({ step }: StepPlaceholderProps) {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center"
      data-testid={`step-placeholder-${step}`}
    >
      <p className="text-sm text-[#6B6460]">
        {/* TODO(KALMIO-166): replace with real step component */}
        {t(`onboarding.shell.stepLabels.${step}`)}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Welcome step (step 1) — always shown first, cannot be skipped
// ---------------------------------------------------------------------------

interface WelcomeStepProps {
  onNext: () => void
}

function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-8 text-center">
      <h1 className="font-headline text-2xl font-bold text-[#1A1A1A] leading-snug">
        {t('onboarding.shell.welcome.title')}
      </h1>
      <p className="text-[#6B6460] text-base max-w-xs leading-relaxed">
        {t('onboarding.shell.welcome.body')}
      </p>
      <button
        type="button"
        onClick={onNext}
        className="mt-2 h-12 w-full max-w-xs rounded-[12px] bg-[#F28C28] px-6 text-base font-semibold text-white transition-colors hover:bg-[#d97a20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
      >
        {t('onboarding.shell.welcome.cta')}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// OnboardingShell
// ---------------------------------------------------------------------------

export function OnboardingShell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  // Resume: read persisted step at mount time.
  // useAuthStore.getState() is synchronous so it is safe to call inside the
  // useState lazy initializer — no setState-in-effect needed.
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const uid = useAuthStore.getState().user?.id
    return uid ? readOnboardingStep(uid) : 1
  })
  const [skipModalOpen, setSkipModalOpen] = useState(false)

  // Persist step on every change.
  useEffect(() => {
    if (userId) {
      writeOnboardingStep(userId, currentStep)
    }
  }, [currentStep, userId])

  const goToStep = useCallback(
    (step: number) => {
      const clamped = Math.min(Math.max(1, step), TOTAL_STEPS)
      setCurrentStep(clamped)
    },
    []
  )

  const goNext = useCallback(() => {
    if (currentStep >= TOTAL_STEPS) {
      // Final step completed — clear progress and navigate to app.
      if (userId) clearOnboardingStep(userId)
      navigate('/app', { replace: true })
      return
    }
    goToStep(currentStep + 1)
  }, [currentStep, goToStep, navigate, userId])

  const handleSkipConfirm = useCallback(() => {
    // Skip: clear persisted progress and go to plan generation / dashboard.
    // The user proceeds with whatever data has been collected so far.
    if (userId) clearOnboardingStep(userId)
    navigate('/app', { replace: true })
  }, [navigate, userId])

  // PlantingScene expects a 0-indexed step (0..10); shell is 1-indexed (1..10).
  const plantingStep = Math.min(currentStep - 1, 10) as PlantingStep

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F9F7F2]"
      data-testid="onboarding-shell"
    >
      {/* ---- Header row: progress bar + skip link ---- */}
      <header className="flex items-center justify-between px-4 pt-4 md:px-8">
        <div className="flex-1">
          <OnboardingProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Skip link: visible from step 2 onward */}
        {currentStep >= 2 && (
          <button
            type="button"
            onClick={() => setSkipModalOpen(true)}
            className="ml-4 shrink-0 text-sm text-[#6B6460] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 rounded"
            aria-label={t('onboarding.shell.skipAriaLabel')}
          >
            {t('onboarding.shell.skip')}
          </button>
        )}
      </header>

      {/* ---- Planting scene (drives visual continuity across all steps) ---- */}
      <div className="px-4 md:px-8 pt-4">
        <PlantingScene step={plantingStep} className="max-w-xs mx-auto" />
      </div>

      {/* ---- Step content area ---- */}
      <main className="flex-1 flex flex-col px-4 md:px-8 pb-8 max-w-lg mx-auto w-full">
        {currentStep === 1 ? (
          <WelcomeStep onNext={goNext} />
        ) : (
          <>
            {/* TODO(KALMIO-166): swap StepPlaceholder for real components */}
            <StepPlaceholder step={currentStep} />

            <div className="mt-auto flex flex-col gap-3 pt-4">
              <button
                type="button"
                onClick={goNext}
                className="h-12 w-full rounded-[12px] bg-[#F28C28] px-6 text-base font-semibold text-white transition-colors hover:bg-[#d97a20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
              >
                {currentStep === TOTAL_STEPS
                  ? t('onboarding.shell.finish')
                  : t('onboarding.shell.next')}
              </button>

              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => goToStep(currentStep - 1)}
                  className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
                >
                  {t('common.back')}
                </button>
              )}
            </div>
          </>
        )}
      </main>

      {/* ---- Skip confirmation modal ---- */}
      <SkipConfirmModal
        open={skipModalOpen}
        onOpenChange={setSkipModalOpen}
        onConfirm={handleSkipConfirm}
      />
    </div>
  )
}
