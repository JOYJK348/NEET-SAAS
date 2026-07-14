export default {
  'apps/api/**/*.{ts,tsx}': [
    'pnpm exec eslint --config apps/api/eslint.config.mjs --fix',
    'pnpm exec prettier --write',
  ],
  'apps/web/**/*.{ts,tsx}': ['pnpm exec prettier --write'],
  '*.{js,jsx,mjs,cjs}': ['pnpm exec prettier --write'],
  '*.{json,md,css,scss,yaml,yml}': ['pnpm exec prettier --write'],
};
