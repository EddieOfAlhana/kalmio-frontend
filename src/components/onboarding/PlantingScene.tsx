/**
 * PlantingScene — KALMIO-155
 *
 * Animated walnut-planting scene that advances step by step across onboarding
 * screens (steps 0–10, driven by the `step` prop). Progress is cumulative: each
 * advance animates *in* and stays visible, so the scene builds up as the user
 * moves through the questionnaire.
 *
 * Placeholder strategy
 * --------------------
 * All visuals are inline SVG shapes styled to evoke the scene without final
 * assets. The component is structured so that each <SceneLayer> can be swapped
 * for the illustrator's PNG/SVG export (E3.2, KALMIO-128/129) by replacing the
 * `placeholder` branch with an <img> referencing `src/assets/diofa/`. The
 * `data-asset` attribute on each layer names the expected final asset file.
 *
 * Step → scene mapping (from gamification-progression.md §4.1):
 *   0  Welcome screen        → Hand visible above soil, holding the walnut
 *   1  Household size        → A hole is dug; the hand lowers
 *   2  Activity + calories   → The walnut is placed in the hole
 *   3  Dietary restrictions  → First handful of soil covers the walnut
 *   4  Shopping cadence      → Soil mound formed and patted down
 *   5  Forbidden ingredients → A small wooden name stake placed
 *   6  Taste swipe (each)    → Swipe micro-step — stone/leaf/soil moistens
 *   7  Loading: plan gen     → Watering can tips; first drops fall
 *   8  First plan reveal     → Soil is dark and moist; seed fully planted
 *   9  User accepts plan     → Mag stage complete; transition queued
 *  10  First action          → Sprout — Csemete: two cotyledon leaves above ground
 *
 * Usage:
 *   <PlantingScene step={onboardingStep} className="..." />
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, type Easing } from 'framer-motion'
import { useTranslation } from 'react-i18next'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlantingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

interface PlantingSceneProps {
  /** Current onboarding step (0..10). Prop should only ever increase. */
  step: PlantingStep
  className?: string
  /** Reduced-motion: caller may set this to suppress motion animations.
   *  If omitted the component respects prefers-reduced-motion via CSS. */
  reducedMotion?: boolean
}

// ---------------------------------------------------------------------------
// Animation variants — shared spring config
// ---------------------------------------------------------------------------

const SPRING = { type: 'spring', stiffness: 220, damping: 22 } as const

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
}

const EASE_OUT: Easing = 'easeOut'

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: { ...SPRING } },
}

const dropIn = {
  hidden: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING, delay: 0.1 } },
}

// ---------------------------------------------------------------------------
// Colour palette — placeholder visuals, evokes the gamification-progression.md
// §10.1 style direction (warm earthy tones, not flat vector).
// ---------------------------------------------------------------------------

const COLORS = {
  soilDark: '#5C3D1E',   // moist, rich
  soilMid:  '#7A5230',   // normal soil
  soilPale: '#B89060',   // drying soil surface
  walnut:   '#3B2507',   // dark walnut shell
  hand:     '#C68642',   // warm skin tone (placeholder)
  stake:    '#8B5E3C',   // wooden stake
  waterBlue:'#7BB3D3',   // watering-drop
  leafGreen:'#5A7A3A',   // first cotyledon leaves
  stonGrey: '#9E9189',   // small stones
  moundBorder: '#4A2E10',
} as const

// ---------------------------------------------------------------------------
// Sub-components — each represents one scene element that appears at a step
// ---------------------------------------------------------------------------

/** The soil bed — always visible, gets darker/moister as step advances */
function SoilBed({ step }: { step: PlantingStep }) {
  // Soil darkens progressively from step 3 onward — blend soilMid → soilDark
  const moisture = Math.min(1, Math.max(0, (step - 2) / 6))
  const soilColor = step < 3
    ? COLORS.soilMid
    : `rgb(${Math.round(122 - (moisture * 30))}, ${Math.round(82 - (moisture * 20))}, ${Math.round(48 - (moisture * 18))})`

  return (
    <motion.rect
      x="0" y="160" width="360" height="80"
      rx="4"
      fill={soilColor}
      animate={{ fill: soilColor }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      data-asset="diofa/soil-bed.svg"
      aria-hidden="true"
    />
  )
}

/** Hand holding the walnut — visible at step 0, lowers at step 1, exits at step 2 */
function Hand({ step }: { step: PlantingStep }) {
  const y = step === 0 ? 80 : step === 1 ? 120 : 160
  const opacity = step >= 2 ? 0 : 1

  return (
    <motion.g
      animate={{ y, opacity }}
      transition={{ ...SPRING }}
      data-asset="diofa/hand-with-walnut.svg"
      aria-hidden="true"
    >
      {/* Simplified hand silhouette */}
      <ellipse cx="180" cy="0" rx="18" ry="28" fill={COLORS.hand} />
      {/* Fingers suggestion */}
      <rect x="168" y="-28" width="6" height="18" rx="3" fill={COLORS.hand} />
      <rect x="176" y="-30" width="6" height="20" rx="3" fill={COLORS.hand} />
      <rect x="184" y="-28" width="6" height="18" rx="3" fill={COLORS.hand} />
      {/* Walnut held in palm */}
      <ellipse cx="180" cy="16" rx="10" ry="8" fill={COLORS.walnut} />
      <path d="M172 16 Q180 10 188 16 Q180 22 172 16Z" fill="#5C3D1E" opacity="0.4" />
    </motion.g>
  )
}

/** Hole dug in soil — appears at step 1 */
function Hole({ step }: { step: PlantingStep }) {
  if (step < 1) return null
  return (
    <motion.g
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      data-asset="diofa/hole.svg"
      aria-hidden="true"
    >
      <ellipse cx="180" cy="168" rx="22" ry="10" fill="#3A2210" />
      <ellipse cx="180" cy="168" rx="16" ry="7" fill="#2A1808" />
    </motion.g>
  )
}

/** Walnut placed in hole — appears at step 2, buried at step 3 */
function WalnutInHole({ step }: { step: PlantingStep }) {
  if (step < 2) return null
  const buried = step >= 3
  return (
    <AnimatePresence>
      {!buried && (
        <motion.g
          key="walnut-visible"
          variants={dropIn}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          data-asset="diofa/walnut-in-hole.svg"
          aria-hidden="true"
        >
          <ellipse cx="180" cy="170" rx="14" ry="10" fill={COLORS.walnut} />
          <path d="M168 170 Q180 163 192 170 Q180 177 168 170Z" fill="#5C3D1E" opacity="0.5" />
        </motion.g>
      )}
    </AnimatePresence>
  )
}

/** Soil cover forming over the walnut — step 3 onward */
function SoilCover({ step }: { step: PlantingStep }) {
  if (step < 3) return null
  const fullyPatted = step >= 4
  return (
    <motion.g
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      data-asset="diofa/soil-mound.svg"
      aria-hidden="true"
    >
      {/* Mound shape */}
      <motion.ellipse
        cx="180" cy="165"
        rx={fullyPatted ? 36 : 24}
        ry={fullyPatted ? 14 : 9}
        fill={COLORS.soilDark}
        animate={{ rx: fullyPatted ? 36 : 24, ry: fullyPatted ? 14 : 9 }}
        transition={{ ...SPRING }}
      />
      {/* Surface texture suggestion — two lighter curved strokes */}
      <path
        d="M158 163 Q180 158 202 163"
        stroke="#7A5230" strokeWidth="1.5" fill="none" opacity="0.6"
      />
      <path
        d="M164 167 Q180 163 196 167"
        stroke="#8B6040" strokeWidth="1" fill="none" opacity="0.4"
      />
    </motion.g>
  )
}

/** Wooden name stake — appears at step 5 */
function NameStake({ step }: { step: PlantingStep }) {
  if (step < 5) return null
  return (
    <motion.g
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      data-asset="diofa/name-stake.svg"
      aria-hidden="true"
    >
      {/* Stake post */}
      <rect x="213" y="140" width="5" height="30" rx="1" fill={COLORS.stake} />
      {/* Small tag */}
      <rect x="207" y="136" width="17" height="11" rx="2" fill={COLORS.stake} />
      <rect x="208" y="137" width="15" height="9" rx="1" fill="#C49A6C" />
      {/* Decorative lines on tag */}
      <line x1="210" y1="140" x2="221" y2="140" stroke={COLORS.stake} strokeWidth="0.8" opacity="0.6" />
      <line x1="210" y1="143" x2="219" y2="143" stroke={COLORS.stake} strokeWidth="0.8" opacity="0.5" />
    </motion.g>
  )
}

/** Small stones and fallen leaf — appear incrementally during taste swipe (step 6) */
function SwipeDetails({ step }: { step: PlantingStep }) {
  if (step < 6) return null
  return (
    <motion.g
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      data-asset="diofa/swipe-details.svg"
      aria-hidden="true"
    >
      {/* Stone 1 */}
      <ellipse cx="148" cy="168" rx="5" ry="3.5" fill={COLORS.stonGrey} />
      {/* Stone 2 */}
      <ellipse cx="138" cy="172" rx="4" ry="3" fill="#B0A090" />
      {/* Small fallen leaf silhouette */}
      <path
        d="M222 162 Q228 155 236 160 Q230 166 222 162Z"
        fill={COLORS.leafGreen} opacity="0.7"
      />
      {/* Moisture spots on soil surface */}
      <circle cx="160" cy="160" r="2" fill="#4A2E10" opacity="0.5" />
      <circle cx="200" cy="162" r="1.5" fill="#4A2E10" opacity="0.4" />
    </motion.g>
  )
}

/** Watering can + falling drops — step 7 (plan generation loading) */
function WateringCan({ step }: { step: PlantingStep }) {
  if (step < 7) return null
  return (
    <motion.g
      variants={dropIn}
      initial="hidden"
      animate="visible"
      data-asset="diofa/watering-can.svg"
      aria-hidden="true"
    >
      {/* Can body */}
      <rect x="100" y="100" width="40" height="28" rx="5" fill="#8090A0" />
      {/* Spout */}
      <path d="M140 110 L162 130" stroke="#8090A0" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Handle */}
      <path d="M100 105 Q85 114 100 122" stroke="#8090A0" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Drops falling from spout tip — staggered animation */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={168 + i * 4}
          cy={136 + i * 8}
          r="2.5"
          fill={COLORS.waterBlue}
          animate={{ y: [0, 8, 0], opacity: [0.9, 0.5, 0.9] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.g>
  )
}

/** Dark moist glow on soil — step 8 (plan reveal, seed fully planted) */
function MoistGlow({ step }: { step: PlantingStep }) {
  if (step < 8) return null
  return (
    <motion.g
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      aria-hidden="true"
    >
      {/* Subtle radial darkening to show deep moisture */}
      <radialGradient id="moist-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3A2210" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#3A2210" stopOpacity="0" />
      </radialGradient>
      <ellipse cx="180" cy="168" rx="60" ry="18" fill="url(#moist-glow)" />
    </motion.g>
  )
}

/** Mag-complete subtle glow ring — step 9 (user accepts plan) */
function MagGlow({ step }: { step: PlantingStep }) {
  if (step < 9) return null
  return (
    <motion.g
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      aria-hidden="true"
    >
      <motion.ellipse
        cx="180" cy="167" rx="44" ry="15"
        fill="none"
        stroke="#8B6040"
        strokeWidth="1.5"
        opacity={0.5}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.g>
  )
}

/** Csemete sprout — two cotyledon leaves, appears at step 10 */
function Sprout({ step }: { step: PlantingStep }) {
  if (step < 10) return null
  return (
    <motion.g
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      data-asset="diofa/sprout-csemete.svg"
      aria-hidden="true"
    >
      {/* Stem */}
      <motion.line
        x1="180" y1="163"
        x2="180" y2="135"
        stroke="#5A7A3A"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      {/* Left cotyledon leaf */}
      <motion.path
        d="M180 142 Q165 132 160 142 Q168 150 180 142Z"
        fill={COLORS.leafGreen}
        initial={{ scale: 0, originX: '180px', originY: '142px' }}
        animate={{ scale: 1 }}
        transition={{ ...SPRING, delay: 0.5 }}
      />
      {/* Right cotyledon leaf */}
      <motion.path
        d="M180 142 Q195 132 200 142 Q192 150 180 142Z"
        fill={COLORS.leafGreen}
        initial={{ scale: 0, originX: '180px', originY: '142px' }}
        animate={{ scale: 1 }}
        transition={{ ...SPRING, delay: 0.7 }}
      />
      {/* Tiny growing tip */}
      <motion.circle
        cx="180" cy="133"
        r="3"
        fill="#7AA050"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...SPRING, delay: 0.9 }}
      />
    </motion.g>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PlantingScene({ step, className = '', reducedMotion }: PlantingSceneProps) {
  const { t } = useTranslation()

  // Track the highest step ever rendered so we never animate backwards.
  // Stored in state (not a ref) so it is safe to read during render.
  const [highWaterMark, setHighWaterMark] = useState<PlantingStep>(step)
  // Ref mirrors the state value so the effect closure never goes stale.
  const highWaterRef = useRef<PlantingStep>(step)
  useEffect(() => {
    if (step > highWaterRef.current) {
      highWaterRef.current = step
      setHighWaterMark(step)
    }
  }, [step])

  // The "effective" step for rendering is always the max seen so far
  const effectiveStep = Math.max(step, highWaterMark) as PlantingStep

  const stepKey = String(effectiveStep) as keyof typeof stepDescriptions
  const stepDescriptions = {
    '0': t('onboarding.planting.steps.0'),
    '1': t('onboarding.planting.steps.1'),
    '2': t('onboarding.planting.steps.2'),
    '3': t('onboarding.planting.steps.3'),
    '4': t('onboarding.planting.steps.4'),
    '5': t('onboarding.planting.steps.5'),
    '6': t('onboarding.planting.steps.6'),
    '7': t('onboarding.planting.steps.7'),
    '8': t('onboarding.planting.steps.8'),
    '9': t('onboarding.planting.steps.9'),
    '10': t('onboarding.planting.steps.10'),
  }

  return (
    <div
      className={`relative w-full max-w-sm mx-auto select-none ${className}`}
      role="img"
      aria-label={t('onboarding.planting.ariaLabel')}
      aria-description={stepDescriptions[stepKey]}
      data-testid="planting-scene"
      data-step={effectiveStep}
      // Honour prefers-reduced-motion via Tailwind media class; framer-motion
      // also internally detects this when reducedMotion is not forced.
      style={reducedMotion ? { '--framer-motion-reduced-motion': '1' } as React.CSSProperties : undefined}
    >
      {/*
        Viewbox 360×240 — landscape aspect for mobile (375px wide at full width → ~250px height).
        The soil horizon sits at y=160 leaving ~160px of sky above for the hand / watering can.
      */}
      <svg
        viewBox="0 0 360 240"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        aria-hidden="true"
        focusable="false"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Sky gradient — warm cream, not clinical white */}
          <linearGradient id="sky-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5EDD8" />
            <stop offset="100%" stopColor="#EDE0C4" />
          </linearGradient>
        </defs>

        {/* Sky background */}
        <rect x="0" y="0" width="360" height="240" fill="url(#sky-gradient)" />

        {/* ---- SCENE LAYERS (bottom up in z-order) ---- */}

        {/* Soil bed — always present, moistens over time */}
        <SoilBed step={effectiveStep} />

        {/* Hole — dug at step 1 */}
        <Hole step={effectiveStep} />

        {/* Walnut visible in hole — step 2, hidden at step 3 */}
        <WalnutInHole step={effectiveStep} />

        {/* Soil cover + mound — step 3 onward */}
        <SoilCover step={effectiveStep} />

        {/* Swipe-stage micro-details — step 6 */}
        <SwipeDetails step={effectiveStep} />

        {/* Moist glow — step 8 */}
        <MoistGlow step={effectiveStep} />

        {/* Mag stage ring — step 9 */}
        <MagGlow step={effectiveStep} />

        {/* Sprout (Csemete) — step 10 */}
        <Sprout step={effectiveStep} />

        {/* Wooden stake — step 5 */}
        <NameStake step={effectiveStep} />

        {/* Watering can — step 7 */}
        <WateringCan step={effectiveStep} />

        {/* Hand holding walnut — steps 0–1, exits at step 2 */}
        <Hand step={effectiveStep} />
      </svg>

      {/* Screen-reader only step description — updated as scene advances */}
      <span className="sr-only" aria-live="polite">
        {stepDescriptions[stepKey]}
      </span>
    </div>
  )
}
