import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { useDraggable } from '@dnd-kit/core'
import { dashboardService } from '@/services/dashboard'
import { usersService } from '@/services/users'
import { planService } from '@/services/plans'
import { prepTasksService } from '@/services/prepTasks'
import type { DashboardDto, TimePreferencesDto } from '@/types'
import { useEffect } from 'react'

// ── time helpers ──────────────────────────────────────────────────────────

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function minutesToHm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function snapToGrid(minutes: number, snap = 15): number {
  return Math.round(minutes / snap) * snap
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function gapPx(diffMinutes: number): number {
  return clamp(diffMinutes * 0.22, 10, 52)
}

const DRAG_MIN_PER_PX = 2

// ── defaults ──────────────────────────────────────────────────────────────

const MEAL_DEFAULTS: Record<string, string> = {
  BREAKFAST: '08:00',
  MORNING_SNACK: '10:30',
  LUNCH: '12:30',
  AFTERNOON_SNACK: '16:00',
  DINNER: '19:00',
  SNACK: '21:00',
}

const PREP_WINDOW_DEFAULTS: Record<string, string> = {
  MORNING: '07:30',
  AFTERNOON: '13:00',
  EVENING: '18:00',
  NIGHT: '22:00',
}

// ── node styles ───────────────────────────────────────────────────────────

type NodeStyle = { ring: string; bg: string; icon: string }

const NODE_STYLES: Record<string, NodeStyle> = {
  wake:            { ring: 'ring-amber-300',  bg: 'bg-amber-50',  icon: '☀️' },
  sleep:           { ring: 'ring-indigo-400', bg: 'bg-indigo-50', icon: '🌙' },
  BREAKFAST:       { ring: 'ring-amber-400',  bg: 'bg-amber-50',  icon: '🍳' },
  MORNING_SNACK:   { ring: 'ring-lime-400',   bg: 'bg-lime-50',   icon: '🍎' },
  LUNCH:           { ring: 'ring-orange-400', bg: 'bg-orange-50', icon: '🥗' },
  AFTERNOON_SNACK: { ring: 'ring-lime-400',   bg: 'bg-lime-50',   icon: '🍎' },
  DINNER:          { ring: 'ring-rose-400',   bg: 'bg-rose-50',   icon: '🍽' },
  SNACK:           { ring: 'ring-lime-400',   bg: 'bg-lime-50',   icon: '🍎' },
  prep:            { ring: 'ring-teal-400',   bg: 'bg-teal-50',   icon: '🥘' },
  shopping:        { ring: 'ring-blue-400',   bg: 'bg-blue-50',   icon: '🛒' },
  grooming:        { ring: 'ring-purple-400', bg: 'bg-purple-50', icon: '🧊' },
}

function nodeStyle(type: string): NodeStyle {
  return NODE_STYLES[type] ?? { ring: 'ring-gray-300', bg: 'bg-gray-50', icon: '•' }
}

// ── card data ─────────────────────────────────────────────────────────────

interface TimelineCardData {
  id: string
  type: string
  label: string
  subtitle?: string
  startMinutes: number
  mealType?: string
  window?: string
  mealId?: string
  prepTaskId?: string
}

// ── SleepBanner ───────────────────────────────────────────────────────────

function SleepBanner({ from, to }: { from: string; to: string }) {
  return (
    <div className="mx-3 my-2 rounded-2xl overflow-hidden">
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-3.5 flex items-center gap-3">
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          {([
            [18, 8], [55, 15], [72, 5], [88, 18],
            [32, 20], [64, 9], [45, 22], [78, 13],
          ] as [number, number][]).map(([x, y], i) => (
            <div key={i} className="absolute rounded-full bg-white/20"
              style={{ left: `${x}%`, top: `${y * 4}px`, width: 2, height: 2 }} />
          ))}
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-800/60 ring-1 ring-indigo-600/40 flex items-center justify-center text-sm shrink-0">
          🌙
        </div>
        <div>
          <p className="text-white/90 text-xs font-semibold tracking-wide">Alvás</p>
          <p className="text-indigo-300/70 text-xs">{from} – {to}</p>
        </div>
        <div aria-hidden className="ml-auto text-indigo-300/25 text-sm font-light tracking-[0.3em] select-none">
          zzz
        </div>
      </div>
    </div>
  )
}

// ── DraggableRow ──────────────────────────────────────────────────────────
// setNodeRef is on the CARD div only (not the whole row) so DragOverlay
// appears exactly at the card's position, not at the cursor.

interface DraggableRowProps {
  card: TimelineCardData
  isFirst: boolean
  isLast: boolean
  liveDragMinutes: number | null  // non-null only for the card being dragged
}

function DraggableRow({ card, isFirst, isLast, liveDragMinutes }: DraggableRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })
  const ns = nodeStyle(card.type)

  // While dragging: left label shows live snapped time in orange
  const displayTime = isDragging && liveDragMinutes !== null
    ? minutesToHm(liveDragMinutes)
    : minutesToHm(card.startMinutes)

  return (
    <div data-card-id={card.id} className="flex items-start gap-0">
      {/* Time label */}
      <div className={[
        'w-12 shrink-0 pt-2 text-right pr-2.5 text-[10px] select-none tabular-nums',
        isDragging ? 'font-bold text-[#F28C28]' : 'font-medium text-gray-400',
      ].join(' ')}>
        {displayTime}
      </div>

      {/* Spine */}
      <div className="relative flex flex-col items-center w-7 shrink-0">
        {!isFirst && <div style={{ width: 1, flex: 1, minHeight: 8, background: '#e5e7eb', alignSelf: 'center' }} />}
        <div
          {...listeners}
          aria-label="Áthelyezés"
          className={[
            'relative z-10 w-7 h-7 rounded-full ring-1 flex items-center justify-center text-sm shrink-0 cursor-grab active:cursor-grabbing touch-none',
            ns.ring, ns.bg,
          ].join(' ')}
        >
          {ns.icon}
        </div>
        {!isLast && <div style={{ width: 1, flex: 1, minHeight: 8, background: '#e5e7eb', alignSelf: 'center' }} />}
      </div>

      {/* Card — setNodeRef HERE so DragOverlay aligns to card, not row */}
      <div ref={setNodeRef} {...attributes} className="flex-1 pl-2.5 pt-0.5 pb-0.5 min-w-0">
        {isDragging ? (
          // Ghost placeholder: dashed outline, same height as real card
          <div className="h-10 rounded-xl border-2 border-dashed border-[#F28C28]/30 bg-orange-50/30" />
        ) : (
          <div className="rounded-xl bg-white border border-gray-100/80 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-3 py-2.5 flex items-center gap-2 select-none">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 leading-tight truncate">{card.label}</p>
              {card.subtitle && (
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight truncate">{card.subtitle}</p>
              )}
            </div>
            <button
              type="button"
              {...listeners}
              aria-label="Áthelyezés"
              className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] rounded p-0.5"
            >
              <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden>
                <circle cx="3" cy="2.5" r="1.3" /><circle cx="7" cy="2.5" r="1.3" />
                <circle cx="3" cy="7"    r="1.3" /><circle cx="7" cy="7"    r="1.3" />
                <circle cx="3" cy="11.5" r="1.3" /><circle cx="7" cy="11.5" r="1.3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── DraggableSpineDot (wake / sleep) ──────────────────────────────────────

interface SpineDotProps {
  id: string
  time: string
  label: string
  type: 'wake' | 'sleep'
  showLineAbove?: boolean
  showLineBelow?: boolean
  liveDragMinutes: number | null
}

function DraggableSpineDot({ id, time, label, type, showLineAbove, showLineBelow, liveDragMinutes }: SpineDotProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  const ns = nodeStyle(type)

  const displayTime = isDragging && liveDragMinutes !== null
    ? minutesToHm(liveDragMinutes)
    : time

  return (
    <div className="flex items-start gap-0">
      <div className={[
        'w-12 shrink-0 pt-1.5 text-right pr-2.5 tabular-nums select-none',
        isDragging ? 'text-[10px] font-bold text-[#F28C28]' : 'text-[10px] font-medium text-gray-400',
      ].join(' ')}>
        {displayTime}
      </div>
      <div className="relative flex flex-col items-center w-7 shrink-0">
        {showLineAbove && <div style={{ width: 1, flex: 1, minHeight: 8, background: '#e5e7eb', alignSelf: 'center' }} />}
        {/* setNodeRef on the button so overlay appears at dot position */}
        <button
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          type="button"
          aria-label={label}
          className={[
            'relative z-10 w-6 h-6 rounded-full ring-1 flex items-center justify-center text-xs cursor-grab active:cursor-grabbing touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]',
            ns.ring, ns.bg,
            isDragging ? 'opacity-30' : '',
          ].join(' ')}
        >
          {ns.icon}
        </button>
        {showLineBelow && <div style={{ width: 1, flex: 1, minHeight: 8, background: '#e5e7eb', alignSelf: 'center' }} />}
      </div>
      <div className="flex-1 pl-2.5 pt-1">
        <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      </div>
    </div>
  )
}

// ── SpacerRow ─────────────────────────────────────────────────────────────

function SpacerRow({ minutes }: { minutes: number }) {
  const h = gapPx(minutes)
  return (
    <div className="flex" style={{ height: h, transition: 'height 0.15s ease' }}>
      <div className="w-12 shrink-0" />
      <div className="w-7 shrink-0 flex justify-center">
        <div style={{ width: 1, height: '100%', background: '#e5e7eb' }} />
      </div>
    </div>
  )
}

// ── DragFeedbackPill ──────────────────────────────────────────────────────

interface DragFeedbackPillProps {
  label: string
  todayOnlyLabel: string
  defaultLabel: string
  onTodayOnly: () => void
  onSetDefault: () => void
  onDismiss: () => void
}

function DragFeedbackPill({ label, todayOnlyLabel, defaultLabel, onTodayOnly, onSetDefault, onDismiss }: DragFeedbackPillProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="flex items-center gap-1.5 ml-[76px] mt-1 mb-1 flex-wrap" role="status" aria-live="polite">
      <span className="text-[10px] text-gray-400 mr-0.5">{label}</span>
      <button type="button" onClick={onTodayOnly}
        className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">
        {todayOnlyLabel}
      </button>
      <button type="button" onClick={onSetDefault}
        className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-white hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">
        {defaultLabel}
      </button>
    </div>
  )
}

// ── DailyTimeline ─────────────────────────────────────────────────────────

interface DailyTimelineProps {
  date: string
  hasShoppingDay?: boolean
  activePlanId?: string | null
}

interface PendingFeedback {
  cardId: string
  newTime: string
  cardType: 'meal' | 'prep' | 'sleep-wake'
  mealType?: string
  window?: string
  mealId?: string
  prepTaskId?: string
  dotKind?: 'wake' | 'sleep'
  label: string
}

export function DailyTimeline({ date, hasShoppingDay, activePlanId }: DailyTimelineProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: dashboard } = useQuery<DashboardDto>({
    queryKey: ['dashboard', date],
    queryFn: () => dashboardService.get(date),
    staleTime: 30_000,
  })

  const { data: timePref } = useQuery<TimePreferencesDto>({
    queryKey: ['time-preferences'],
    queryFn: usersService.getTimePreferences,
    staleTime: 300_000,
    retry: false,
  })

  const wakeDefault = timePref?.wakeTime ?? '07:00'
  const sleepDefault = timePref?.sleepTime ?? '23:00'

  const [localWake, setLocalWake] = useState<string | null>(null)
  const [localSleep, setLocalSleep] = useState<string | null>(null)
  const [cardTimeOverrides, setCardTimeOverrides] = useState<Record<string, string>>({})
  const [activeCard, setActiveCard] = useState<TimelineCardData | null>(null)
  const [activeDotKind, setActiveDotKind] = useState<'wake' | 'sleep' | null>(null)
  const [pendingFeedback, setPendingFeedback] = useState<PendingFeedback | null>(null)
  const [liveDragId, setLiveDragId] = useState<string | null>(null)
  const [liveDragMinutes, setLiveDragMinutes] = useState<number | null>(null)
  const dragBaseMinutesRef = useRef<number>(0)

  const wakeTime = localWake ?? wakeDefault
  const sleepTime = localSleep ?? sleepDefault
  const wakeMinutes = hmToMinutes(wakeTime)
  const sleepMinutes = hmToMinutes(sleepTime)

  const patchTimePref = useMutation({
    mutationFn: (req: Partial<TimePreferencesDto>) => usersService.patchTimePreferences(req),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['time-preferences'] }),
  })
  const patchMealTime = useMutation({
    mutationFn: ({ planId, mealId, time }: { planId: string; mealId: string; time: string | null }) =>
      planService.patchMealScheduledTime(planId, mealId, time),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['dashboard', date] }),
  })
  const patchPrepTime = useMutation({
    mutationFn: ({ taskId, time }: { taskId: string; time: string | null }) =>
      prepTasksService.patchScheduledTime(taskId, time),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['dashboard', date] }),
  })

  // ── build card list ──────────────────────────────────────────────────────

  const meals = dashboard?.todaysMeals ?? []
  const prepTasks = dashboard?.todaysPrepTasks ?? []
  const cards: TimelineCardData[] = []

  meals.forEach(meal => {
    const mealTimePrefs = timePref?.mealTimePrefs ?? {}
    const defaultTime = mealTimePrefs[meal.mealType] ?? MEAL_DEFAULTS[meal.mealType] ?? '12:00'
    const scheduledTime = cardTimeOverrides[`meal-${meal.mealId}`] ?? meal.scheduledTime ?? defaultTime
    cards.push({
      id: `meal-${meal.mealId}`,
      type: meal.mealType,
      label: meal.recipeName,
      subtitle: meal.macros ? `${meal.macros.kcal} kcal · ${meal.macros.protein}g fehérje` : undefined,
      startMinutes: hmToMinutes(scheduledTime),
      mealType: meal.mealType,
      mealId: meal.mealId,
    })
  })

  prepTasks.forEach(task => {
    const defaultTime = PREP_WINDOW_DEFAULTS[task.window] ?? '12:00'
    const scheduledTime = cardTimeOverrides[`prep-${task.id ?? task.recipeId}`] ?? task.scheduledTime ?? defaultTime
    cards.push({
      id: `prep-${task.id ?? task.recipeId}`,
      type: 'prep',
      label: task.recipeName,
      subtitle: task.durationMin ? `~ ${task.durationMin} perc` : undefined,
      startMinutes: hmToMinutes(scheduledTime),
      window: task.window,
      prepTaskId: task.id,
    })
  })

  if (hasShoppingDay) {
    cards.push({
      id: 'shopping',
      type: 'shopping',
      label: t('timeline.shopping'),
      startMinutes: hmToMinutes(cardTimeOverrides['shopping'] ?? '15:00'),
    })
  }

  // ── dnd handlers ─────────────────────────────────────────────────────────

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id)
    if (id === 'dot-wake') {
      setActiveDotKind('wake')
      setLiveDragId(id)
      dragBaseMinutesRef.current = wakeMinutes
      setLiveDragMinutes(wakeMinutes)
      return
    }
    if (id === 'dot-sleep') {
      setActiveDotKind('sleep')
      setLiveDragId(id)
      dragBaseMinutesRef.current = sleepMinutes
      setLiveDragMinutes(sleepMinutes)
      return
    }
    const card = cards.find(c => c.id === id)
    if (card) {
      setActiveCard(card)
      setLiveDragId(id)
      dragBaseMinutesRef.current = card.startMinutes
      setLiveDragMinutes(card.startMinutes)
    }
  }, [cards, wakeMinutes, sleepMinutes])

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const id = String(event.active.id)
    const base = dragBaseMinutesRef.current
    const delta = event.delta.y
    let newMin: number
    if (id === 'dot-wake') {
      newMin = clamp(snapToGrid(base + delta * DRAG_MIN_PER_PX), 0, sleepMinutes - 30)
    } else if (id === 'dot-sleep') {
      newMin = clamp(snapToGrid(base + delta * DRAG_MIN_PER_PX), wakeMinutes + 30, 23 * 60 + 59)
    } else {
      newMin = clamp(snapToGrid(base + delta * DRAG_MIN_PER_PX), 0, 23 * 60 + 45)
    }
    setLiveDragMinutes(newMin)
  }, [wakeMinutes, sleepMinutes])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const id = String(event.active.id)
    const newMin = liveDragMinutes ?? dragBaseMinutesRef.current
    const newTime = minutesToHm(newMin)

    setLiveDragId(null)
    setLiveDragMinutes(null)

    if (id === 'dot-wake') {
      setActiveDotKind(null)
      setLocalWake(newTime)
      setPendingFeedback({ cardId: id, newTime, cardType: 'sleep-wake', dotKind: 'wake', label: newTime })
      return
    }
    if (id === 'dot-sleep') {
      setActiveDotKind(null)
      setLocalSleep(newTime)
      setPendingFeedback({ cardId: id, newTime, cardType: 'sleep-wake', dotKind: 'sleep', label: newTime })
      return
    }

    const card = cards.find(c => c.id === id)
    if (!card) { setActiveCard(null); return }

    setCardTimeOverrides(prev => ({ ...prev, [id]: newTime }))
    setActiveCard(null)
    setPendingFeedback({
      cardId: id, newTime,
      cardType: card.type === 'prep' ? 'prep' : 'meal',
      mealType: card.mealType,
      window: card.window,
      mealId: card.mealId,
      prepTaskId: card.prepTaskId,
      label: newTime,
    })
  }, [cards, liveDragMinutes])

  const handleTodayOnly = useCallback(() => {
    if (!pendingFeedback) return
    const { cardType, mealId, prepTaskId, newTime, dotKind } = pendingFeedback
    if (cardType === 'sleep-wake' && dotKind) { setPendingFeedback(null); return }
    if (cardType === 'meal' && mealId && activePlanId)
      patchMealTime.mutate({ planId: activePlanId, mealId, time: newTime })
    if (cardType === 'prep' && prepTaskId)
      patchPrepTime.mutate({ taskId: prepTaskId, time: newTime })
    setPendingFeedback(null)
  }, [pendingFeedback, activePlanId, patchMealTime, patchPrepTime])

  const handleSetDefault = useCallback(() => {
    if (!pendingFeedback) return
    const { cardType, mealType, newTime, dotKind } = pendingFeedback
    if (cardType === 'sleep-wake') {
      patchTimePref.mutate(dotKind === 'wake' ? { wakeTime: newTime } : { sleepTime: newTime })
    } else if (cardType === 'meal' && mealType) {
      patchTimePref.mutate({ mealTimePrefs: { ...(timePref?.mealTimePrefs ?? {}), [mealType]: newTime } })
      if (pendingFeedback.mealId && activePlanId)
        patchMealTime.mutate({ planId: activePlanId, mealId: pendingFeedback.mealId, time: newTime })
    }
    setPendingFeedback(null)
  }, [pendingFeedback, timePref, patchTimePref, patchMealTime, activePlanId])

  // ── sorted point list — uses liveDragMinutes for magnetic re-sort ─────────

  const getEffectiveMinutes = (card: TimelineCardData) =>
    liveDragId === card.id && liveDragMinutes !== null ? liveDragMinutes : card.startMinutes

  type Row =
    | { kind: 'dot';      dotType: 'wake' | 'sleep'; time: string; minutes: number }
    | { kind: 'card';     card: TimelineCardData; minutes: number }
    | { kind: 'spacer';   minutes: number }
    | { kind: 'feedback'; cardId: string }

  const allPoints = ([
    { minutes: wakeMinutes,  row: { kind: 'dot'  as const, dotType: 'wake'  as const, time: wakeTime,  minutes: wakeMinutes  } },
    { minutes: sleepMinutes, row: { kind: 'dot'  as const, dotType: 'sleep' as const, time: sleepTime, minutes: sleepMinutes } },
    ...cards.map(c => ({
      minutes: getEffectiveMinutes(c),
      row: { kind: 'card' as const, card: { ...c, startMinutes: getEffectiveMinutes(c) }, minutes: getEffectiveMinutes(c) },
    })),
  ] satisfies Array<{ minutes: number; row: Row }>).sort((a, b) => a.minutes - b.minutes)

  const rows: Row[] = []
  const nodeCount = allPoints.length

  allPoints.forEach((pt, i) => {
    if (i > 0) {
      const diff = pt.minutes - allPoints[i - 1]!.minutes
      if (diff > 0) rows.push({ kind: 'spacer', minutes: diff })
    }
    rows.push(pt.row)
    const id = pt.row.kind === 'card'
      ? pt.row.card.id
      : pt.row.kind === 'dot' ? `dot-${pt.row.dotType}` : ''
    if (pendingFeedback?.cardId === id) {
      rows.push({ kind: 'feedback', cardId: id })
    }
  })

  // ── DragOverlay content ───────────────────────────────────────────────────

  const overlayTime = liveDragMinutes !== null ? minutesToHm(liveDragMinutes) : ''

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col py-1 pb-6">
        <SleepBanner from="00:00" to={wakeTime} />

        <div className="flex flex-col px-3 pt-2">
          {(() => {
            let nodeIndex = -1
            return rows.map((row, i) => {
              if (row.kind === 'spacer') {
                return <SpacerRow key={`spacer-${i}`} minutes={row.minutes} />
              }

              if (row.kind === 'feedback') {
                const pf = pendingFeedback
                if (!pf || pf.cardId !== row.cardId) return null
                return (
                  <DragFeedbackPill
                    key={`pill-${row.cardId}`}
                    label={pf.label}
                    todayOnlyLabel={t('timeline.todayOnly')}
                    defaultLabel={
                      pf.cardType === 'sleep-wake'
                        ? (pf.dotKind === 'wake' ? t('timeline.setAsWakeTime') : t('timeline.setAsSleepTime'))
                        : t('timeline.setDefault')
                    }
                    onTodayOnly={handleTodayOnly}
                    onSetDefault={handleSetDefault}
                    onDismiss={() => setPendingFeedback(null)}
                  />
                )
              }

              nodeIndex++
              const isFirst = nodeIndex === 0
              const isLast  = nodeIndex === nodeCount - 1

              if (row.kind === 'dot') {
                const dotId = `dot-${row.dotType}`
                return (
                  <DraggableSpineDot
                    key={dotId}
                    id={dotId}
                    time={row.time}
                    type={row.dotType}
                    label={row.dotType === 'wake' ? t('timeline.wake') : t('timeline.sleep')}
                    showLineAbove={!isFirst}
                    showLineBelow={!isLast}
                    liveDragMinutes={liveDragId === dotId ? liveDragMinutes : null}
                  />
                )
              }

              return (
                <DraggableRow
                  key={row.card.id}
                  card={row.card}
                  isFirst={isFirst}
                  isLast={isLast}
                  liveDragMinutes={liveDragId === row.card.id ? liveDragMinutes : null}
                />
              )
            })
          })()}
        </div>

        <SleepBanner from={sleepTime} to="00:00" />

        {cards.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-4">
            {t('dashboard.noMealsToday', 'Nincs tervezett étkezés erre a napra')}
          </p>
        )}
      </div>

      {/* DragOverlay — anchored to the card rect (setNodeRef is on the card div),
          so it appears exactly where the card is and only moves vertically */}
      <DragOverlay modifiers={[restrictToVerticalAxis]} dropAnimation={null}>
        {activeCard ? (() => {
          const ns = nodeStyle(activeCard.type)
          return (
            <div className="rounded-xl bg-white border border-[#F28C28]/50 shadow-[0_8px_32px_rgba(0,0,0,0.14)] px-3 py-2.5 flex items-center gap-2 select-none">
              <div className={`w-7 h-7 rounded-full ring-1 ${ns.ring} ${ns.bg} flex items-center justify-center text-sm shrink-0`}>
                {ns.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 leading-tight truncate">{activeCard.label}</p>
                <p className="text-[11px] font-bold text-[#F28C28] tabular-nums mt-0.5">{overlayTime}</p>
              </div>
            </div>
          )
        })() : activeDotKind ? (() => {
          const ns = nodeStyle(activeDotKind)
          return (
            <div className={`w-6 h-6 rounded-full ring-1 ${ns.ring} ${ns.bg} flex items-center justify-center text-xs shadow-md`}>
              {ns.icon}
            </div>
          )
        })() : null}
      </DragOverlay>
    </DndContext>
  )
}
