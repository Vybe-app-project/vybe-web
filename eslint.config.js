import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

const browserFiles = [
  'src/**/*.{js,jsx}',
  'support-bootstrap.js',
  'support-client.js',
];
const testFiles = [
  '**/*.test.{js,jsx}',
  'src/setupTests.js',
];

export default [
  {
    ignores: [
      'build/**',
      'coverage/**',
      'node_modules/**',
      'public-build/**',
    ],
  },
  js.configs.recommended,
  {
    files: browserFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: ['src/**/*.{js,jsx}'],
  },
  {
    ...reactRefresh.configs.vite,
    files: ['src/**/*.{js,jsx}'],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    rules: {
      // Starting an abortable async resource load from an effect is intentional.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: [
      'src/components/ui/toaster.jsx',
      'src/context/**/*.jsx',
      'src/routing.jsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: [
      'eslint.config.js',
      'scripts/**/*.mjs',
      'vite.config.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: { sourceType: 'module' },
    },
  },
  {
    files: testFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
];
