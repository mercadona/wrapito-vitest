import { defineConfig } from 'tsup'

export default defineConfig(options => ({
  entryPoints: {
    index: './src/index.ts',
    integration: './src/integration.ts',
  },
  outDir: 'dist',
  format: ['cjs', 'esm'],
  tsconfig: './tsconfig.json',
  clean: true,
  dts: true,
  minify: !options?.watch,
  outExtension: ({ format }) => ({
    js: format === 'cjs' ? '.js' : '.mjs',
  }),
}))
