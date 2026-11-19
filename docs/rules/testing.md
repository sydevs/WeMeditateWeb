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
A file that needs a DOM — a click, an effect, a state change after mount — opts into jsdom
(see **Test interaction with jsdom** below).

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
- Give a helper a `use` prefix only when it calls hooks. `@eslint-react` errors on a
  `use`-prefixed function that calls none, which reaches the compiler-API helpers under
  `tests/guards/`.
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
    <Image src="https://imagedelivery.net/acct/id/public" alt="x" aspectRatio="video" />,
  )
  expect(html).toContain('width=800 800w')
  expect(html).toContain('srcSet=') // React keeps this attribute camelCase
})
```

**Spell a SahajCloud URL the way SahajCloud sends it** — `…/<image_id>/public`, with the variant
segment. A bare `…/<image_id>/` is a shape no read produces, and a fixture using it is how #141
kept the whole responsive-image pipeline green while it was dead.

See [components/atoms/Image/Image.test.tsx](../../components/atoms/Image/Image.test.tsx) for a
full example. `useState` and `useMemo` work under this kind of SSR render, but `useEffect` does
not run — plan each assertion around the first-render state.

**A `ref` never attaches either**, and it is not an attribute, so it reaches neither the callback
nor the HTML. Where a ref is the thing under test, assert the type by rendering with one and let
`tsc` judge it, and read the wiring from the source —
[tests/guards/form-atom-refs.test.tsx](../../tests/guards/form-atom-refs.test.tsx) does both.

**Narrow the string before asserting an attribute.** `toContain('target="_blank"')` over a whole
page passes when any element carries it, not the one under test.
[tests/_helpers/markup.ts](../../tests/_helpers/markup.ts) holds the primitives that narrow it,
and they are the whole vocabulary — a hand-written regex over the markup belongs in one of them
instead:

| Primitive | Keyed on | Answers |
| --- | --- | --- |
| `anchorFor(html, href)` | an href the test passed in | that link's opening `<a>` tag |
| `tagFor(html, tag, attr)` | the tag, plus attribute text that narrows it | that element's opening tag |
| `classFor(html, class)` | one class naming the element | that element's class list |
| `classesWith(html, class)` | one class | every such list, so a count is assertable |
| `classOf(html, marker)` | an opening tag (`'<nav'`) or the element's own text | that element's class list |

Assert something positive about the result first: each answers the empty string, or no entries,
when nothing matches, and `not.toContain` passes on that whatever it is given.

**Name an element by one class, never by two sitting together.** Nothing in this repo fixes the
order of a class list — there is no `prettier-plugin-tailwindcss` here, and `perfectionist` sorts
JSX props rather than the classes inside one — so `max-w-3xl flex-1` pins an adjacency the next
edit to that list breaks. Where no single class names the element, name the element: `classOf`
takes its tag or its text, as `anchorFor` takes its href.

**Split a class list before asserting membership.** These answer a space-separated string, so
`toContain('order-1')` also passes on `order-10`, and `toContain('opacity-0')` on
`after:opacity-0`. `expect(list.split(' ')).toContain('order-1')` matches the whole class.

**Attribute casing**: React 19 keeps most camelCase props as authored — `srcSet`,
`fetchPriority`, `referrerPolicy` and `playsInline` all survive — and lowercases a few, such as
`crossOrigin` to `crossorigin`. Do not assume one rule for every attribute.

This makes the wrong casing a *silent* failure rather than a red test: `not.toContain('srcset=')`
passes whether or not a srcSet was emitted, so it asserts nothing. Match the authored casing.
When an assertion on an attribute fails, log the actual `renderToStaticMarkup` output in a
throwaway test and match what React really emits.

**Test interaction with jsdom:**

Make `// @vitest-environment jsdom` the file's first line, then render with
`@testing-library/react`. Leave every other file on `node`: jsdom adds setup time to each file
that loads it. Cleanup between tests is automatic, because Vitest's globals are on. See
[MusicLibrary.test.tsx](../../components/organisms/MusicLibrary/MusicLibrary.test.tsx).

**What to test:**
- Test pure utilities — logic, parsing, transforms. This is fast and high-value.
- Test a component's markup contract — attributes, conditional children, accessibility markers.
  Prefer `renderToStaticMarkup` here: it is the server render, which is what a visitor gets
  first.
- Test interactive behavior (clicks, effects, state across renders) in a jsdom file. Hover,
  focus styling and layout still belong to Ladle — jsdom computes no CSS.
