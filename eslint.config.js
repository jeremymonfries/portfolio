// @ts-check
import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**'],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    // Project-specific overrides.
    rules: {
      // Audit finding UX-11: images must have meaningful alt text.
      // Enforced at the schema level (src/content.config.ts) for content collections;
      // this catches any stray <img> usage in .astro files too.
      'astro/no-set-html-directive': 'error',
    },
  },
);
