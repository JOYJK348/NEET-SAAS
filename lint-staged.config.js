export default {
  '*.{ts,tsx}': [
    'pnpm exec eslint --fix',
    'pnpm exec prettier --write',
  ],
  '*.{js,jsx,mjs}': [
    'pnpm exec eslint --fix',
    'pnpm exec prettier --write',
  ],
  '*.{json,md,css,scss,yaml,yml}': [
    'pnpm exec prettier --write',
  ],
};
