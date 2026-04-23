import type { Macros } from '@/types'

interface MacroRingProps {
  macros: Macros
  size?: number
}

export function MacroRing({ macros, size = 80 }: MacroRingProps) {
  const total = (macros.protein * 4) + (macros.fat * 9) + (macros.carbs * 4)
  if (total === 0) return null

  const proteinPct = (macros.protein * 4) / total
  const fatPct = (macros.fat * 9) / total
  const carbsPct = (macros.carbs * 4) / total

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const circumference = 2 * Math.PI * r
  const gap = 2

  const segments = [
    { color: '#F28C28', pct: proteinPct, label: 'P' },
    { color: '#4F7942', pct: fatPct, label: 'F' },
    { color: '#1A1A1A', pct: carbsPct, label: 'C' },
  ]

  let offset = 0
  const arcs = segments.map(seg => {
    const len = circumference * seg.pct - gap
    const arc = { ...seg, dasharray: `${Math.max(0, len)} ${circumference - Math.max(0, len)}`, dashoffset: -offset }
    offset += circumference * seg.pct
    return arc
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e4e7" strokeWidth={size * 0.1} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={size * 0.1}
          strokeDasharray={arc.dasharray}
          strokeDashoffset={arc.dashoffset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={size * 0.18} fontWeight="700" fill="#1A1A1A" fontFamily="Montserrat, sans-serif">
        {Math.round(macros.kcal)}
      </text>
      <text x={cx} y={cy + size * 0.2} textAnchor="middle" fontSize={size * 0.13} fill="#6b7280" fontFamily="Inter, sans-serif">
        kcal
      </text>
    </svg>
  )
}
