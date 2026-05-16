/**
 * TeachOnReturnHint
 *
 * Renders a single contextual line alongside the diófa section when the user
 * returns after a gap of more than one calendar day.
 *
 * Behaviour:
 * - Shown at most once per browser session (sessionStorage flag).
 * - Dismissed by the × button.
 * - No emoji, no exclamation marks — tone per ADR-007 / gamification-progression §7.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EngagementGapBucket } from '@/hooks/useEngagementGap'

const SESSION_KEY = 'kalmio_teach_dismissed'

interface TeachOnReturnHintProps {
  bucket: EngagementGapBucket
}

/** Read sessionStorage synchronously; return false when storage is unavailable. */
function isAlreadyDismissed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return true // if storage is unavailable, suppress the hint
  }
}

function markDismissed(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // best-effort
  }
}

export function TeachOnReturnHint({ bucket }: TeachOnReturnHintProps) {
  const { t } = useTranslation()

  // Compute initial visibility synchronously at render time — avoids a
  // setState-inside-useEffect lint violation while still reading sessionStorage
  // correctly (sessionStorage is always synchronous).
  //
  // markDismissed() is called here, inside the initialiser, so that the flag
  // is written on the very first mount. Any subsequent mount of this component
  // in the same browser session (e.g. SPA route change) will then find
  // isAlreadyDismissed() === true and initialise visible as false — preventing
  // the hint from re-appearing without a user × click.
  const [visible, setVisible] = useState<boolean>(() => {
    if (bucket === 'none' || isAlreadyDismissed()) return false
    markDismissed()
    return true
  })

  if (!visible || bucket === 'none') return null

  function dismiss() {
    markDismissed()
    setVisible(false)
  }

  const copyKey = `teachOnReturn.${bucket}` as const

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900"
    >
      <p className="flex-1 leading-snug">{t(copyKey)}</p>
      <button
        type="button"
        aria-label={t('teachOnReturn.dismiss')}
        onClick={dismiss}
        className="shrink-0 mt-0.5 text-amber-700 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 4L12 12M12 4L4 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
