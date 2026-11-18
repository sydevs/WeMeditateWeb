/**
 * `index.js` is plain JS so `eslint.config.js` can load it, and `tsconfig.json`
 * sets no `allowJs`. This is what `index.test.ts` imports.
 */

import type { Rule } from 'eslint'

export declare const rules: {
  'image-aspect-ratio': Rule.RuleModule
  'img-loading': Rule.RuleModule
}
