module.exports = {
  rules: {
    'semi': ['warn', 'never'],
    'no-use-before-define': ['off'],
    "import/no-extraneous-dependencies": ["error", {"devDependencies": ["**/*.test.js"]}]
  },
  parser: 'babel-eslint',
  extends: 'airbnb',
  env: {
    jest: true
  }
};
