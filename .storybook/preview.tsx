/**
 * Storybook global preview — KALMIO-159
 *
 * Provides:
 *  - i18n (Hungarian as default, English as fallback) via the app's own i18n init
 *  - TanStack QueryClient with a short staleTime so stories that mock query
 *    data show something useful without hitting the real backend
 *
 * Components that depend on useQuery *must* provide their own mock handler
 * (via the `parameters.msw` addon or by passing data directly in story args).
 * The QueryClient here prevents the "No QueryClient set" error at mount time.
 */

import type { Preview } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import React from 'react'

// Bootstrap the shared i18n instance (same one the app uses)
import '../src/i18n/index'

// Import Tailwind styles so components render with the correct utility classes
import '../src/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Never retry in Storybook — failed queries should surface immediately
      retry: false,
      staleTime: 30_000,
    },
  },
})

function StoryProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const preview: Preview = {
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // Surface violations in the test UI without failing CI
      test: 'todo',
    },
  },
}

export default preview
