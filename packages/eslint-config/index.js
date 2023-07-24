module.exports = {
  parserOptions: {
    sourceType: "module",
  },
  env: {
    browser: true,
    es2021: true,
  },
  plugins: ["simple-import-sort", "import", "tailwindcss"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:tailwindcss/recommended",
    "plugin:@next/next/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  rules: {
    "import/no-named-as-default": "off",
    "no-console": "error",
    "import/namespace": "off",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "import/newline-after-import": "error",
    "import/no-duplicates": "error",
    "import/no-named-as-default-member": "off",
    "no-html-link-for-pages": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/simple-import-sort/exports": "off",
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "tailwindcss/classnames-order": "off",
    "tailwindcss/enforces-negative-arbitrary-values": "warn",
    "tailwindcss/enforces-shorthand": "warn",
    "tailwindcss/migration-from-tailwind-2": "warn",
    "tailwindcss/no-arbitrary-value": "off",
    "tailwindcss/no-custom-classname": "off",
    "tailwindcss/no-contradicting-classname": "error",
  },
  ignorePatterns: [
    "**/generated.ts",
    "**/node_modules/**",
    "**/.next/**",
    "**/__generated__/**",
    "**/lib/balancer-v2-monorepo/**",
    "**/lib/forge-std/**",
    "** /.vercel/ **",
  ],
};
