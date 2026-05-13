import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Recipe } from '@/types'

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

/** Resolves the display photo URL for a recipe.
 *  Prefers the uploaded imageUrl; falls back to the legacy seed asset for the 5 shipped recipes. */
export function recipePhotoUrl(recipe: Pick<Recipe, 'id' | 'imageUrl'>): string {
  return recipe.imageUrl ?? `/assets/recipe-photos/${recipe.id}.png`
}
