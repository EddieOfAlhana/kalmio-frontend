/**
 * MiniTutorialGrooming stories — KALMIO-166
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MiniTutorialGrooming } from './MiniTutorialGrooming'

const meta = {
  title: 'Onboarding/MiniTutorialGrooming',
  component: MiniTutorialGrooming,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tutorial 2 — "Mielőtt új hetet tervezel, gyorsan átnézzük a hűtődet." ' +
          '4-frame animated preview of the pre-plan fridge-grooming ritual: ' +
          'fridge items shown, keep / toss decisions applied, plan recomputes. ' +
          'Auto-advances every 2.2 s; skippable via the "Értem" button.',
      },
    },
  },
  argTypes: {
    className: { control: 'text' },
  },
} satisfies Meta<typeof MiniTutorialGrooming>

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
