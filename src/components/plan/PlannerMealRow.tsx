/**
 * PlannerMealRow — one recipe row inside a day card.
 *
 * Shows:
 * - Slot badge (Ebéd / Vacsora / etc.)
 * - Recipe name + macros + portion multiplier
 * - Member chips (right side, max 5 + overflow)
 * - Batch-cook leftover badge
 * - Sub-row for divergent members ("Something else") — expandable on mobile
 * - Eye / edit / overflow-menu icons
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, Pencil, MoreHorizontal, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { MemberChip, OverflowChip } from './MemberChip'
import { MEMBER_COLORS } from './memberColors'
import { MealRationalePanel } from './MealRationalePanel'
import type { PlannedMealSummary, MealType } from '@/types'

const MAX_CHIPS = 5

interface PlannerMealRowProps {
  meal: PlannedMealSummary
  allMemberIds: string[]
  memberNames: Record<string, string>
  /** Member IDs with a divergent meal choice — shown in sub-row */
  divergentMemberIds?: string[]
  onViewRecipe?: (recipeId: string) => void
  onEditSlot?: (mealId: string) => void
}

export function PlannerMealRow({
  meal,
  allMemberIds,
  memberNames,
  divergentMemberIds = [],
  onViewRecipe,
  onEditSlot,
}: PlannerMealRowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [subRowOpen, setSubRowOpen] = useState(false)
  const [rationaleOpen, setRationaleOpen] = useState(false)

  const visibleChips = allMemberIds.filter(id => !divergentMemberIds.includes(id)).slice(0, MAX_CHIPS)
  const overflow = allMemberIds.filter(id => !divergentMemberIds.includes(id)).length - MAX_CHIPS

  const mealTypeLabel = (mt: MealType) => t(`plan.mealTypes.${mt}`, mt)

  const kcal = meal.macros?.kcal ?? null
  const protein = meal.macros?.protein ?? null

  return (
    <div className="flex flex-col">
      {/* Main row */}
      <div className="flex items-center gap-2 py-2 px-3 hover:bg-[#f9f9fb] rounded-lg transition-colors">
        {/* Slot badge */}
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280] bg-[#f3f4f6] rounded px-1.5 py-0.5 w-14 text-center">
          {mealTypeLabel(meal.mealType)}
        </span>

        {/* Recipe info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-sm text-[#1A1A1A] truncate">
              {meal.recipeName ?? t('plan.planner.noRecipe')}
            </span>
            {meal.isBatchCookLeftover && (
              <span className="shrink-0 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {t('plan.planner.leftover')}
              </span>
            )}
          </div>
          <div className="text-xs text-[#9ca3af] flex gap-2 mt-0.5 flex-wrap">
            {kcal !== null && <span>{kcal} kcal</span>}
            {protein !== null && <span>{protein}g P</span>}
            <span>×{meal.servingMultiplier.toFixed(1)} {t('plan.planner.servings')}</span>
          </div>
        </div>

        {/* Member chips */}
        <div className="flex items-center gap-0.5 shrink-0">
          {visibleChips.map((uid, i) => (
            <MemberChip
              key={uid}
              name={memberNames[uid] ?? uid}
              colorClass={MEMBER_COLORS[i % MEMBER_COLORS.length]}
              size="sm"
            />
          ))}
          {overflow > 0 && <OverflowChip count={overflow} />}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0 text-[#9ca3af]">
          <button
            type="button"
            aria-label={t('plan.rationale.toggle')}
            aria-expanded={rationaleOpen}
            onClick={() => setRationaleOpen(o => !o)}
            className={`p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] transition-colors ${
              rationaleOpen ? 'text-[#F28C28]' : 'hover:text-[#F28C28]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>
          {meal.recipeId && onViewRecipe && (
            <button
              type="button"
              aria-label={t('plan.planner.viewRecipe')}
              onClick={() => onViewRecipe(meal.recipeId!)}
              className="p-1 hover:text-[#4f46e5] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onEditSlot && (
            <button
              type="button"
              aria-label={t('plan.planner.editSlot')}
              onClick={() => onEditSlot(meal.id)}
              className="p-1 hover:text-[#4f46e5] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {divergentMemberIds.length > 0 && (
            <button
              type="button"
              aria-label={t('plan.planner.toggleSplit')}
              aria-expanded={subRowOpen}
              onClick={() => setSubRowOpen(o => !o)}
              className="p-1 hover:text-[#4f46e5] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            >
              {subRowOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button
            type="button"
            aria-label={t('plan.planner.moreOptions')}
            className="p-1 hover:text-[#4f46e5] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rationale panel — lazy-fetched on first open */}
      <MealRationalePanel
        plannedMealId={meal.id}
        recipeId={meal.recipeId}
        open={rationaleOpen}
        onStartCooking={recipeId => navigate(`/app/recipes/${recipeId}/cook`)}
      />

      {/* Sub-rows for divergent members */}
      {subRowOpen && divergentMemberIds.length > 0 && (
        <div className="ml-6 border-l-2 border-red-200 pl-3 flex flex-col gap-1 pb-1">
          {divergentMemberIds.map((uid, i) => (
            <div
              key={uid}
              className="flex items-center gap-2 py-1.5 px-2 bg-red-50 rounded text-sm"
            >
              <MemberChip
                name={memberNames[uid] ?? uid}
                colorClass={MEMBER_COLORS[i % MEMBER_COLORS.length]}
                size="sm"
              />
              <span className="text-red-700 font-medium text-xs flex-1">
                {t('plan.planner.divergentLabel', { name: memberNames[uid] ?? uid })}
              </span>
              <span className="text-xs text-red-500 italic">
                {t('plan.planner.unresolvedHint')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
