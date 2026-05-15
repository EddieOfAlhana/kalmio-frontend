/**
 * TasteSwipe — KALMIO-156 / E9.5
 *
 * Three-button taste-rating card deck.
 *
 * Props:
 *   cards         — ordered array of TasteCard items to rate
 *   source        — which context is triggering the ratings ('ONBOARDING' | 'IN_APP' | …)
 *   onSignal      — called after each successful submission (for planting-animation
 *                   micro-steps, analytics, etc.)
 *   onComplete    — called when all cards are rated or skipped
 *   onSkipAll     — called when the user taps "Kihagyom" (skip-all)
 *
 * Gesture support (keyboard + pointer):
 *   ArrowRight / L key → LOVE
 *   ArrowUp    / U key → OK
 *   ArrowLeft  / J key → HATE
 *   Escape / S key     → skip current card (same as "Kihagyom" per-card behaviour)
 *
 * Backend dependency:
 *   POST /api/users/me/taste-signals  (KALMIO-153 / E9.1).
 *   submitTasteSignal() swallows 404 so the UI advances even when backend is absent.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { capture } from '@/lib/analytics'
import { tasteSignalsService } from '@/services/tasteSignals'
import type { TasteCard, TasteSignalSource, TasteSignalValue } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────

export interface TasteSwipeProps {
  cards: TasteCard[]
  source?: TasteSignalSource
  onSignal?: (cardId: string, signal: TasteSignalValue) => void
  onComplete?: () => void
  onSkipAll?: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────

// Minimum horizontal/vertical pointer delta to count as a swipe.
const SWIPE_THRESHOLD_PX = 60

// ── Component ─────────────────────────────────────────────────────────────

export function TasteSwipe({
  cards,
  source = 'ONBOARDING',
  onSignal,
  onComplete,
  onSkipAll,
}: TasteSwipeProps) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Track swipe drag state for pointer-based gesture.
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  // The card wrapper — used for keyboard focus.
  const cardRef = useRef<HTMLDivElement>(null)

  const current = cards[index] ?? null
  const total = cards.length
  const done = index >= total

  // Auto-focus the card on mount and index change so keyboard works.
  useEffect(() => {
    if (!done) cardRef.current?.focus({ preventScroll: true })
  }, [index, done])

  // ── Core action ──

  const submit = useCallback(
    async (signal: TasteSignalValue) => {
      if (!current || submitting) return
      setError(null)
      setSubmitting(true)

      try {
        await tasteSignalsService.submitSignal({
          targetType: current.targetType,
          targetId: current.id,
          signal,
          source,
        })

        capture('taste_signal_submitted', {
          targetType: current.targetType,
          targetId: current.id,
          signal,
          source,
          deckPosition: index,
        })

        onSignal?.(current.id, signal)
        setIndex((i) => i + 1)
      } catch {
        setError(t('taste.errorSubmit'))
      } finally {
        setSubmitting(false)
      }
    },
    [current, submitting, source, index, onSignal, t],
  )

  const skipCard = useCallback(() => {
    if (!current || submitting) return
    capture('taste_card_skipped', {
      targetType: current.targetType,
      targetId: current.id,
      deckPosition: index,
    })
    setIndex((i) => i + 1)
  }, [current, submitting, index])

  // ── Keyboard ──

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (done || submitting) return
      switch (e.key) {
        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault()
          submit('LOVE')
          break
        case 'ArrowUp':
        case 'u':
        case 'U':
          e.preventDefault()
          submit('OK')
          break
        case 'ArrowLeft':
        case 'j':
        case 'J':
          e.preventDefault()
          submit('HATE')
          break
        case 'Escape':
        case 's':
        case 'S':
          e.preventDefault()
          skipCard()
          break
      }
    },
    [done, submitting, submit, skipCard],
  )

  // ── Pointer / touch swipe ──

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current || done || submitting) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    dragStart.current = null

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx > SWIPE_THRESHOLD_PX && absDx > absDy) {
      // Horizontal swipe.
      submit(dx > 0 ? 'LOVE' : 'HATE')
    } else if (-dy > SWIPE_THRESHOLD_PX && absDy > absDx) {
      // Upward swipe.
      submit('OK')
    }
    // Downward swipe / short drag — do nothing.
  }

  // ── onComplete callback when deck is exhausted ──

  useEffect(() => {
    if (done) onComplete?.()
  }, [done, onComplete])

  // ── Render: done state ──

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <p className="text-lg font-semibold text-stone-800">
          {t('taste.done')}
        </p>
        <p className="text-sm text-stone-500 max-w-xs">
          {t('taste.doneSubtitle')}
        </p>
      </div>
    )
  }

  // ── Render: active deck ──

  const progress = index / total

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto select-none">

      {/* Progress bar */}
      <div
        className="w-full h-1 rounded-full bg-stone-200 overflow-hidden"
        role="progressbar"
        aria-valuenow={index}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={t('taste.progress', { current: index + 1, total })}
      >
        <div
          className="h-full bg-amber-600 rounded-full transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Progress label */}
      <p className="text-xs text-stone-400 font-mono self-start">
        {t('taste.progress', { current: index + 1, total })}
      </p>

      {/* Card */}
      <div
        ref={cardRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={[
          'w-full rounded-2xl border border-stone-200 bg-white shadow-sm',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600',
          'cursor-grab active:cursor-grabbing',
          submitting ? 'opacity-60' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={current.name}
      >
        {/* Image area — shown only when imageUrl is present */}
        {current.imageUrl && (
          <div className="w-full aspect-video overflow-hidden rounded-t-2xl bg-stone-100">
            <img
              src={current.imageUrl}
              alt={current.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        )}

        {/* Text area */}
        <div className="p-5 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
            {current.targetType === 'INGREDIENT'
              ? t('taste.cardIngredient')
              : t('taste.cardRecipe')}
          </p>
          <p className="text-xl font-semibold text-stone-800 leading-snug">
            {current.name}
          </p>
          {current.subtitle && (
            <p className="text-sm text-stone-500">{current.subtitle}</p>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Three action buttons */}
      <div className="flex w-full gap-3" role="group" aria-label={t('taste.actionsLabel')}>

        {/* HATE — left / red */}
        <button
          onClick={() => submit('HATE')}
          disabled={submitting}
          aria-label={t('taste.hate')}
          className={[
            'flex-1 rounded-xl border-2 border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-700',
            'transition-colors hover:bg-red-100 active:bg-red-200',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500',
            'disabled:opacity-40',
          ].join(' ')}
        >
          {/* Functional status indicator — not decorative emoji in body copy */}
          <span aria-hidden="true" className="mr-1.5 text-base">✕</span>
          {t('taste.hate')}
        </button>

        {/* OK — center / stone */}
        <button
          onClick={() => submit('OK')}
          disabled={submitting}
          aria-label={t('taste.ok')}
          className={[
            'flex-1 rounded-xl border-2 border-stone-200 bg-stone-50 py-4 text-sm font-semibold text-stone-700',
            'transition-colors hover:bg-stone-100 active:bg-stone-200',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500',
            'disabled:opacity-40',
          ].join(' ')}
        >
          <span aria-hidden="true" className="mr-1.5 text-base">👍</span>
          {t('taste.ok')}
        </button>

        {/* LOVE — right / amber */}
        <button
          onClick={() => submit('LOVE')}
          disabled={submitting}
          aria-label={t('taste.love')}
          className={[
            'flex-1 rounded-xl border-2 border-amber-200 bg-amber-50 py-4 text-sm font-semibold text-amber-800',
            'transition-colors hover:bg-amber-100 active:bg-amber-200',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600',
            'disabled:opacity-40',
          ].join(' ')}
        >
          <span aria-hidden="true" className="mr-1.5 text-base">❤</span>
          {t('taste.love')}
        </button>

      </div>

      {/* Skip (Kihagyom) */}
      <button
        onClick={onSkipAll ?? skipCard}
        disabled={submitting}
        className={[
          'text-xs text-stone-400 underline underline-offset-2',
          'hover:text-stone-600 transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400',
          'disabled:opacity-40',
        ].join(' ')}
      >
        {t('taste.skip')}
      </button>

    </div>
  )
}
