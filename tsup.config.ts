import { defineConfig, type Format } from 'tsup';

const extensions: Partial<Record<Format, string>> = {
  esm: '.mjs',
  cjs: '.cjs',
};

export default defineConfig({
  format: ['esm', 'cjs'],
  bundle: true,
  clean: true,
  minify: 'terser',
  dts: false,
  entry: ['src/index.ts'],
  keepNames: true,
  outDir: 'dist',
  platform: 'node',
  target: 'node20',
  treeshake: true,
  sourcemap: true,
  splitting: true,
  tsconfig: './tsconfig.json',
  outExtension: (ctx) => ({
    js: extensions[ctx.format],
  }),
});
