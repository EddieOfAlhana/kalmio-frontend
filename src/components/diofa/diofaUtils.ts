import type { DiofaMoisture } from './DiofaWidget'
import type { MoistureBand } from '@/types'

/**
 * Maps a DiofaMoisture value to its CSS class name.
 * Kept in a separate file so DiofaWidget.tsx can remain a components-only
 * export (required by the react-refresh/only-export-components lint rule).
 */
export function getMoistureClass(moisture: DiofaMoisture): string {
  switch (moisture) {
    case 'WET': return 'diofa-wet'
    case 'DRY': return 'diofa-dry'
    default:    return 'diofa-ok'
  }
}

// ─── Band colour maps (MoistureHistoryStrip) ─────────────────────────────────
// Kept here so MoistureHistoryStrip.tsx exports only React components.

const BAND_BG: Record<MoistureBand, string> = {
  DRY:       'bg-amber-600',
  DRYING:    'bg-yellow-800',
  MOIST:     'bg-green-600',
  SATURATED: 'bg-green-800',
}

const BAND_RING: Record<MoistureBand, string> = {
  DRY:       'focus-visible:ring-amber-400',
  DRYING:    'focus-visible:ring-yellow-600',
  MOIST:     'focus-visible:ring-green-400',
  SATURATED: 'focus-visible:ring-green-600',
}

/**
 * Returns the full Tailwind class string for a moisture history dot.
 * Pure function — exported for unit testing without DOM.
 */
export function dotClassName(band: MoistureBand, isToday: boolean): string {
  return [
    'h-4 w-4 rounded-full transition-transform',
    BAND_BG[band],
    BAND_RING[band],
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
    isToday ? 'ring-2 ring-offset-1 ring-white scale-125' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
