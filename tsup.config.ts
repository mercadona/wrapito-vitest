import { defineConfig } from 'tsup'

export default defineConfig(options => ({
  entryPoints: {
    index: './src/index.ts',
    integration: './src/integration.ts',
  },
  outDir: 'dist',
  format: ['esm'],
  tsconfig: './tsconfig.json',
  clean: true,
  dts: true,
  minify: !options?.watch,
}))
