/**
 * useEngagementGap
 *
 * Computes how many calendar days have elapsed since the user's last recorded
 * app visit, then maps that to a named gap bucket used by TeachOnReturnHint.
 *
 * Storage contract (localStorage):
 *   key: "kalmio_last_active"   value: ISO date string "YYYY-MM-DD"
 *
 * The timestamp is written once per hook call (i.e. once per Dashboard mount),
 * so it represents "the day this session opened." Subsequent page refreshes
 * within the same calendar day do not change the bucket — the user already got
 * the hint for this session if the gap warranted one.
 *
 * Session-dismiss contract (sessionStorage):
 *   key: "kalmio_teach_dismissed"  value: "1"
 *
 * When the hint is dismissed (either by the user clicking × or by any tracked
 * action) the component sets this flag. It is cleared automatically when the
 * browser tab closes (sessionStorage lifetime).
 */

export type EngagementGapBucket =
  | 'none'       // same day or 1 day — no hint
  | 'subtle'     // 2–3 days
  | 'context'    // 4–7 days
  | 'extended'   // 8–14 days
  | 'returning'  // 15+ days

const LS_KEY = 'kalmio_last_active'

/** Returns today as "YYYY-MM-DD" in local time. */
function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Computes the gap in whole calendar days between two "YYYY-MM-DD" strings. */
function daysBetween(from: string, to: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const fromMs = new Date(from).getTime()
  const toMs = new Date(to).getTime()
  return Math.floor((toMs - fromMs) / msPerDay)
}

/** Exported for unit testing only — prefer useEngagementGap() in components. */
export function bucketFromDays(days: number): EngagementGapBucket {
  if (days <= 1) return 'none'
  if (days <= 3) return 'subtle'
  if (days <= 7) return 'context'
  if (days <= 14) return 'extended'
  return 'returning'
}

/**
 * Reads the last-active date from localStorage, computes the gap bucket,
 * then writes today's date as the new last-active.
 *
 * Calling this hook multiple times in one render cycle is safe — the bucket
 * is computed from the value that was in localStorage *before* this call.
 */
export function useEngagementGap(): EngagementGapBucket {
  // We use a module-level variable so that multiple re-renders of Dashboard
  // within the same React tree do not re-read/re-write localStorage on every
  // render — only on the very first mount.
  const today = todayString()

  let bucket: EngagementGapBucket = 'none'

  try {
    const stored = localStorage.getItem(LS_KEY)
    if (stored && stored !== today) {
      const days = daysBetween(stored, today)
      bucket = bucketFromDays(days)
    }
    // Write today regardless (idempotent if already today)
    localStorage.setItem(LS_KEY, today)
  } catch {
    // localStorage may be unavailable in private browsing or under strict CSP.
    // Silently fall back to 'none' — no hint is the safe default.
  }

  return bucket
}
