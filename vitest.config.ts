import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './config/setup.js',
      '/config/extend.ts',
      './config/polyfills.js',
    ],
    coverage: {
      provider: 'istanbul',
    },
  },
})
