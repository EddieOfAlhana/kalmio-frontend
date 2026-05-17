/**
 * DiofaWidget stories — KALMIO-159
 *
 * Covers all 15 stage×moisture combinations (5 stages × 3 moisture bands).
 * Each story is a named export following the convention:
 *   {Stage}{Moisture}  e.g. MagDry, TermoWet
 *
 * Pattern mirrors DiofaPreview.tsx (the _preview route that predates Storybook).
 * When real SVG assets arrive (KALMIO-128/129) replace the placeholders in
 * DiofaWidget.tsx per the ASSET SWAP-IN SPOT comment — these stories need no changes.
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { DiofaWidget } from './DiofaWidget'
import type { DiofaStage, DiofaMoisture } from './DiofaWidget'

const meta = {
  title: 'Diofa/DiofaWidget',
  component: DiofaWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Walnut-tree (diófa) growth and soil-moisture widget. ' +
          'Accepts a `stage` (MAG | CSEMETE | SUHANG | FIATAL | TERMO) ' +
          'and a `moisture` (DRY | OK | WET) prop. ' +
          'All 15 combinations are shown below.',
      },
    },
  },
  argTypes: {
    stage: {
      control: 'select',
      options: ['MAG', 'CSEMETE', 'SUHANG', 'FIATAL', 'TERMO'] satisfies DiofaStage[],
      description: 'Fejlődési fázis (growth stage)',
    },
    moisture: {
      control: 'select',
      options: ['DRY', 'OK', 'WET'] satisfies DiofaMoisture[],
      description: 'Talajnedvesség (soil moisture)',
    },
    className: { control: 'text' },
  },
} satisfies Meta<typeof DiofaWidget>

export default meta
type Story = StoryObj<typeof meta>

// ─── MAG ─────────────────────────────────────────────────────────────────────

export const MagDry: Story = {
  name: 'MAG — DRY',
  args: { stage: 'MAG', moisture: 'DRY' },
}

export const MagOk: Story = {
  name: 'MAG — OK',
  args: { stage: 'MAG', moisture: 'OK' },
}

export const MagWet: Story = {
  name: 'MAG — WET',
  args: { stage: 'MAG', moisture: 'WET' },
}

// ─── CSEMETE ─────────────────────────────────────────────────────────────────

export const CsemeteDry: Story = {
  name: 'CSEMETE — DRY',
  args: { stage: 'CSEMETE', moisture: 'DRY' },
}

export const CsemeteOk: Story = {
  name: 'CSEMETE — OK',
  args: { stage: 'CSEMETE', moisture: 'OK' },
}

export const CsemeteWet: Story = {
  name: 'CSEMETE — WET',
  args: { stage: 'CSEMETE', moisture: 'WET' },
}

// ─── SUHANG ──────────────────────────────────────────────────────────────────

export const SuhangDry: Story = {
  name: 'SUHANG — DRY',
  args: { stage: 'SUHANG', moisture: 'DRY' },
}

export const SuhangOk: Story = {
  name: 'SUHANG — OK',
  args: { stage: 'SUHANG', moisture: 'OK' },
}

export const SuhangWet: Story = {
  name: 'SUHANG — WET',
  args: { stage: 'SUHANG', moisture: 'WET' },
}

// ─── FIATAL ──────────────────────────────────────────────────────────────────

export const FiatalDry: Story = {
  name: 'FIATAL — DRY',
  args: { stage: 'FIATAL', moisture: 'DRY' },
}

export const FiatalOk: Story = {
  name: 'FIATAL — OK',
  args: { stage: 'FIATAL', moisture: 'OK' },
}

export const FiatalWet: Story = {
  name: 'FIATAL — WET',
  args: { stage: 'FIATAL', moisture: 'WET' },
}

// ─── TERMO ───────────────────────────────────────────────────────────────────

export const TermoDry: Story = {
  name: 'TERMO — DRY',
  args: { stage: 'TERMO', moisture: 'DRY' },
}

export const TermoOk: Story = {
  name: 'TERMO — OK',
  args: { stage: 'TERMO', moisture: 'OK' },
}

export const TermoWet: Story = {
  name: 'TERMO — WET',
  args: { stage: 'TERMO', moisture: 'WET' },
}
