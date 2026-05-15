/**
 * PlantingPreview — KALMIO-155
 *
 * Dev-only visual preview for <PlantingScene />.
 * Route: /app/_preview/planting  (ProtectedRoute only — not publicly linked)
 *
 * Lets you step through all 11 onboarding steps and verify:
 *  - Animations advance correctly
 *  - Cumulative behaviour (never goes back)
 *  - 375px mobile layout
 *  - 1280px desktop layout
 */

import { useState } from 'react'
import { PlantingScene } from '@/components/onboarding/PlantingScene'
import type { PlantingStep } from '@/components/onboarding/PlantingScene'

const STEP_LABELS: Record<PlantingStep, string> = {
  0:  'Step 0 — Welcome: hand + walnut above soil',
  1:  'Step 1 — Household size: hole dug',
  2:  'Step 2 — Activity + calories: walnut placed',
  3:  'Step 3 — Dietary restrictions: first soil cover',
  4:  'Step 4 — Shopping cadence: mound patted down',
  5:  'Step 5 — Forbidden ingredients: name stake placed',
  6:  'Step 6 — Taste swipe: micro-details appear',
  7:  'Step 7 — Loading plan: watering can tips',
  8:  'Step 8 — Plan reveal: soil dark + moist',
  9:  'Step 9 — Plan accepted: Mag stage glow',
  10: 'Step 10 — First action: Csemete sprout',
}

const TOTAL_STEPS = 11

export function PlantingPreview() {
  const [step, setStep] = useState<PlantingStep>(0)

  const advance = () =>
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1) as PlantingStep)
  const reset = () => setStep(0)

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">
            KALMIO-155 — dev preview
          </p>
          <h1 className="text-xl font-semibold text-stone-800">
            PlantingScene
          </h1>
          <p className="text-sm text-stone-500">
            Placeholder visuals. Final assets: E3.2 / KALMIO-128–129.
          </p>
        </div>

        {/* Step badge */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5">
            Step {step} / {TOTAL_STEPS - 1}
          </span>
          <span className="text-sm text-stone-600">{STEP_LABELS[step]}</span>
        </div>

        {/* Scene */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <PlantingScene step={step} />
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-amber-700 rounded-full transition-all duration-300"
            style={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={advance}
            disabled={step >= TOTAL_STEPS - 1}
            className="flex-1 rounded-lg bg-stone-800 text-white text-sm font-medium py-2.5 px-4 transition-opacity disabled:opacity-40 hover:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-800"
          >
            Következő lépés
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-stone-200 text-stone-600 text-sm font-medium py-2.5 px-4 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400"
          >
            Újra
          </button>
        </div>

        {/* Step grid — click any step directly */}
        <div className="space-y-2">
          <p className="text-xs text-stone-400 uppercase tracking-widest font-mono">
            Jump to step
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {(Array.from({ length: TOTAL_STEPS }, (_, i) => i) as PlantingStep[]).map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                aria-label={STEP_LABELS[s]}
                className={[
                  'rounded text-xs font-mono py-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-500',
                  s === step
                    ? 'bg-amber-700 text-white'
                    : s < step
                    ? 'bg-stone-200 text-stone-500 hover:bg-stone-300'
                    : 'bg-stone-100 text-stone-400 hover:bg-stone-200',
                ].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-400 italic">
            Note: the scene is cumulative — clicking a lower step than the current
            high-water mark will not un-draw earlier layers. Use "Újra" to hard-reset.
          </p>
        </div>

        {/* Asset-swap-in guide */}
        <details className="text-xs text-stone-500 border border-stone-200 rounded-lg p-3 space-y-1 cursor-pointer">
          <summary className="font-medium text-stone-600 mb-1 list-none">
            Asset swap-in guide (for illustrator handoff)
          </summary>
          <p>Each SVG group in PlantingScene.tsx carries a <code>data-asset</code> attribute naming the expected final file under <code>src/assets/diofa/</code>. Replace the placeholder shapes with an <code>&lt;img&gt;</code> or inline SVG import pointing to that path.</p>
          <ul className="mt-2 space-y-0.5 list-disc list-inside">
            <li><code>diofa/soil-bed.svg</code> — SoilBed</li>
            <li><code>diofa/hand-with-walnut.svg</code> — Hand (steps 0–1)</li>
            <li><code>diofa/hole.svg</code> — Hole (step 1)</li>
            <li><code>diofa/walnut-in-hole.svg</code> — WalnutInHole (step 2)</li>
            <li><code>diofa/soil-mound.svg</code> — SoilCover (steps 3–4)</li>
            <li><code>diofa/name-stake.svg</code> — NameStake (step 5)</li>
            <li><code>diofa/swipe-details.svg</code> — SwipeDetails (step 6)</li>
            <li><code>diofa/watering-can.svg</code> — WateringCan (step 7)</li>
            <li><code>diofa/sprout-csemete.svg</code> — Sprout (step 10)</li>
          </ul>
        </details>
      </div>
    </div>
  )
}
