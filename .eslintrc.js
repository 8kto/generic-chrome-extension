module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended', // Make sure to put it last, so it gets the chance to override other configs
  ],
  parser: 'esprima',
  plugins: ['only-error'],
  env: {
    'browser': true,
    'es6': true,
  },
  globals: {
    chrome: true,
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
    'no-unused-vars': ['error', { 'ignoreRestSiblings': true }],
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
  },
}
