import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./config/polyfills.js', './config/jest.setup.js'],
        coverage: {
          provider: 'istanbul'
        }
    }
})
