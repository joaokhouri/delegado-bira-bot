const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
    },
    rules: {},
  },
  {
    env: {
      node: true,
      es2021: true,
    },
  },
];
