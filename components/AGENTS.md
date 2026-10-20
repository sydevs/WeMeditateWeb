# Components (`components/`)

## Keep client-only heavy deps out of the Worker bundle

Load browser-only libraries (for example `vidstack`/`@vidstack/react`, `hls.js`,
`@mapbox/search-js-react`) with **`ClientOnly` + `React.lazy` in a barrel**. Do not load them with
a plain dynamic `import()` inside an effect.

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
