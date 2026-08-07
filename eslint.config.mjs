// Flat config ESLint 9.
//
// Aligné sur gold_server (mêmes règles Prettier, même socle typescript-eslint),
// à une exception près : `no-explicit-any` est ici en `warn` et non `off`.
// Le front compte ~67 `any`, presque tous nés de l'absence de typage des réponses
// GraphQL. Les passer en avertissement rend la dette visible sans bloquer le
// build ; le lot « contrat GraphQL typé » doit la faire fondre, après quoi la
// règle pourra passer en `error`.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // Les paramètres préfixés d'un underscore sont volontairement inutilisés.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  // Fichiers de configuration : ils s'exécutent sous Node, pas dans le
  // navigateur, et manipulent process.env.
  {
    files: ['*.config.{js,mjs,ts}', 'codegen.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettierRecommended,
);
