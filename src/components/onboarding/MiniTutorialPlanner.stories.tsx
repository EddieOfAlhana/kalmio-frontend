/**
 * MiniTutorialPlanner stories — KALMIO-166
 *
 * Three stories: auto-playing default, and two forced frames for snapshot review.
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MiniTutorialPlanner } from './MiniTutorialPlanner'

const meta = {
  title: 'Onboarding/MiniTutorialPlanner',
  component: MiniTutorialPlanner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tutorial 1 — "Így néz ki egy heted." ' +
          '4-frame animated preview of the weekly meal planner: meals reshuffling, ' +
          'one card replaced, diff row confirming the change. ' +
          'Auto-advances every 2.2 s; skippable via the "Értem" button.',
      },
    },
  },
  argTypes: {
    className: { control: 'text' },
  },
} satisfies Meta<typeof MiniTutorialPlanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Auto-play',
  args: {
    onSkip: () => { /* no-op in Storybook */ },
  },
}

export const WithContainer: Story = {
  name: 'In 375 px container (mobile)',
  args: {
    onSkip: () => { /* no-op */ },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 375, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
}
