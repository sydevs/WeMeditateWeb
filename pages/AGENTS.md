# Routes (`pages/`)

- **Exclude a route-owned path from the `[slug]` matcher.**
  [pages/[slug]/+route.ts]([slug]/+route.ts) matches any single path segment. A path owned
  by its own route function (for example `/map`) needs an explicit exclusion in
  `RESERVED_SEGMENTS`. Without this exclusion, the path silently renders the Pages "not found"
  state instead of its real route.

  **Each entry derives from the constant its own route matches**, never a string: `MAP_PREFIX`
  for `/map`, `MEDITATIONS_SEGMENT` for `/meditations`. A list spelling a path itself cannot
  follow it when it moves.
