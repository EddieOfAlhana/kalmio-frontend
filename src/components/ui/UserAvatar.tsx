import { cn } from '@/lib/utils'

const COLORS = [
  '#E8956D',
  '#7CC9A9',
  '#8B9DC3',
  '#C9956D',
  '#A89DC9',
  '#9DC9A8',
  '#C98B8B',
  '#8BB5C9',
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = s.charCodeAt(i) + ((h << 5) - h)
  }
  return Math.abs(h)
}

function initials(firstName?: string | null, lastName?: string | null, email?: string | null): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  if (firstName) return firstName[0].toUpperCase()
  if (email) return email[0].toUpperCase()
  return '?'
}

interface UserAvatarProps {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-2xl',
}

export function UserAvatar({ firstName, lastName, email, avatarUrl, size = 'md', className }: UserAvatarProps) {
  const seed = firstName || lastName || email || '?'
  const bg = COLORS[hash(seed) % COLORS.length]
  const label = initials(firstName, lastName, email)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        className={cn(
          'rounded-full object-cover shrink-0 select-none',
          sizeClasses[size],
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: bg }}
      aria-label={label}
    >
      {label}
    </div>
  )
}
