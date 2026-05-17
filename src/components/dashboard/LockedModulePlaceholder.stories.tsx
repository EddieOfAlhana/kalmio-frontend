/**
 * LockedModulePlaceholder stories — KALMIO-159
 *
 * One story per DashboardModuleId so reviewers can verify that the locked
 * state copy and unlock-stage label render correctly for every module.
 *
 * The component returns null when MODULE_UNLOCK_STAGE has no entry for the
 * given moduleId — currently all 13 module IDs are mapped so all stories
 * should render.
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { DashboardModuleId } from '@/types'
import { LockedModulePlaceholder } from './LockedModulePlaceholder'

const ALL_MODULE_IDS: DashboardModuleId[] = [
  'current-plan',
  'shopping-list',
  'fridge-basic',
  'diofa-widget',
  'points-counter',
  'prep-tasks',
  'grooming-prompt',
  'replan-diff',
  'weekly-summary',
  'off-plan-meals',
  'macro-tracker',
  'taste-signals',
  'achievements',
]

const meta = {
  title: 'Dashboard/LockedModulePlaceholder',
  component: LockedModulePlaceholder,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Anticipatory empty-state shown in place of a dashboard module the user has ' +
          'not yet unlocked. Shows the module title (faded), a lock icon, and a hint ' +
          'about what triggers the unlock. No paywall language — this is anticipation, ' +
          'not gatekeeping. One story per DashboardModuleId.',
      },
    },
  },
  argTypes: {
    moduleId: {
      control: 'select',
      options: ALL_MODULE_IDS,
      description: 'A modul azonosítója',
    },
  },
} satisfies Meta<typeof LockedModulePlaceholder>

export default meta
type Story = StoryObj<typeof meta>

// ─── One story per module ─────────────────────────────────────────────────────

export const CurrentPlan: Story = {
  name: 'current-plan',
  args: { moduleId: 'current-plan' },
}

export const ShoppingList: Story = {
  name: 'shopping-list',
  args: { moduleId: 'shopping-list' },
}

export const FridgeBasic: Story = {
  name: 'fridge-basic',
  args: { moduleId: 'fridge-basic' },
}

export const DiofaWidgetModule: Story = {
  name: 'diofa-widget',
  args: { moduleId: 'diofa-widget' },
}

export const PointsCounter: Story = {
  name: 'points-counter',
  args: { moduleId: 'points-counter' },
}

export const PrepTasks: Story = {
  name: 'prep-tasks',
  args: { moduleId: 'prep-tasks' },
}

export const GroomingPrompt: Story = {
  name: 'grooming-prompt',
  args: { moduleId: 'grooming-prompt' },
}

export const ReplanDiff: Story = {
  name: 'replan-diff',
  args: { moduleId: 'replan-diff' },
}

export const WeeklySummary: Story = {
  name: 'weekly-summary',
  args: { moduleId: 'weekly-summary' },
}

export const OffPlanMeals: Story = {
  name: 'off-plan-meals',
  args: { moduleId: 'off-plan-meals' },
}

export const MacroTracker: Story = {
  name: 'macro-tracker',
  args: { moduleId: 'macro-tracker' },
}

export const TasteSignals: Story = {
  name: 'taste-signals',
  args: { moduleId: 'taste-signals' },
}

export const Achievements: Story = {
  name: 'achievements',
  args: { moduleId: 'achievements' },
}

// ─── All modules in one canvas ────────────────────────────────────────────────

/** All 13 modules rendered in a single scrollable canvas for quick comparison */
export const AllModules: Story = {
  name: 'Összes modul egyszerre',
  args: { moduleId: 'current-plan' },
  render: () => (
    <div className="space-y-2 w-full max-w-sm">
      {ALL_MODULE_IDS.map((id) => (
        <LockedModulePlaceholder key={id} moduleId={id} />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Mind a 13 modul egy képernyőn — gyors összehasonlításhoz.',
      },
    },
  },
}
