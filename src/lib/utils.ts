import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined, currency = 'HUF'): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('hu-HU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export function formatMacro(value: number | null | undefined, unit = 'g'): string {
  if (value == null) return '—'
  return `${Number(value).toFixed(1)}${unit}`
}
