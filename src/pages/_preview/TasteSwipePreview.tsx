/**
 * TasteSwipePreview — KALMIO-156
 *
 * Dev-only visual preview for <TasteSwipe />.
 * Route: /app/_preview/taste-swipe  (ProtectedRoute only — not publicly linked)
 *
 * Uses the real buildDeck() service function, which:
 *   1. Tries GET /api/users/me/taste-deck (will 404 until KALMIO-153 / E9.2 ships).
 *   2. Falls back to sampling from /api/ingredients + /api/recipes.
 *
 * Lets you verify:
 *   - Card advance / progress bar
 *   - All three signal buttons (Imádom / Megeszem / Soha)
 *   - Keyboard shortcuts (ArrowRight, ArrowUp, ArrowLeft, Escape)
 *   - Pointer/touch swipe gesture
 *   - Kihagyom (skip) link
 *   - Done screen
 *   - 375 px mobile layout
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TasteSwipe } from '@/components/taste/TasteSwipe'
import { tasteSignalsService } from '@/services/tasteSignals'
import type { TasteSignalValue } from '@/types'

interface LogEntry {
  cardName: string
  signal: TasteSignalValue | 'SKIPPED'
  at: string
}

export function TasteSwipePreview() {
  const [log, setLog] = useState<LogEntry[]>([])
  const [deckKey, setDeckKey] = useState(0)  // bump to re-mount the TasteSwipe

  const { data: cards, isLoading, isError, error } = useQuery({
    queryKey: ['taste-deck-preview', deckKey],
    queryFn: () => tasteSignalsService.buildDeck(),
    staleTime: 60_000,
  })

  const handleSignal = (cardId: string, signal: TasteSignalValue) => {
    const name = cards?.find((c) => c.id === cardId)?.name ?? cardId
    setLog((prev) => [
      { cardName: name, signal, at: new Date().toLocaleTimeString('hu-HU') },
      ...prev,
    ])
  }

  const handleComplete = () => {
    setLog((prev) => [
      { cardName: '—', signal: 'SKIPPED', at: new Date().toLocaleTimeString('hu-HU') },
      ...prev,
    ])
  }

  const handleReset = () => {
    setLog([])
    setDeckKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">
            KALMIO-156 — dev preview
          </p>
          <h1 className="text-xl font-semibold text-stone-800">
            TasteSwipe — ízlésfelmérő kártyák
          </h1>
          <p className="text-sm text-stone-500">
            Placeholder kártyák. Végleges deck: KALMIO-153 / E9.2.
            Backend POST endpoint: KALMIO-153 / E9.1 (404-ig naplóba megy, nem hibázik).
          </p>
        </div>

        {/* Keyboard shortcut reference */}
        <details className="text-xs text-stone-500 border border-stone-200 rounded-lg p-3 cursor-pointer">
          <summary className="font-medium text-stone-600 list-none">
            Billentyűparancsok
          </summary>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li><kbd className="font-mono bg-stone-100 px-1 rounded">→</kbd> / <kbd className="font-mono bg-stone-100 px-1 rounded">L</kbd> — Imádom (LOVE)</li>
            <li><kbd className="font-mono bg-stone-100 px-1 rounded">↑</kbd> / <kbd className="font-mono bg-stone-100 px-1 rounded">U</kbd> — Megeszem (OK)</li>
            <li><kbd className="font-mono bg-stone-100 px-1 rounded">←</kbd> / <kbd className="font-mono bg-stone-100 px-1 rounded">J</kbd> — Soha (HATE)</li>
            <li><kbd className="font-mono bg-stone-100 px-1 rounded">Esc</kbd> / <kbd className="font-mono bg-stone-100 px-1 rounded">S</kbd> — Kihagyom (skip)</li>
          </ul>
        </details>

        {/* Deck */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          {isLoading && (
            <p className="text-sm text-stone-400 text-center py-8">
              Kártyák betöltése…
            </p>
          )}
          {isError && (
            <p className="text-sm text-red-600 text-center py-8" role="alert">
              Nem sikerült betölteni a kártyákat.{' '}
              <span className="font-mono text-xs">
                {String((error as Error)?.message ?? error)}
              </span>
            </p>
          )}
          {!isLoading && !isError && cards && cards.length > 0 && (
            <TasteSwipe
              key={deckKey}
              cards={cards}
              source="ONBOARDING"
              onSignal={handleSignal}
              onComplete={handleComplete}
            />
          )}
          {!isLoading && !isError && cards && cards.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-8">
              A deck üres — nincs hozzávaló vagy recept az API-ban.
            </p>
          )}
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-full rounded-lg border border-stone-200 text-stone-600 text-sm font-medium py-2.5 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400"
        >
          Újra (deck reset)
        </button>

        {/* Signal log */}
        {log.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-stone-400 uppercase tracking-widest font-mono">
              Naplózott jelek
            </p>
            <ul className="space-y-1">
              {log.map((entry, i) => (
                <li
                  key={i}
                  className="flex justify-between text-xs text-stone-600 border-b border-stone-100 pb-1"
                >
                  <span className="font-medium truncate max-w-[60%]">{entry.cardName}</span>
                  <span className="flex gap-3">
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 font-mono',
                        entry.signal === 'LOVE'
                          ? 'bg-amber-100 text-amber-800'
                          : entry.signal === 'OK'
                          ? 'bg-stone-100 text-stone-600'
                          : entry.signal === 'HATE'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-stone-100 text-stone-400',
                      ].join(' ')}
                    >
                      {entry.signal}
                    </span>
                    <span className="text-stone-400">{entry.at}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  )
}
