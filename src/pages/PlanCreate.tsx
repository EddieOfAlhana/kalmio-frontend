/**
 * PlanCreate — 3-step plan creation wizard.
 *
 * Step 1: Member selection (chip selector)
 * Step 2: Date + duration (date picker, quick-picks 7/14, free entry)
 * Step 3: Meal slot coverage (breakfast/lunch/dinner/snack checkboxes)
 *
 * Conflict warning inline if (profile, date, mealType) overlaps existing plan.
 * Plan name auto-generated with edit-in-place.
 * CTA "Generate plan" → triggers solver run (existing 10s flow TBD — BE3).
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Pencil, Check } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { MemberChipSelector, type SelectableMember } from '@/components/plan/MemberChipSelector'
import { multiMemberPlanService } from '@/services/multiMemberPlanService'
import { familyService } from '@/services/family'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/store/auth'
import type { MealType, CreateMultiMemberPlanRequest } from '@/types'

const FAMILY_ID_KEY = 'kalmio_family_id'

type WizardStep = 1 | 2 | 3

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
const DURATION_PRESETS = [7, 14]
const TODAY = new Date().toISOString().slice(0, 10)

function generatePlanName(memberNames: string[], startDate: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (!startDate) return ''
  const date = new Date(startDate)
  const monthDay = new Intl.DateTimeFormat('hu-HU', { month: 'long', day: 'numeric' }).format(date)
  if (memberNames.length === 0) return t('plan.wizard.autoName', { date: monthDay })
  if (memberNames.length === 1) return t('plan.wizard.autoName', { date: monthDay })
  return t('plan.wizard.autoNameFamily', { date: monthDay })
}

export function PlanCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const currentUserId = useAuthStore((s) => s.session?.user.id ?? '')
  const familyId = localStorage.getItem(FAMILY_ID_KEY)

  const [step, setStep] = useState<WizardStep>(1)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([currentUserId])
  const [startDate, setStartDate] = useState(TODAY)
  const [durationDays, setDurationDays] = useState(7)
  const [mealSlots, setMealSlots] = useState<MealType[]>(['LUNCH', 'DINNER'])
  const [editingName, setEditingName] = useState(false)
  const [planName, setPlanName] = useState('')
  const [conflictError, setConflictError] = useState<string | null>(null)

  // Load family to get member list
  const { data: family } = useQuery({
    queryKey: ['family', familyId],
    queryFn: () => familyService.getFamily(familyId!),
    enabled: !!familyId,
    staleTime: 60_000,
  })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
    staleTime: 60_000,
  })

  const myDisplayName = me
    ? ([me.firstName, me.lastName].filter(Boolean).join(' ') || me.email)
    : t('family.memberRow.you')

  // Build selectable member list from family members
  const selectableMembers: SelectableMember[] = family
    ? family.members.map((m) => ({
        id: m.userId,
        displayName: m.userId === currentUserId
          ? myDisplayName
          : m.userId.slice(0, 8),
        isCurrentUser: m.userId === currentUserId,
      }))
    : [{ id: currentUserId, displayName: myDisplayName, isCurrentUser: true }]

  // Auto-generate plan name whenever inputs change
  const memberDisplayNames = selectedMemberIds.map(id => {
    const m = selectableMembers.find(sm => sm.id === id)
    return m?.displayName ?? id
  })

  const autoName = generatePlanName(memberDisplayNames, startDate, t)
  const displayName = planName || autoName

  function toggleMealSlot(mt: MealType) {
    setMealSlots(prev =>
      prev.includes(mt) ? prev.filter(s => s !== mt) : [...prev, mt]
    )
  }

  const createMut = useMutation({
    mutationFn: (req: CreateMultiMemberPlanRequest) => multiMemberPlanService.create(req),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['multiplans'] })
      toast({ title: t('plan.wizard.created') })
      navigate(`/app/plans/${plan.id}`)
    },
    onError: (err: { response?: { status?: number; data?: { message?: string } } }) => {
      if (err.response?.status === 409) {
        const msg = err.response.data?.message ?? t('plan.wizard.conflictGeneric')
        setConflictError(msg)
        setStep(2) // go back to date step to show conflict
      } else {
        toast({ title: t('common.errorGeneric'), variant: 'destructive' })
      }
    },
  })

  function submit() {
    const req: CreateMultiMemberPlanRequest = {
      memberIds: selectedMemberIds,
      startDate,
      durationDays,
      mealSlotsCovered: mealSlots,
      name: planName || null,
    }
    setConflictError(null)
    createMut.mutate(req)
  }

  function canAdvance(): boolean {
    if (step === 1) return selectedMemberIds.length > 0
    if (step === 2) return !!startDate && durationDays >= 1
    if (step === 3) return mealSlots.length > 0
    return false
  }

  const stepLabels = [
    t('plan.wizard.step1Label'),
    t('plan.wizard.step2Label'),
    t('plan.wizard.step3Label'),
  ]

  return (
    <div className="max-w-lg mx-auto px-4 pb-10">
      <Header
        title={t('plan.wizard.title')}
        actions={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-[#6b7280] hover:text-[#1A1A1A] flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('common.back')}
          </button>
        }
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8" role="list" aria-label={t('plan.wizard.stepsLabel')}>
        {stepLabels.map((label, i) => {
          const n = (i + 1) as WizardStep
          const done = step > n
          const active = step === n
          return (
            <div key={n} className="flex items-center gap-2 flex-1 last:flex-none" role="listitem">
              <div className="flex items-center gap-1.5">
                <span
                  aria-current={active ? 'step' : undefined}
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${done ? 'bg-emerald-500 text-white' : active ? 'bg-[#4f46e5] text-white' : 'bg-[#e5e7eb] text-[#9ca3af]'}
                  `}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : n}
                </span>
                <span className={`text-xs hidden sm:block ${active ? 'text-[#1A1A1A] font-medium' : 'text-[#9ca3af]'}`}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-[#e5e7eb]" aria-hidden />}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-[#e5e4e7] shadow-sm p-5 mb-6">

        {/* Step 1: Members */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-headline font-bold text-[#1A1A1A]">{t('plan.wizard.step1Title')}</h2>
            <p className="text-sm text-[#6b7280]">{t('plan.wizard.step1Hint')}</p>
            <MemberChipSelector
              members={selectableMembers}
              selected={selectedMemberIds}
              onChange={setSelectedMemberIds}
            />
            {selectedMemberIds.length === 0 && (
              <p className="text-xs text-red-600">{t('plan.wizard.atLeastOneMember')}</p>
            )}
          </div>
        )}

        {/* Step 2: Date + duration */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-headline font-bold text-[#1A1A1A]">{t('plan.wizard.step2Title')}</h2>

            {conflictError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {conflictError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="start-date">{t('plan.wizard.startDate')}</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                min={TODAY}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('plan.wizard.duration')}</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {DURATION_PRESETS.map(d => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={durationDays === d}
                    onClick={() => setDurationDays(d)}
                    className={`
                      px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
                      ${durationDays === d
                        ? 'bg-[#4f46e5] text-white border-transparent'
                        : 'bg-white text-[#1A1A1A] border-[#e5e4e7] hover:border-[#4f46e5]'}
                    `}
                  >
                    {t('plan.wizard.durationDays', { count: d })}
                  </button>
                ))}
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={durationDays}
                    onChange={e => setDurationDays(Number(e.target.value))}
                    className="w-16 text-center"
                    aria-label={t('plan.wizard.durationCustom')}
                  />
                  <span className="text-sm text-[#6b7280]">{t('plan.wizard.days')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Meal slots */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-headline font-bold text-[#1A1A1A]">{t('plan.wizard.step3Title')}</h2>
            <p className="text-sm text-[#6b7280]">{t('plan.wizard.step3Hint')}</p>

            <div className="flex flex-col gap-2" role="group" aria-label={t('plan.wizard.mealSlotsLabel')}>
              {MEAL_TYPES.map(mt => {
                const checked = mealSlots.includes(mt)
                return (
                  <label
                    key={mt}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors
                      ${checked ? 'border-[#4f46e5] bg-[#eef2ff]' : 'border-[#e5e4e7] bg-white hover:border-[#4f46e5]/50'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMealSlot(mt)}
                      className="w-4 h-4 accent-[#4f46e5] rounded shrink-0"
                    />
                    <span className="text-sm font-medium text-[#1A1A1A]">
                      {t(`plan.mealTypes.${mt}`, mt)}
                    </span>
                  </label>
                )
              })}
            </div>

            {mealSlots.length === 0 && (
              <p className="text-xs text-red-600">{t('plan.wizard.atLeastOneMealSlot')}</p>
            )}

            {/* Plan name edit-in-place */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#e5e4e7]">
              <Label>{t('plan.wizard.planName')}</Label>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    placeholder={autoName}
                    autoFocus
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingName(false)}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!planName) setPlanName(autoName)
                    setEditingName(true)
                  }}
                  className="flex items-center gap-2 text-sm text-[#1A1A1A] hover:text-[#4f46e5] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] rounded"
                >
                  <span>{displayName || t('plan.wizard.autoNamePlaceholder')}</span>
                  <Pencil className="w-3.5 h-3.5 text-[#9ca3af]" aria-hidden />
                </button>
              )}
              <p className="text-xs text-[#9ca3af]">{t('plan.wizard.nameHint')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="md"
          onClick={() => step === 1 ? navigate(-1) : setStep((step - 1) as WizardStep)}
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 1 ? t('common.cancel') : t('common.back')}
        </Button>

        {step < 3 ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => setStep((step + 1) as WizardStep)}
            disabled={!canAdvance()}
          >
            {t('plan.wizard.next')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={submit}
            disabled={!canAdvance() || createMut.isPending}
          >
            {createMut.isPending ? (
              <>
                <Spinner className="w-4 h-4" />
                {t('plan.wizard.generating')}
              </>
            ) : (
              t('plan.wizard.generate')
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
