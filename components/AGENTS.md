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
it. Its own stylesheets ride the same client chunk. One file is the exception, and it is CSS, not
code: `skin/styles/tailwind.css` is `@import`ed by `layouts/tailwind.css`, because `@theme`,
`@utility` and `@custom-variant` are compile-time Tailwind directives and have to sit in the
entry. See [molecules/VideoPlayer/skin/README.md](molecules/VideoPlayer/skin/README.md).
