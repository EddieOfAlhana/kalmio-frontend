/**
 * OnboardingProgressBar — KALMIO-167
 *
 * Ten-dot progress indicator shown at the top of the onboarding shell.
 * Dots are subtle: filled (active/completed) vs. outline (upcoming).
 * No numerical labels — visual only, with an sr-only aria description.
 *
 * Design notes:
 *   - Rendered as a flex row of 10 small circles.
 *   - Active dot and all completed dots fill with the accent orange.
 *   - Upcoming dots are outlined in muted stone.
 *   - Touch target meets 44x44px minimum via padding on the container.
 */

import { useTranslation } from 'react-i18next'

interface OnboardingProgressBarProps {
  /** 1-indexed current step (1..TOTAL_STEPS) */
  currentStep: number
  totalSteps: number
}

export function OnboardingProgressBar({ currentStep, totalSteps }: OnboardingProgressBarProps) {
  const { t } = useTranslation()

  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={currentStep}
      aria-label={t('onboarding.shell.progressAriaLabel', { current: currentStep, total: totalSteps })}
      className="flex items-center justify-center gap-2 py-3"
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <span
            key={stepNumber}
            aria-hidden="true"
            className={[
              'block rounded-full transition-all duration-300',
              isCurrent
                ? 'w-3 h-3 bg-[#F28C28]'
                : isCompleted
                ? 'w-2.5 h-2.5 bg-[#F28C28] opacity-60'
                : 'w-2 h-2 border border-[#B0A090] bg-transparent',
            ].join(' ')}
          />
        )
      })}

      {/* Screen-reader-only text for explicit step announcement */}
      <span className="sr-only">
        {t('onboarding.shell.progressSrText', { current: currentStep, total: totalSteps })}
      </span>
    </div>
  )
}
