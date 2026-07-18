# Test plan checklist

What to test, by change type, for this Vike + React + Cloudflare frontend. The project runs **Vitest only** (`environment: 'node'`), tests co-located with source (`Foo.tsx` → `Foo.test.tsx`, `foo.ts` → `foo.test.ts`). No jsdom, no Testing Library, no Playwright. See CLAUDE.md "Testing" for the full rationale and examples.

## Pure utilities / logic (`lib/`, `server/*.ts` helpers)

Highest-value tests — fast and deterministic.

- New transform / parser / URL builder: assert inputs → outputs across the normal case and the edge cases (empty, missing, malformed).
- Example to mirror: [lib/cloudflare-images.test.ts](../../../lib/cloudflare-images.test.ts) and [server/error-utils.test.ts](../../../server/error-utils.test.ts).
- Import `describe`, `it`, `expect` from `'vitest'` explicitly (matches existing files).

## Components (`components/atoms|molecules|organisms`)

Assert on rendered markup with `renderToStaticMarkup` from `react-dom/server` — search the returned HTML string.

- New/changed attributes, `srcSet`/`sizes`, conditional children, accessibility markers (aria-\*, alt text, screen-reader text).
- Mirror: [components/atoms/Image/Image.test.tsx](../../../components/atoms/Image/Image.test.tsx).
- `useState`/`useMemo` run under SSR; `useEffect` does **not** — assert against first-render state.
- Note React SSR emits lowercase attributes (`srcset`, not `srcSet`) — match accordingly.

## CMS data fetching (`server/cms-client.ts`, `server/payload-client.ts`)

- Query functions: cover the happy path plus the error/empty path (missing doc, API error). Don't test PayloadCMS/SDK internals — test *this app's* handling.
- Caching: verify the cache key shape (`prefix:param=value:...`) and TTL selection, and that `preview === true` bypasses the cache.
- Never hand-edit `server/payload-types.ts` to make a test pass — regenerate with `pnpm types:cms`.

## Routing & locale (`pages/`, `components/atoms/Link`)

- Locale prefixing: `/about` + `es` → `/es/about`; English (`en`) stays unprefixed. Test the `Link` output and any locale extraction helper.
- Route/validation params (`server/validation.ts`): malformed slug/id rejected; valid input parsed.

## Visual / interactive behavior

There is no DOM event simulation. For hover/focus/click, responsive breakpoints, and animations, verify in **Ladle** (`pnpm ladle`, http://localhost:61000) — do not try to test these with Vitest.

## What NOT to test

- Framework/Vike internals, the PayloadCMS SDK, or third-party libraries — test the project's own logic only.
- Don't add jsdom / Testing Library / Playwright to enable a test — discuss first (it's a larger config change).

## Minimum bar before opening a PR

Run `.claude/skills/pr-prep/check.sh` (add `--full` for build-affecting changes):

- `pnpm lint` — 0 errors
- `pnpm exec tsc --noEmit` — clean
- `pnpm test:run` — 0 failures, no new skips
- `pnpm build` succeeds (for build/server/Wrangler changes; this is what the Cloudflare preview deploy runs)
- If pre-existing failures exist on `main`: fix them in this PR (see `.claude/skills/pr-prep/SKILL.md`)
