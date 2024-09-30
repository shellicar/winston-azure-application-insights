import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['esm', 'cjs'],
  bundle: true,
  clean: true,
  minify: 'terser',
  dts: true,
  entry: ['src/index.ts'],
  keepNames: true,
  outDir: 'dist',
  platform: 'node',
  target: 'node20',
  treeshake: true,
  sourcemap: true,
  splitting: true,
  tsconfig: './tsconfig.json',
});
