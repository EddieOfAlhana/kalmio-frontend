import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'orange' | 'gray' | 'black' | 'amber' | 'red'
}

export function Badge({ variant = 'gray', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold tracking-wide',
        {
          'bg-[#4F7942]/15 text-[#4F7942]': variant === 'green',
          'bg-[#F28C28]/15 text-[#F28C28]': variant === 'orange',
          'bg-[#1A1A1A] text-white': variant === 'black',
          'bg-gray-100 text-gray-600': variant === 'gray',
          'bg-[#F59E0B]/15 text-[#B45309]': variant === 'amber',
          'bg-[#EF4444]/15 text-[#B91C1C]': variant === 'red',
        },
        className
      )}
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      {...props}
    />
  )
}
