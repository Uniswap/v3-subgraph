require('@uniswap/eslint-config/load')

module.exports = {
  extends: ['@uniswap/eslint-config/node'],
  rules: {
    '@typescript-eslint/no-inferrable-types': 'off',
    'import/no-unused-modules': 'off',
    '@typescript-eslint/no-restricted-imports': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-this-alias': [
      'error',
      {
        allowDestructuring: true, // Allow `const { props, state } = this`; false by default
        allowedNames: [
          'self', // Allow `const self= this`; `[]` by default
        ],
      },
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          // Allow BigInt (uppercase)
          BigInt: false,
        },
      },
    ],
  },
  overrides: [
    {
      files: ['tests/**/*.ts'],
      settings: {
        jest: {
          version: 26,
        },
        // jest is added as a plugin in our org's eslint config, but we use
        // matchstick, and this would crash when linting matchstick files.
        'disable/plugins': ['jest'],
      },
    },
  ],
}
