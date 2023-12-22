import { defineConfig } from 'tsup'

export default defineConfig(options => ({
  entryPoints: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  tsconfig: './tsconfig.json',
  clean: true,
  dts: true,
  minify: !options?.watch,
}))
