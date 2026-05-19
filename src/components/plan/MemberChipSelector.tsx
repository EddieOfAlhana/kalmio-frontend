/**
 * MemberChipSelector — chip selector for picking family members in the plan wizard.
 *
 * Shows each member as a toggleable chip. Multi-select, no max beyond family cap.
 */
import { useTranslation } from 'react-i18next'
import { MEMBER_COLORS } from './memberColors'

export interface SelectableMember {
  id: string
  displayName: string
  isCurrentUser?: boolean
}

interface MemberChipSelectorProps {
  members: SelectableMember[]
  selected: string[]
  onChange: (ids: string[]) => void
}

export function MemberChipSelector({ members, selected, onChange }: MemberChipSelectorProps) {
  const { t } = useTranslation()

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('plan.wizard.membersLabel')}>
      {members.map((m, i) => {
        const isSelected = selected.includes(m.id)
        const color = MEMBER_COLORS[i % MEMBER_COLORS.length]
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => toggle(m.id)}
            aria-pressed={isSelected}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
              border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
              ${isSelected
                ? `${color} text-white border-transparent`
                : 'bg-white text-[#1A1A1A] border-[#e5e4e7] hover:border-[#4f46e5]'}
            `}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0
                ${isSelected ? 'bg-white/30' : color}`}
            >
              {m.displayName.slice(0, 1).toUpperCase()}
            </span>
            {m.displayName}
            {m.isCurrentUser && (
              <span className="text-[10px] opacity-70">({t('family.memberRow.you')})</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
