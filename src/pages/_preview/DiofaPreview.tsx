/**
 * DiofaPreview — KALMIO-130 / KALMIO-134
 *
 * Dev-only visual preview for <DiofaWidget />.
 * Route: /app/_preview/diofa  (ProtectedRoute only — not publicly linked)
 *
 * Renders all 15 stage×moisture combinations (5 stages × 3 moisture bands)
 * in a single scrollable grid so placeholder visuals can be verified
 * without Storybook.
 *
 * KALMIO-134 addition: an "Animáció demo" section at the top renders a single
 * widget whose moisture cycles automatically (DRY → OK → WET → DRY …) so
 * reviewers can evaluate the leaf-rustle, drop-fall, and crack-pulse animations
 * without manual interaction.
 *
 * Satisfies the "visual verification" AC from KALMIO-130 (AC narrowed from
 * Storybook requirement — see Jira comment on ticket).
 *
 * When real SVG assets arrive (KALMIO-128/129):
 *   Replace placeholder frames in DiofaWidget.tsx per the ASSET SWAP-IN SPOT
 *   comment in that file. This preview page requires no further changes.
 */

import { useState, useEffect } from 'react'
import { DiofaWidget } from '@/components/diofa/DiofaWidget'
import type { DiofaStage, DiofaMoisture } from '@/components/diofa/DiofaWidget'

const STAGES: DiofaStage[] = ['MAG', 'CSEMETE', 'SUHANG', 'FIATAL', 'TERMO']
const MOISTURES: DiofaMoisture[] = ['DRY', 'OK', 'WET']

const STAGE_LABELS: Record<DiofaStage, string> = {
  MAG:     'MAG — csíra, elvetett dió',
  CSEMETE: 'CSEMETE — kétszikleveles hajtás',
  SUHANG:  'SUHANG — fiatal cserjés',
  FIATAL:  'FIATAL — törzsös, koronás fa',
  TERMO:   'TERMO — termő diófa',
}

const MOISTURE_LABELS: Record<DiofaMoisture, string> = {
  DRY: 'DRY — száraz talaj, repedések',
  OK:  'OK — megfelelő nedvesség',
  WET: 'WET — nedves, vízcseppek',
}

const MOISTURE_BADGE_CLASSES: Record<DiofaMoisture, string> = {
  DRY: 'bg-amber-100 text-amber-800',
  OK:  'bg-green-100 text-green-800',
  WET: 'bg-blue-100 text-blue-800',
}

const MOISTURE_CYCLE: DiofaMoisture[] = ['DRY', 'OK', 'WET']
const CYCLE_DURATION_MS = 3000

export function DiofaPreview() {
  const [highlightStage, setHighlightStage] = useState<DiofaStage | 'ALL'>('ALL')
  const [highlightMoisture, setHighlightMoisture] = useState<DiofaMoisture | 'ALL'>('ALL')

  // Animation demo — cycles through DRY → OK → WET automatically
  const [demoStage, setDemoStage] = useState<DiofaStage>('TERMO')
  const [demoMoistureIdx, setDemoMoistureIdx] = useState(0)
  const [demoPaused, setDemoPaused] = useState(false)

  useEffect(() => {
    if (demoPaused) return
    const id = setInterval(() => {
      setDemoMoistureIdx((prev) => (prev + 1) % MOISTURE_CYCLE.length)
    }, CYCLE_DURATION_MS)
    return () => clearInterval(id)
  }, [demoPaused])

  const visibleStages = highlightStage === 'ALL' ? STAGES : [highlightStage]
  const visibleMoistures = highlightMoisture === 'ALL' ? MOISTURES : [highlightMoisture]

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">
            KALMIO-130 / KALMIO-134 — dev preview
          </p>
          <h1 className="text-xl font-semibold text-stone-800">
            DiofaWidget — 15 stage×moisture kombináció
          </h1>
          <p className="text-sm text-stone-500">
            Placeholder vizuálok. Végleges illusztrációk: KALMIO-128 / KALMIO-129.
          </p>
        </div>

        {/* Animation demo — KALMIO-134 */}
        <section
          className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-4"
          aria-label="Animáció demo"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs font-mono text-blue-400 uppercase tracking-widest">
                KALMIO-134 — animáció demo
              </p>
              <p className="text-sm font-medium text-stone-700">
                Nedvességszint automatikus váltás
              </p>
              <p className="text-xs text-stone-500">
                DRY → OK → WET ciklus {CYCLE_DURATION_MS / 1000}s-enként.
                Leaf-rustle (WET), drop-fall (WET), crack-pulse (DRY).
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <button
                onClick={() => setDemoPaused((p) => !p)}
                className="text-xs font-mono rounded bg-white border border-stone-200 px-3 py-1 text-stone-600 hover:bg-stone-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-400"
              >
                {demoPaused ? 'Folytatás' : 'Szünet'}
              </button>
              <span className={[
                'inline-flex items-center rounded-full text-xs font-medium px-2.5 py-0.5',
                MOISTURE_BADGE_CLASSES[MOISTURE_CYCLE[demoMoistureIdx]],
              ].join(' ')}>
                {MOISTURE_CYCLE[demoMoistureIdx]}
              </span>
            </div>
          </div>

          {/* Stage picker for the demo widget */}
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => setDemoStage(s)}
                className={[
                  'rounded text-xs font-mono py-1 px-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-500',
                  demoStage === s
                    ? 'bg-amber-700 text-white'
                    : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50',
                ].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="max-w-[360px]">
            <DiofaWidget stage={demoStage} moisture={MOISTURE_CYCLE[demoMoistureIdx]} />
          </div>

          <p className="text-[11px] text-stone-400 font-mono">
            prefers-reduced-motion: animáció le van tiltva, ha a felhasználó OS-szinten kérte.
          </p>
        </section>

        {/* Filter controls */}
        <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-400 uppercase tracking-widest font-mono">Szűrő</p>

          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-600">Fejlődési fázis</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setHighlightStage('ALL')}
                className={[
                  'rounded text-xs font-mono py-1 px-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-500',
                  highlightStage === 'ALL'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200',
                ].join(' ')}
              >
                MIND
              </button>
              {STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => setHighlightStage(s)}
                  className={[
                    'rounded text-xs font-mono py-1 px-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-500',
                    highlightStage === s
                      ? 'bg-amber-700 text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200',
                  ].join(' ')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-600">Nedvességszint</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setHighlightMoisture('ALL')}
                className={[
                  'rounded text-xs font-mono py-1 px-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-500',
                  highlightMoisture === 'ALL'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200',
                ].join(' ')}
              >
                MIND
              </button>
              {MOISTURES.map((m) => (
                <button
                  key={m}
                  onClick={() => setHighlightMoisture(m)}
                  className={[
                    'rounded text-xs font-mono py-1 px-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-500',
                    highlightMoisture === m
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200',
                  ].join(' ')}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid — one section per stage, three columns per moisture band */}
        <div className="space-y-10">
          {visibleStages.map((stage) => (
            <section key={stage} className="space-y-3">
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-stone-700 font-mono">{stage}</h2>
                <p className="text-xs text-stone-500">{STAGE_LABELS[stage]}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {visibleMoistures.map((moisture) => (
                  <div key={`${stage}-${moisture}`} className="space-y-2">
                    {/* Moisture label */}
                    <span
                      className={[
                        'inline-flex items-center rounded-full text-xs font-medium px-2.5 py-0.5',
                        MOISTURE_BADGE_CLASSES[moisture],
                      ].join(' ')}
                    >
                      {moisture}
                    </span>
                    <p className="text-[11px] text-stone-400">{MOISTURE_LABELS[moisture]}</p>

                    {/* Widget */}
                    <div className="rounded-xl border border-stone-200 bg-white p-2 shadow-sm">
                      <DiofaWidget stage={stage} moisture={moisture} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Count badge */}
        <p className="text-xs text-stone-400 font-mono text-right">
          {visibleStages.length * visibleMoistures.length} / 15 kombináció látható
        </p>

        {/* Asset swap-in guide */}
        <details className="text-xs text-stone-500 border border-stone-200 rounded-lg p-3 space-y-1 cursor-pointer">
          <summary className="font-medium text-stone-600 mb-1 list-none">
            Asset swap-in útmutató (illusztrátor átadáshoz)
          </summary>
          <p>
            Minden frame a <code>DiofaWidget.tsx</code> alján lévő{' '}
            <code>DIOFA_FRAMES</code> lookup-ban van definiálva.
            A végleges SVG fájlok a <code>src/assets/diofa/</code> mappába kerülnek,{' '}
            <code>{'diofa-{STAGE}-{MOISTURE}.svg'}</code> névkonvencióval
            (pl. <code>diofa-MAG-DRY.svg</code>, <code>diofa-TERMO-WET.svg</code>).
          </p>
          <p className="mt-1">
            Csere lépései: (1) SVG import a DiofaWidget.tsx tetejére, (2) az adott{' '}
            <code>DIOFA_FRAMES[stage][moisture]</code> értékének cseréje. Ez az előnézeti
            oldal nem igényel módosítást.
          </p>
        </details>

      </div>
    </div>
  )
}
