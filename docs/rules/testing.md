---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "tests/**"
  - "vitest.config.ts"
  - "vitest.smoke.config.ts"
---

# Testing

The project uses **Vitest** with `environment: 'node'` (see [vitest.config.ts](../../vitest.config.ts)). **jsdom and `@testing-library/react` are NOT installed** — don't reach for them.

**Commands:**
```bash
pnpm test         # Watch mode
pnpm test:run     # Single run (use this in scripts/CI)
pnpm test:ui      # Vitest UI
```

**File conventions:**
- Co-locate tests next to source: `Foo.tsx` → `Foo.test.tsx`, `foo.ts` → `foo.test.ts`
- ⚠ **Under `pages/`, a test file must not start with `+`.** Vike loads every `+`-prefixed file there as a
  config file and fails the build on one that exports no `route`/`default` — so `+route.ts` is tested by
  `route.test.ts`, not `+route.test.ts`. `pnpm test:run` and `tsc` both pass either way; only `pnpm build`
  catches it.
- Vitest globals are enabled — import `describe`, `it`, `expect` from `'vitest'` explicitly (matches existing files like [lib/cloudflare-images.test.ts](../../lib/cloudflare-images.test.ts) and [server/error-utils.test.ts](../../server/error-utils.test.ts))

**Testing React components without jsdom:**

For component-level assertions (attributes, rendered markup), use `renderToStaticMarkup` from `react-dom/server` and search the returned HTML string. This runs in the node environment with no extra setup.

```tsx
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Image } from './Image'

it('emits a responsive srcSet for Cloudflare URLs', () => {
  const html = renderToStaticMarkup(
    <Image src="https://imagedelivery.net/acct/id/" alt="x" aspectRatio="video" />,
  )
  expect(html).toContain('video-800 800w')
  expect(html).not.toContain('srcset=')  // React SSR emits lowercase attrs
})
```

See [components/atoms/Image/Image.test.tsx](../../components/atoms/Image/Image.test.tsx) for a full example. Note that `useState`/`useMemo` work under SSR but `useEffect` does not run — plan assertions around the first-render state.

**Attribute casing caveat:** React 19 lowercases _some_ attributes (`srcSet` → `srcset`) but preserves others as-authored (`playsInline` stays `playsInline`). Don't assume one rule — when an attribute assertion fails, probe the actual `renderToStaticMarkup` output (e.g. a throwaway test that `console.log`s the HTML) and match what React really emits.

**What to test:**
- ✅ Pure utilities (logic, parsing, transforms) — fast and high-value
- ✅ Component contracts at the markup level (attributes, conditional children, accessibility markers)
- ⚠️ Interactive behavior (hover, focus, click handlers) — no DOM event simulation available; prefer Ladle for visual verification
- ❌ Don't add jsdom/RTL without discussing first — it's a larger config change

