import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '.vite/**',
      '.cache/**',
    ],
  },
  // Node/tooling files (bench runner, configs)
  {
    files: ['bench/**/*.mjs', 'vite.config.ts', 'eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
        // Node 18+ provides fetch; ESLint globals set may not include it.
        fetch: 'readonly',
        WebSocket: 'readonly',
      },
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // Use TypeScript-aware lint rules
      ...tsPlugin.configs.recommended.rules,

      // React hooks rules
      ...reactHooks.configs.recommended.rules,

      // Avoid duplicate reports vs TypeScript compiler
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',

      // Reasonable defaults for Vite + Fast Refresh
      'react-refresh/only-export-components': 'off',

      // Guardrails
      // - prevent dependency cycles
      'import/no-cycle': ['error', { ignoreExternal: true }],

      // - enforce "public API only" for alias-based imports (index.ts entrypoints)
      //   (internal imports within a module can keep using relative paths during the migration)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@adapters/*',
            '@bench/*',
            '@components/*',
            '@core/*',
            '@gizmos/*',
            '@hooks/*',
            '@kernel/*',
            '@ports/*',
            '@renderer/*',
            '@store/*',
            '@utils/*',
          ],
        },
      ],

      // Project conventions (keep lint useful without forcing refactors)
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  // Dependency direction: kernel + ports must not depend on UI/WebGPU/Zustand.
  {
    files: ['src/kernel/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['react', 'react-dom', 'zustand'],
          patterns: [
            '@components',
            '@components/*',
            '@renderer',
            '@renderer/*',
            '@store',
            '@store/*',
            '@gizmos',
            '@gizmos/*',
            '@hooks',
            '@hooks/*',
            // Also block relative reach-ins to store adapters from kernel.
            '../components/*',
            '../renderer/*',
            '../store/*',
            '../gizmos/*',
            '../hooks/*',
          ],
        },
      ],
    },
  },
  {
    files: ['src/ports/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['react', 'react-dom', 'zustand'],
          patterns: [
            '@components',
            '@components/*',
            '@renderer',
            '@renderer/*',
            '@store',
            '@store/*',
            '@gizmos',
            '@gizmos/*',
            '@hooks',
            '@hooks/*',
            // Ports should not reach into implementations; keep them technology-agnostic.
            '../components/*',
            '../renderer/*',
            '../store/*',
            '../gizmos/*',
            '../hooks/*',
            '../adapters/*',
            '../kernel/*',
          ],
        },
      ],
    },
  },
];


