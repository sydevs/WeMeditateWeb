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

**A stylesheet obeys the same rule, and `grep dist/server` cannot see it.** `VideoPlayer.tsx`
imports `@videojs/react/video/skin.css`, so the skin's ~80 KB rides the player's lazy chunk; a
page with no video loads none of it. Check that the matching way — `wc -c
dist/client/assets/static/layouts_tailwind-*.css` must not move when the player changes.

## What a visitor without JavaScript gets instead

Five components defer to the browser through `ClientOnly` + `React.lazy`, and
each one is a hole in the server's HTML. This table is what a reader checks
before adding a sixth, and what the accessibility walk-through
([docs/accessibility-walkthrough.md](../docs/accessibility-walkthrough.md))
reads for the "content everyone can reach" line. The rule above owns *why*
`ClientOnly` rather than a dynamic `import()`; this owns what the hole costs.

| Component | Deferred because | Without JavaScript |
| --- | --- | --- |
| [molecules/VideoPlayer](molecules/VideoPlayer/index.tsx) | Video.js and the hls.js engine it bundles need browser media APIs | The poster, at the player's own box and the full srcset ladder. The video itself is unreachable |
| [molecules/Lightbox](molecules/Lightbox/index.tsx) | `yet-another-react-lightbox` is browser-only | Nothing, and nothing is lost: it is an enlargement of an image already on the page |
| [molecules/EmbedButton](molecules/EmbedButton/index.tsx) | It reads `window.location.origin` and the Clipboard API | Nothing. It offers a snippet for embedding this page elsewhere, which is not the page's content |
| [molecules/LocationSearch](molecules/LocationSearch/index.tsx) | `@mapbox/search-js-react` needs `document` and `window` | Its `fallback`: a page that adopts it owes one, because an address field with nothing behind it is a dead end rather than a missing extra. The one adopter, a `map-search` splash's `MapSearch`, falls back to a link to the class map in the block's action text — and to nothing when the editor left that empty, since no translation names the link |
| [organisms/SubtleSystem](organisms/SubtleSystem/SubtleSystem.tsx) | Weight, not the browser: the drawing is ~325 KB of markup, and a static import would put it in the RichText chunk every page loads. Only the drawing defers — the previews and their links still server-render | An empty box at the drawing's size, so nothing moves when it lands; a chunk that fails to load leaves the same box. Without JavaScript the drawing never opened a preview, so what is lost is the picture, not a link |

A page's title, its body copy and its forms all server-render, so none of the
five is on that path. `FormBuilder` deliberately stays in the SSR graph for
exactly that reason — the rule above prices that trade.
