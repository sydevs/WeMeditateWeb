# Routes (`pages/`)

- **Exclude a route-owned path from the `[slug]` matcher.**
  [pages/[slug]/+route.ts]([slug]/+route.ts) matches any single path segment. A path owned
  by its own route function (for example `/map`) needs an explicit exclusion in
  `RESERVED_SEGMENTS`. Without this exclusion, the path silently renders the Pages "not found"
  state instead of its real route.
