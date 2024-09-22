import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      '**/node_modules',
      '**/dist',
    ],
  },
  {
    files: [
      '**/*.mjs',
      '**/*.js',
      '**/*.ts',
    ],
    rules: {
      'comma-dangle': ['error', 'always-multiline'],
      indent: ['error', 2],
      quotes: ['error', 'single'],
      'no-multiple-empty-lines': 'error',
      'quote-props': ['error', 'as-needed'],
      semi: ['error'],
    },
  },
  {
    files: [
      '**/*.js',
      '**/*.mjs',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.mocha,
        ...globals.node,
      },
    },
  },
  {
    files: [
      '**/*.ts',
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.mocha,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
    },
  },
];
