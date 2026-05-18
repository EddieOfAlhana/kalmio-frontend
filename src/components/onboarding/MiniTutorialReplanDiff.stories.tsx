/**
 * MiniTutorialReplanDiff stories — KALMIO-166
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MiniTutorialReplanDiff } from './MiniTutorialReplanDiff'

const meta = {
  title: 'Onboarding/MiniTutorialReplanDiff',
  component: MiniTutorialReplanDiff,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tutorial 3 — "Ha közbeszól az élet, újrarendezem." ' +
          '4-frame animated preview: user marks a meal as skipped, system ' +
          'shows thinking indicator, rest-of-week reshuffles, diff narrative ' +
          'confirms the change. Auto-advances every 2.4 s; skippable.',
      },
    },
  },
  argTypes: {
    className: { control: 'text' },
  },
} satisfies Meta<typeof MiniTutorialReplanDiff>

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
