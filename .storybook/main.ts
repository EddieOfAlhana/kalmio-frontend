/**
 * Storybook main config — KALMIO-159
 *
 * Uses @storybook/react-vite which inherits vite.config.ts automatically.
 * The `viteFinal` hook strips vite-plugin-pwa from the Storybook build to avoid
 * the service-worker precache size limit error (PWA SW is irrelevant in Storybook).
 * All five sub-plugins registered by VitePWA are removed by prefix match.
 */

import type { StorybookConfig } from '@storybook/react-vite'
import type { Plugin } from 'vite'

function isNotPwaPlugin(plugin: Plugin | null | undefined | false): boolean {
  if (!plugin) return false
  const name = (plugin as Plugin).name ?? ''
  return !name.startsWith('vite-plugin-pwa')
}

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/react-vite',

  async viteFinal(config) {
    if (config.plugins) {
      // Flatten one level deep — VitePWA returns an array of plugin objects.
      // Each element may itself be an array (Vite allows nested plugin arrays).
      config.plugins = config.plugins
        .flatMap((p) => (Array.isArray(p) ? p : [p]))
        .filter(isNotPwaPlugin)
    }
    return config
  },
}

export default config
