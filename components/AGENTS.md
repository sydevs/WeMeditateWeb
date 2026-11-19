# Components (`components/`)

## Keep client-only heavy deps out of the Worker bundle

Load browser-only libraries (for example `@videojs/react` and the `@videojs/hlsjs-video` engine
it bundles, `@mapbox/search-js-react`) with **`ClientOnly` + `React.lazy` in a barrel**. Do not
load them with a plain dynamic `import()` inside an effect.

Vike's SSR build still bundles a dynamically imported module into `dist/server`. An in-effect
`import('hls.js')` once left the ~1.1 MB library in the Worker, even though it never ran on the
server.

This is about *browser-only* libraries, not about bundle size on its own. `FormBuilder` sits on
the RichText path that every page renders, and it still server-renders: its fields are worth more
than the `react-hook-form` and Turnstile weight they add to every route. Price the trade, and say
which side you took.

The pattern (see
[components/molecules/LocationSearch/index.tsx](molecules/LocationSearch/index.tsx)
and [components/molecules/VideoPlayer/index.tsx](molecules/VideoPlayer/index.tsx)):
the directory's `index.tsx` re-exports a wrapper. The wrapper renders
`<ClientOnly fallback={…}><LazyImpl/></ClientOnly>`, where
`LazyImpl = React.lazy(() => import('./Impl'))`. `ClientOnly` removes the children on the server
entirely, so the heavy implementation and its dependencies never enter the SSR graph.

After a change, confirm with `grep -rl <lib-internal-symbol> dist/server`. This command must find
nothing. The library should appear only as a code-split chunk under `dist/client`.

**An internal symbol, and never the package name.** `dist/server` carries Vite's client manifest,
so a lazily imported package's *paths* are in there by design — `@videojs/core`'s 55 locale chunks
put 330 hits on a bare `videojs` with none of its code present. `media-skin` and `HlsJsAdapter`
are the player's symbols; `Hls` alone also hits the meditation player's own `isHlsSource`.

**The vendored Video.js skin source is part of that graph**, not an exception to it:
`components/molecules/VideoPlayer/skin/` imports `@videojs/react`, so only the barrel may reach
it. Its own stylesheets ride the same client chunk, its Tailwind layer included.

**That layer is where the rule nearly leaked, and CSS is why.** `@theme`, `@utility` and
`@custom-variant` are compile-time Tailwind directives, so they need a stylesheet that imports
Tailwind — which the Shadcn CLI, and the first cut of this player, took to mean the site entry.
It does not: `skin/styles/skin-theme.css` is a second root, scanning only the player's folder and
imported by `skin/video/skin.tsx`. In the entry the layer measured 85,479 → 153,670 bytes on the
stylesheet every page loads, for a player no page without a video mounts — the same cost in CSS
that this rule exists to prevent in JS, and one `grep dist/server` cannot see. Check it the
matching way: `wc -c dist/client/assets/static/layouts_tailwind-*.css` must not move when the
player changes. See [molecules/VideoPlayer/skin/README.md](molecules/VideoPlayer/skin/README.md).

## What a visitor without JavaScript gets instead

Four components defer to the browser through `ClientOnly` + `React.lazy`, and
each one is a hole in the server's HTML. This table is what a reader checks
before adding a fifth, and what the accessibility walk-through
([docs/accessibility-walkthrough.md](../docs/accessibility-walkthrough.md))
reads for the "content everyone can reach" line. The rule above owns *why*
`ClientOnly` rather than a dynamic `import()`; this owns what the hole costs.

| Component | Deferred because | Without JavaScript |
| --- | --- | --- |
| [molecules/VideoPlayer](molecules/VideoPlayer/index.tsx) | Vidstack and hls.js need browser media APIs | The poster, at the player's own box and the full srcset ladder. The video itself is unreachable |
| [molecules/Lightbox](molecules/Lightbox/index.tsx) | `yet-another-react-lightbox` is browser-only | Nothing, and nothing is lost: it is an enlargement of an image already on the page |
| [molecules/EmbedButton](molecules/EmbedButton/index.tsx) | It reads `window.location.origin` and the Clipboard API | Nothing. It offers a snippet for embedding this page elsewhere, which is not the page's content |
| [molecules/LocationSearch](molecules/LocationSearch/index.tsx) | `@mapbox/search-js-react` needs `document` and `window` | Nothing — and **no page renders it today.** Only the `molecules` barrel and `.ladle/components.tsx` reach it. A page that adopts it owes a no-JavaScript path of its own, because an address field with nothing behind it is a dead end rather than a missing extra |

A page's title, its body copy and its forms all server-render, so none of the
four is on that path. `FormBuilder` deliberately stays in the SSR graph for
exactly that reason — the rule above prices that trade.
