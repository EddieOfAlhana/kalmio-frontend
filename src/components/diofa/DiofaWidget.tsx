/**
 * DiofaWidget — walnut tree (diófa) growth + soil-moisture widget.
 *
 * Props:
 *   stage    — one of MAG | CSEMETE | SUHANG | FIATAL | TERMO
 *   moisture — one of DRY | OK | WET
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ASSET SWAP-IN SPOT
 * ─────────────────────────────────────────────────────────────────────────────
 * All placeholder visuals are defined in the DIOFA_FRAMES lookup at the bottom
 * of this file. Each entry is a React element (inline SVG for now).
 *
 * To swap in real illustrator assets once KALMIO-128 / KALMIO-129 delivers:
 *   1. Add the SVG files to kalmio-frontend/src/assets/diofa/
 *      following the naming convention: diofa-{stage}-{moisture}.svg
 *      e.g. diofa-MAG-DRY.svg, diofa-TERMO-WET.svg
 *   2. Import each file at the top of this module, e.g.:
 *        import MagDrySvg from '@/assets/diofa/diofa-MAG-DRY.svg?react'
 *   3. Replace the placeholder element in DIOFA_FRAMES[stage][moisture] with
 *        <MagDrySvg aria-hidden className="w-full h-full" />
 *   That is all — one replacement per combination (15 total), zero other changes.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Mobile-first target: 360×270 px (scales up on wider screens).
 * WCAG 2.1 AA: aria-label on the outer container; inner SVG paths are aria-hidden.
 * Moisture-band CSS animation classes:
 *   .diofa-wet  → leaf-rustle keyframe (applied when moisture === 'WET')
 *   .diofa-dry  → no animation, soil-crack overlay visible
 */

import { useTranslation } from 'react-i18next'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiofaStage = 'MAG' | 'CSEMETE' | 'SUHANG' | 'FIATAL' | 'TERMO'
export type DiofaMoisture = 'DRY' | 'OK' | 'WET'

export interface DiofaWidgetProps {
  stage: DiofaStage
  moisture: DiofaMoisture
  /** Optional extra class applied to the outer wrapper */
  className?: string
}

// ─── Placeholder visual primitives ───────────────────────────────────────────
// Each helper returns a minimal inline SVG that conveys the growth stage.
// The soil strip at the bottom changes colour per moisture band.
// Replace each function body with a real <StageSvg /> import when assets arrive.

type SoilColor = { fill: string; stroke: string }

const SOIL: Record<DiofaMoisture, SoilColor> = {
  DRY: { fill: '#c9a96e', stroke: '#a07748' },
  OK:  { fill: '#8b6040', stroke: '#6b4423' },
  WET: { fill: '#5a3a1a', stroke: '#3d2008' },
}

/** Shared soil strip drawn at the bottom of every frame */
function SoilStrip({ moisture }: { moisture: DiofaMoisture }) {
  const { fill, stroke } = SOIL[moisture]
  return (
    <g aria-hidden>
      {/* Base soil band */}
      <rect x="0" y="220" width="360" height="50" fill={fill} />
      {/* Soil surface edge */}
      <rect x="0" y="218" width="360" height="4" fill={stroke} />
      {/* Dry cracks — visible only in DRY band */}
      {moisture === 'DRY' && (
        <g stroke="#a07748" strokeWidth="1.5" opacity="0.7">
          <line x1="60"  y1="222" x2="80"  y2="240" />
          <line x1="80"  y1="240" x2="70"  y2="255" />
          <line x1="140" y1="224" x2="155" y2="238" />
          <line x1="220" y1="225" x2="205" y2="245" />
          <line x1="290" y1="222" x2="310" y2="237" />
          <line x1="310" y1="237" x2="305" y2="252" />
        </g>
      )}
      {/* Water drops — visible only in WET band */}
      {moisture === 'WET' && (
        <g fill="#4a90d9" opacity="0.8">
          <ellipse cx="80"  cy="215" rx="3" ry="5" />
          <ellipse cx="160" cy="213" rx="3" ry="5" />
          <ellipse cx="240" cy="216" rx="3" ry="5" />
          <ellipse cx="300" cy="214" rx="3" ry="5" />
        </g>
      )}
    </g>
  )
}

// ─── Stage placeholder drawings ───────────────────────────────────────────────
// Sky/background gradient changes subtly per stage to give visual progression.
// Tree elements grow from a single seed to a full canopy.

const SKY_COLORS: Record<DiofaStage, { top: string; bottom: string }> = {
  MAG:     { top: '#dce8f0', bottom: '#f0e8d0' },
  CSEMETE: { top: '#c8dfe8', bottom: '#e8f0d8' },
  SUHANG:  { top: '#b8d8e0', bottom: '#d8eccc' },
  FIATAL:  { top: '#a8cfdc', bottom: '#cce8c0' },
  TERMO:   { top: '#92c4d8', bottom: '#b8e0b0' },
}

/** MAG — a single seed half-buried in soil */
function MagFrame({ moisture }: { moisture: DiofaMoisture }) {
  const sky = SKY_COLORS.MAG
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="diofa-sky-mag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky.top} />
          <stop offset="100%" stopColor={sky.bottom} />
        </linearGradient>
      </defs>
      <rect width="360" height="270" fill="url(#diofa-sky-mag)" />
      <SoilStrip moisture={moisture} />
      {/* Seed body */}
      <ellipse cx="180" cy="222" rx="14" ry="10" fill="#8b6040" stroke="#5a3a1a" strokeWidth="1.5" />
      {/* Seed seam */}
      <line x1="180" y1="212" x2="180" y2="232" stroke="#5a3a1a" strokeWidth="1" />
    </g>
  )
}

/** CSEMETE — a small sprout with two cotyledon leaves */
function CsemeteFrame({ moisture }: { moisture: DiofaMoisture }) {
  const sky = SKY_COLORS.CSEMETE
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="diofa-sky-csemete" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky.top} />
          <stop offset="100%" stopColor={sky.bottom} />
        </linearGradient>
      </defs>
      <rect width="360" height="270" fill="url(#diofa-sky-csemete)" />
      <SoilStrip moisture={moisture} />
      {/* Stem */}
      <rect x="178" y="175" width="4" height="46" fill="#6b8c3a" rx="2" />
      {/* Left cotyledon */}
      <ellipse cx="166" cy="178" rx="14" ry="8" fill="#7ab34a" transform="rotate(-20 166 178)" />
      {/* Right cotyledon */}
      <ellipse cx="194" cy="178" rx="14" ry="8" fill="#7ab34a" transform="rotate(20 194 178)" />
    </g>
  )
}

/** SUHANG — a sapling with a thin trunk and small rounded crown */
function SuhangFrame({ moisture }: { moisture: DiofaMoisture }) {
  const sky = SKY_COLORS.SUHANG
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="diofa-sky-suhang" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky.top} />
          <stop offset="100%" stopColor={sky.bottom} />
        </linearGradient>
      </defs>
      <rect width="360" height="270" fill="url(#diofa-sky-suhang)" />
      <SoilStrip moisture={moisture} />
      {/* Trunk */}
      <rect x="176" y="140" width="8" height="80" fill="#8b6040" rx="3" />
      {/* Crown */}
      <ellipse cx="180" cy="130" rx="35" ry="28" fill="#5a9632" />
      {/* Crown highlight */}
      <ellipse cx="172" cy="120" rx="18" ry="14" fill="#6ab83c" opacity="0.6" />
    </g>
  )
}

/** FIATAL — a young tree, broader crown, visible branch structure */
function FiatalFrame({ moisture }: { moisture: DiofaMoisture }) {
  const sky = SKY_COLORS.FIATAL
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="diofa-sky-fiatal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky.top} />
          <stop offset="100%" stopColor={sky.bottom} />
        </linearGradient>
      </defs>
      <rect width="360" height="270" fill="url(#diofa-sky-fiatal)" />
      <SoilStrip moisture={moisture} />
      {/* Main trunk */}
      <rect x="173" y="155" width="14" height="65" fill="#7a5030" rx="4" />
      {/* Left branch */}
      <line x1="180" y1="175" x2="140" y2="148" stroke="#7a5030" strokeWidth="6" strokeLinecap="round" />
      {/* Right branch */}
      <line x1="180" y1="175" x2="220" y2="148" stroke="#7a5030" strokeWidth="6" strokeLinecap="round" />
      {/* Main canopy */}
      <ellipse cx="180" cy="110" rx="65" ry="50" fill="#4a8828" />
      {/* Left canopy cluster */}
      <ellipse cx="138" cy="130" rx="30" ry="24" fill="#5a9632" />
      {/* Right canopy cluster */}
      <ellipse cx="222" cy="130" rx="30" ry="24" fill="#5a9632" />
      {/* Top highlight */}
      <ellipse cx="168" cy="96" rx="34" ry="26" fill="#6ab83c" opacity="0.5" />
    </g>
  )
}

/** TERMO — a full bearing walnut tree with visible walnuts */
function TermoFrame({ moisture }: { moisture: DiofaMoisture }) {
  const sky = SKY_COLORS.TERMO
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="diofa-sky-termo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky.top} />
          <stop offset="100%" stopColor={sky.bottom} />
        </linearGradient>
      </defs>
      <rect width="360" height="270" fill="url(#diofa-sky-termo)" />
      <SoilStrip moisture={moisture} />
      {/* Trunk — thicker and textured */}
      <rect x="168" y="150" width="24" height="72" fill="#6b4020" rx="6" />
      {/* Bark texture */}
      <line x1="174" y1="155" x2="172" y2="218" stroke="#4a2c10" strokeWidth="1.5" opacity="0.5" />
      <line x1="183" y1="155" x2="185" y2="218" stroke="#4a2c10" strokeWidth="1.5" opacity="0.5" />
      {/* Main branches */}
      <line x1="180" y1="170" x2="118" y2="138" stroke="#6b4020" strokeWidth="8" strokeLinecap="round" />
      <line x1="180" y1="170" x2="242" y2="138" stroke="#6b4020" strokeWidth="8" strokeLinecap="round" />
      <line x1="180" y1="158" x2="180" y2="118" stroke="#6b4020" strokeWidth="7" strokeLinecap="round" />
      {/* Full canopy — deep layered green */}
      <ellipse cx="180" cy="95"  rx="90" ry="65" fill="#3a7820" />
      <ellipse cx="120" cy="120" rx="40" ry="32" fill="#4a8828" />
      <ellipse cx="240" cy="120" rx="40" ry="32" fill="#4a8828" />
      <ellipse cx="180" cy="75"  rx="60" ry="42" fill="#4a8828" />
      {/* Canopy highlights */}
      <ellipse cx="158" cy="82"  rx="38" ry="28" fill="#5ea030" opacity="0.55" />
      <ellipse cx="205" cy="100" rx="28" ry="22" fill="#5ea030" opacity="0.45" />
      {/* Walnut fruits — small olive-green rounds */}
      <circle cx="148" cy="118" r="7" fill="#6b8c40" stroke="#4a6820" strokeWidth="1" />
      <circle cx="165" cy="110" r="7" fill="#6b8c40" stroke="#4a6820" strokeWidth="1" />
      <circle cx="196" cy="112" r="7" fill="#6b8c40" stroke="#4a6820" strokeWidth="1" />
      <circle cx="215" cy="122" r="7" fill="#6b8c40" stroke="#4a6820" strokeWidth="1" />
      <circle cx="180" cy="104" r="7" fill="#6b8c40" stroke="#4a6820" strokeWidth="1" />
    </g>
  )
}

// ─── DIOFA_FRAMES lookup ──────────────────────────────────────────────────────
// *** THIS IS THE ASSET SWAP-IN SLOT ***
// Structure: DIOFA_FRAMES[stage][moisture] → React element
// When real SVG assets arrive (KALMIO-128/129), replace each value with:
//   <RealAssetComponent aria-hidden className="w-full h-full" />
// Nothing else in this file needs to change.

type FrameMap = Record<DiofaStage, Record<DiofaMoisture, React.ReactElement>>

const DIOFA_FRAMES: FrameMap = {
  MAG: {
    DRY: <MagFrame moisture="DRY" />,
    OK:  <MagFrame moisture="OK" />,
    WET: <MagFrame moisture="WET" />,
  },
  CSEMETE: {
    DRY: <CsemeteFrame moisture="DRY" />,
    OK:  <CsemeteFrame moisture="OK" />,
    WET: <CsemeteFrame moisture="WET" />,
  },
  SUHANG: {
    DRY: <SuhangFrame moisture="DRY" />,
    OK:  <SuhangFrame moisture="OK" />,
    WET: <SuhangFrame moisture="WET" />,
  },
  FIATAL: {
    DRY: <FiatalFrame moisture="DRY" />,
    OK:  <FiatalFrame moisture="OK" />,
    WET: <FiatalFrame moisture="WET" />,
  },
  TERMO: {
    DRY: <TermoFrame moisture="DRY" />,
    OK:  <TermoFrame moisture="OK" />,
    WET: <TermoFrame moisture="WET" />,
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiofaWidget({ stage, moisture, className = '' }: DiofaWidgetProps) {
  const { t } = useTranslation()

  const ariaLabel = t('diofa.ariaLabel', {
    stage: t(`diofa.stages.${stage}`),
    moisture: t(`diofa.moisture.${moisture}`),
  })

  // Moisture-band CSS class drives CSS animations (leaf rustle, etc.)
  // Defined in kalmio-frontend/src/styles/diofa.css (see KALMIO-130 comment there)
  const moistureClass =
    moisture === 'WET' ? 'diofa-wet' :
    moisture === 'DRY' ? 'diofa-dry' :
    'diofa-ok'

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={[
        'relative w-full max-w-[360px] mx-auto overflow-hidden rounded-xl',
        moistureClass,
        className,
      ].join(' ')}
      style={{ aspectRatio: '360 / 270' }}
    >
      <svg
        viewBox="0 0 360 270"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-hidden
      >
        {DIOFA_FRAMES[stage][moisture]}
      </svg>

      {/* Stage + moisture badge — for development visibility; hide in production if desired */}
      <span
        aria-hidden
        className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/30 text-white px-1.5 py-0.5 rounded"
      >
        {stage} · {moisture}
      </span>
    </div>
  )
}
