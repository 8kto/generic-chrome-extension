module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:jest/all',
    'plugin:prettier/recommended', // Make sure to put it last, so it gets the chance to override other configs
  ],
  settings: {
    'import/resolver': {
      'node': {
        'paths': ['src'],
        'extensions': ['.js', '.ts'],
      },
    },
  },
  parser: '@typescript-eslint/parser',
  plugins: ['only-error', 'jest', '@typescript-eslint'],
  env: {
    'browser': true,
    'es6': true,
    'jest/globals': true,
  },
  globals: {
    chrome: true,
    jest: true,
    process: true,
  },
  rules: {
    'curly': 'error',
    'no-var': 'error',
    'import/no-extraneous-dependencies': 'error',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../*'],
            message: 'Use absolute paths when importing from parent directory',
          },
        ],
      },
    ],
    'no-restricted-modules': [
      'error',
      {
        patterns: ['../*'],
      },
    ],
    'no-console': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-shadow': 'off',
    'jsx-a11y/no-autofocus': [
      'error',
      {
        'ignoreNonDOM': true,
      },
    ],
    'import/newline-after-import': 'error',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'newline-before-return': 'error',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    'jest/prefer-expect-assertions': 'off',
    'jest/require-hook': 'off',
    'jest/no-hooks': 'off',
    '@typescript-eslint/ban-ts-comment':'off',
    'jest/prefer-snapshot-hint': 'off'
  },
}
