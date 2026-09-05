---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "tests/**"
  - "vitest.config.ts"
  - "vitest.smoke.config.ts"
---

# Testing

The project uses Vitest with `environment: 'node'` (see [vitest.config.ts](../../vitest.config.ts)).
jsdom and `@testing-library/react` are not installed. Do not reach for them.

**Commands:**
```bash
pnpm test         # Watch mode
pnpm test:run     # Single run (use this in scripts and CI)
pnpm test:ui      # Vitest UI
```

**File conventions:**
- Put each test next to its source file: `Foo.tsx` → `Foo.test.tsx`, `foo.ts` → `foo.test.ts`.
- Under `pages/`, a test file must not start with `+`. Vike loads every `+`-prefixed file there as
  a config file, and fails the build when one exports no `route` and no `default`. Test
  `+route.ts` as `route.test.ts`, never as `+route.test.ts`. `pnpm test:run` and `tsc` both pass
  either way — only `pnpm build` catches this.
- `vitest.config.ts` enables Vitest's globals. Import `describe`, `it`, and `expect` from
  `'vitest'` explicitly, to
  match existing files such as [lib/cloudflare-images.test.ts](../../lib/cloudflare-images.test.ts)
  and [server/error-utils.test.ts](../../server/error-utils.test.ts).

**Test a React component without jsdom:**

Use `renderToStaticMarkup` from `react-dom/server` and search the returned HTML string. This runs
in the `node` environment, with no extra setup.

```tsx
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Image } from './Image'

it('emits a responsive srcSet for Cloudflare URLs', () => {
  const html = renderToStaticMarkup(
    <Image src="https://imagedelivery.net/acct/id/" alt="x" aspectRatio="video" />,
  )
  expect(html).toContain('video-800 800w')
  expect(html).not.toContain('srcset=') // React SSR emits lowercase attributes
})
```

See [components/atoms/Image/Image.test.tsx](../../components/atoms/Image/Image.test.tsx) for a
full example. `useState` and `useMemo` work under this kind of SSR render, but `useEffect` does
not run — plan each assertion around the first-render state.

**Attribute casing**: React 19 lowercases some attributes (`srcSet` becomes `srcset`) and keeps
others as authored (`playsInline` stays `playsInline`). Do not assume one rule for every
attribute. When an assertion on an attribute fails, log the actual `renderToStaticMarkup` output
in a throwaway test and match what React really emits.

**What to test:**
- Test pure utilities — logic, parsing, transforms. This is fast and high-value.
- Test a component's markup contract — attributes, conditional children, accessibility markers.
- Prefer Ladle for interactive behavior (hover, focus, click). No DOM event simulation is
  available here.
- Do not add jsdom or RTL without a discussion first. It is a larger configuration change.
