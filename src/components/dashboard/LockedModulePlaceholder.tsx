import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DashboardModuleId } from '@/types'
import { MODULE_UNLOCK_STAGE } from '@/lib/dashboardVisibility'

interface LockedModulePlaceholderProps {
  moduleId: DashboardModuleId
}

/**
 * Anticipatory empty-state for a dashboard module the user has not yet unlocked.
 * Shows the module title (faded), a lock icon, and a one-line hint about what
 * triggers the unlock. No paywall language — this is anticipation, not gatekeeping.
 *
 * Spec: gamification-stories.md §E2.3 / gamification-progression.md §5.
 */
export function LockedModulePlaceholder({ moduleId }: LockedModulePlaceholderProps) {
  const { t } = useTranslation()

  const unlockStage = MODULE_UNLOCK_STAGE[moduleId]

  // If the module has no known unlock stage we render nothing — it should always
  // be visible or is handled elsewhere.
  if (!unlockStage) return null

  const stageLabel = t(`diofa.stages.${unlockStage}`)
  const moduleTitle = t(`dashboard.lockedModule.titles.${moduleId}`, {
    defaultValue: moduleId,
  })
  const moduleDesc = t(`dashboard.lockedModule.descriptions.${moduleId}`, {
    defaultValue: '',
  })

  return (
    <div
      className="mx-4 mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-6"
      aria-label={t('dashboard.lockedModule.ariaLabel', { module: moduleTitle })}
    >
      <div className="flex items-start gap-3">
        <Lock
          className="mt-0.5 shrink-0 text-neutral-300"
          size={18}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-400">{moduleTitle}</p>
          {moduleDesc && (
            <p className="mt-1 text-sm text-neutral-400">{moduleDesc}</p>
          )}
          <p className="mt-2 text-xs text-neutral-400">
            {t('dashboard.lockedModule.unlockAtStage', { stage: stageLabel })}
          </p>
        </div>
      </div>
    </div>
  )
}
