import nextConfig from 'eslint-config-next';
import tseslint from 'typescript-eslint';
import eslintComments from 'eslint-plugin-eslint-comments';
import importNewlines from 'eslint-plugin-import-newlines';
import prettierConfig from 'eslint-config-prettier';

const typeCheckedRules = tseslint.configs.recommended
  .filter((config) => config.rules)
  .reduce((rules, config) => ({ ...rules, ...config.rules }), {});

export default [
  {
    ignores: ['node_modules', '.next', 'out', 'dist'],
  },
  ...nextConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: typeCheckedRules,
  },
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'eslint-comments': eslintComments,
      'import-newlines': importNewlines,
    },
    rules: {
      ...eslintComments.configs.recommended.rules,

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-use-before-define': ['error'],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      'arrow-parens': ['error', 'always'],
      camelcase: 'off',
      'consistent-return': 'off',
      'global-require': 'off',
      'implicit-arrow-linebreak': 'off',
      'import/extensions': 'off',
      'import/no-dynamic-require': 'off',
      'import/prefer-default-export': 'off',
      indent: 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'max-len': ['error', 140],
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'no-nested-ternary': 'off',
      'no-param-reassign': [
        'error',
        {
          props: true,
          ignorePropertyModificationsFor: ['state'],
        },
      ],
      'no-plusplus': 'off',
      'no-restricted-globals': 'off',
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'no-void': 'off',
      'object-curly-newline': [
        'error',
        {
          multiline: true,
          consistent: true,
        },
      ],
      'padded-blocks': ['error', 'never'],
      'prefer-destructuring': 'off',
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: true,
        },
      ],
      'react/jsx-filename-extension': [
        'error',
        {
          extensions: ['.tsx', '.jsx', '.js'],
        },
      ],
      'react/jsx-one-expression-per-line': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/no-array-index-key': 'off',
      'react/no-danger': 'off',
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react/require-default-props': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-key': [
        'error',
        {
          checkFragmentShorthand: true,
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['default'],
            },
          ],
        },
      ],
      '@next/next/no-html-link-for-pages': 'off',
      'react/function-component-definition': 'off',

      // New React Compiler-oriented rules added in eslint-plugin-react-hooks v7's
      // recommended config; not previously enforced, would require a separate cleanup pass
      'react-hooks/refs': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  prettierConfig,
];
