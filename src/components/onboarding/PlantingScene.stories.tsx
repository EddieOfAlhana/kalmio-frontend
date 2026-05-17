/**
 * PlantingScene stories — KALMIO-159
 *
 * Covers all 11 onboarding steps (0–10). Each story freezes the scene at that
 * step so reviewers can inspect each cumulative state without running through
 * the full onboarding flow.
 *
 * Step → scene mapping (from PlantingScene.tsx inline docs):
 *   0  Welcome            — Hand + walnut above soil
 *   1  Household size     — Hole dug; hand lowers
 *   2  Activity/calories  — Walnut placed in hole
 *   3  Dietary flags      — First handful of soil covers walnut
 *   4  Shopping cadence   — Soil mound formed and patted
 *   5  Forbidden ingr.    — Wooden name stake placed
 *   6  Taste swipe        — Stones, leaf, soil moisture details
 *   7  Loading (plan gen) — Watering can tilted, first drops fall
 *   8  Plan reveal        — Soil dark and moist; seed fully planted
 *   9  User accepts plan  — Mag stage ring pulses
 *  10  First action       — Csemete sprout: two cotyledon leaves
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { PlantingStep } from './PlantingScene'
import { PlantingScene } from './PlantingScene'

const STEP_NAMES: Record<PlantingStep, string> = {
  0:  'Lépés 0 — Üdvözlő képernyő',
  1:  'Lépés 1 — Háztartás mérete',
  2:  'Lépés 2 — Aktivitás és kalória',
  3:  'Lépés 3 — Étkezési megszorítások',
  4:  'Lépés 4 — Bevásárlási ritmus',
  5:  'Lépés 5 — Tiltott hozzávalók',
  6:  'Lépés 6 — Ízlés swipe',
  7:  'Lépés 7 — Tervgenerálás (töltés)',
  8:  'Lépés 8 — Első terv megjelenítése',
  9:  'Lépés 9 — Felhasználó elfogadja a tervet',
  10: 'Lépés 10 — Első cselekvés (Csemete)',
}

const meta = {
  title: 'Onboarding/PlantingScene',
  component: PlantingScene,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Animated walnut-planting scene that builds up incrementally as ' +
          'the user advances through onboarding (steps 0–10). ' +
          'Each story freezes the scene at a specific step with `reducedMotion` ' +
          'disabled so the Storybook canvas is static and inspectable. ' +
          'Set `reducedMotion: false` in the Controls panel to see live animations.',
      },
    },
  },
  argTypes: {
    step: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Jelenlegi onboarding lépés (0–10)',
    },
    reducedMotion: {
      control: 'boolean',
      description: 'Animációk letiltása (prefers-reduced-motion szimulációja)',
    },
    className: { control: 'text' },
  },
} satisfies Meta<typeof PlantingScene>

export default meta
type Story = StoryObj<typeof meta>

function makeStep(step: PlantingStep): Story {
  return {
    name: STEP_NAMES[step],
    args: { step, reducedMotion: false },
  }
}

export const Step0:  Story = makeStep(0)
export const Step1:  Story = makeStep(1)
export const Step2:  Story = makeStep(2)
export const Step3:  Story = makeStep(3)
export const Step4:  Story = makeStep(4)
export const Step5:  Story = makeStep(5)
export const Step6:  Story = makeStep(6)
export const Step7:  Story = makeStep(7)
export const Step8:  Story = makeStep(8)
export const Step9:  Story = makeStep(9)
export const Step10: Story = makeStep(10)

/** Interactive playground — use Controls panel to advance step by step */
export const Playground: Story = {
  name: 'Playground — lépés szabadon állítható',
  args: { step: 0, reducedMotion: false },
  parameters: {
    docs: {
      description: {
        story:
          'Use the Controls panel to set `step` (0–10) and advance the scene manually.',
      },
    },
  },
}
