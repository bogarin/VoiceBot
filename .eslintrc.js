module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "standard",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "prettier/@typescript-eslint",
    "prettier/standard"
  ],
  plugins: [
    "@typescript-eslint",
    "@typescript-eslint/tslint",
    "prettier",
    "standard"
  ],
  rules: {}
};
