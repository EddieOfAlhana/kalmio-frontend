/**
 * MoistureHistoryStrip stories — KALMIO-159
 *
 * MoistureHistoryStrip depends on useQuery(['momentum', 'history', days]).
 * Because there is no running backend in Storybook, we provide a static
 * QueryClient pre-seeded with fixture data so the story renders the fully
 * populated strip rather than the loading skeleton.
 *
 * Stories:
 *   - FourteenDayMixed   — 14 dots, realistic mix of all four bands
 *   - SevenDayMixed      — 7 dots (days prop = 7)
 *   - AllDry             — every dot in the DRY band
 *   - AllMoist           — every dot in the MOIST band
 *   - Loading            — forces the loading/skeleton state
 *   - Error              — forces the error state
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { MomentumHistoryEntry } from '@/types'
import { MoistureHistoryStrip } from './MoistureHistoryStrip'

// ─── Fixture helpers ──────────────────────────────────────────────────────────

/**
 * Build N consecutive ISO-date strings ending with today.
 */
function buildDates(n: number): string[] {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

type Band = MomentumHistoryEntry['band']
const BANDS_MIXED: Band[] = ['DRY', 'DRYING', 'MOIST', 'MOIST', 'SATURATED']

function makeMixedEntries(n: number): MomentumHistoryEntry[] {
  return buildDates(n).map((date, i) => ({
    date,
    band: BANDS_MIXED[i % BANDS_MIXED.length],
    current: 40 + (i % 5) * 12,
  }))
}

function makeUniformEntries(n: number, band: Band): MomentumHistoryEntry[] {
  return buildDates(n).map((date) => ({ date, band, current: 50 }))
}

// ─── QueryClient factories ────────────────────────────────────────────────────

/** Returns a QueryClient pre-seeded with fixture entries for the given day count. */
function seededClient(entries: MomentumHistoryEntry[]): QueryClient {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  qc.setQueryData(['momentum', 'history', entries.length], entries)
  return qc
}

/**
 * Returns a QueryClient whose default queryFn immediately throws, forcing every
 * query into the error state.
 */
function errorClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        queryFn: (): never => {
          throw new Error('Network error (Storybook forced error state)')
        },
      },
    },
  })
}

/** Returns a QueryClient with no seeded data and no default queryFn — queries stay pending. */
function pendingClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // No queryFn means the query stays in 'pending' state — skeleton shown.
        queryFn: () => new Promise(() => { /* never resolves */ }),
      },
    },
  })
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Diofa/MoistureHistoryStrip',
  component: MoistureHistoryStrip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A 14-day (configurable) soil-moisture history strip rendered as coloured dots. ' +
          'Each dot maps to a MoistureBand: DRY (amber), DRYING (tan), MOIST (green), SATURATED (dark green). ' +
          "Today's dot is scaled up and ringed. " +
          'Stories using real data are pre-seeded into the QueryClient — no backend required.',
      },
    },
  },
  argTypes: {
    days: {
      control: { type: 'number', min: 1, max: 30 },
      description: 'Number of days to display',
    },
    className: { control: 'text' },
  },
} satisfies Meta<typeof MoistureHistoryStrip>

export default meta
type Story = StoryObj<typeof meta>

// ─── Pre-built fixtures ───────────────────────────────────────────────────────

const mixedEntries14 = makeMixedEntries(14)
const mixedEntries7 = makeMixedEntries(7)
const dryEntries14 = makeUniformEntries(14, 'DRY')
const moistEntries14 = makeUniformEntries(14, 'MOIST')

// ─── Stories ─────────────────────────────────────────────────────────────────

export const FourteenDayMixed: Story = {
  name: '14 nap — vegyes sávok',
  args: { days: 14 },
  decorators: [
    (Story) => (
      <QueryClientProvider client={seededClient(mixedEntries14)}>
        <Story />
      </QueryClientProvider>
    ),
  ],
}

export const SevenDayMixed: Story = {
  name: '7 nap — vegyes sávok',
  args: { days: 7 },
  decorators: [
    (Story) => (
      <QueryClientProvider client={seededClient(mixedEntries7)}>
        <Story />
      </QueryClientProvider>
    ),
  ],
}

export const AllDry: Story = {
  name: 'Minden nap DRY',
  args: { days: 14 },
  decorators: [
    (Story) => (
      <QueryClientProvider client={seededClient(dryEntries14)}>
        <Story />
      </QueryClientProvider>
    ),
  ],
}

export const AllMoist: Story = {
  name: 'Minden nap MOIST',
  args: { days: 14 },
  decorators: [
    (Story) => (
      <QueryClientProvider client={seededClient(moistEntries14)}>
        <Story />
      </QueryClientProvider>
    ),
  ],
}

export const Loading: Story = {
  name: 'Betöltés (skeleton)',
  args: { days: 14 },
  decorators: [
    (Story) => (
      <QueryClientProvider client={pendingClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'The query is pending — the loading skeleton with pulsing dots is shown.',
      },
    },
  },
}

export const ErrorState: Story = {
  name: 'Hiba (error állapot)',
  args: { days: 14 },
  decorators: [
    (Story) => (
      <QueryClientProvider client={errorClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'The query throws immediately — the error string is rendered.',
      },
    },
  },
}
