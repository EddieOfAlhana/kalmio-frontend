import { describe, it, expect } from 'vitest'
import { getRecipeName, getRecipeSteps, getRecipeNameFromTranslations } from './i18nRecipe'
import type { Recipe, RecipeTranslations } from '@/types'

// Minimal recipe factory — only the fields the helpers care about.
function recipe(
  name: string,
  translations: Recipe['translations'] = null,
): Pick<Recipe, 'name' | 'steps' | 'translations'> {
  return { name, steps: [`${name} step`], translations }
}

const huOnly: Recipe['translations'] = { hu: { name: 'Magyar neve', steps: ['HU lépés'] }, en: null }
const enOnly: Recipe['translations'] = { hu: null, en: { name: 'English name', steps: ['EN step'] } }
const both: Recipe['translations'] = {
  hu: { name: 'Magyar neve', steps: ['HU lépés'] },
  en: { name: 'English name', steps: ['EN step'] },
}

describe('getRecipeName', () => {
  it('returns the hu translation when lang=hu and both are present', () => {
    expect(getRecipeName(recipe('Canonical', both), 'hu')).toBe('Magyar neve')
  })

  it('returns the en translation when lang=en and both are present', () => {
    expect(getRecipeName(recipe('Canonical', both), 'en')).toBe('English name')
  })

  it('falls back to hu when lang=en but en translation is missing', () => {
    expect(getRecipeName(recipe('Canonical', huOnly), 'en')).toBe('Magyar neve')
  })

  it('falls back to en when lang=hu but hu translation is missing', () => {
    expect(getRecipeName(recipe('Canonical', enOnly), 'hu')).toBe('English name')
  })

  it('falls back to recipe.name when no translations exist', () => {
    expect(getRecipeName(recipe('Canonical', null), 'hu')).toBe('Canonical')
  })

  it('returns empty string for null recipe', () => {
    expect(getRecipeName(null, 'hu')).toBe('')
  })

  it('returns empty string for undefined recipe', () => {
    expect(getRecipeName(undefined, 'hu')).toBe('')
  })
})

describe('getRecipeSteps', () => {
  it('returns hu steps when lang=hu', () => {
    expect(getRecipeSteps(recipe('X', both), 'hu')).toEqual(['HU lépés'])
  })

  it('returns en steps when lang=en', () => {
    expect(getRecipeSteps(recipe('X', both), 'en')).toEqual(['EN step'])
  })

  it('falls back to recipe.steps when no translations exist', () => {
    expect(getRecipeSteps(recipe('X', null), 'hu')).toEqual(['X step'])
  })
})

describe('getRecipeNameFromTranslations', () => {
  const t: RecipeTranslations = {
    hu: { name: 'Magyar', steps: [] },
    en: { name: 'English', steps: [] },
  }

  it('returns hu name when lang=hu', () => {
    expect(getRecipeNameFromTranslations(t, 'Fallback', 'hu')).toBe('Magyar')
  })

  it('returns en name when lang=en', () => {
    expect(getRecipeNameFromTranslations(t, 'Fallback', 'en')).toBe('English')
  })

  it('returns fallbackName when translations is null', () => {
    expect(getRecipeNameFromTranslations(null, 'Fallback', 'hu')).toBe('Fallback')
  })

  it('falls back to hu when en translation is absent', () => {
    const huOnlyT: RecipeTranslations = { hu: { name: 'Magyar', steps: [] }, en: null }
    expect(getRecipeNameFromTranslations(huOnlyT, 'Fallback', 'en')).toBe('Magyar')
  })
})
