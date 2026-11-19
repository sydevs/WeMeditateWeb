# Video.js skin source (vendored)

Third-party source, copied in rather than imported, because the packaged `VideoSkin` exposes no
way to re-point its time display or its time slider — and a Lecture clip needs both to read
`0:00`–`stopTime − startTime` instead of the underlying media position. That is Level 3 of the
upstream guide's three customization levels, and Level 3 means owning the files.

## Where it comes from

The Video.js Shadcn registry, `https://shadcn.videojs.org/r/react/<item>.json`, at `@videojs/*`
**10.5.0**. The set is the transitive closure of the `video` item, laid out as the Shadcn CLI
would lay it out, with `@/components/videojs/ui/*` and `@/lib/resolve-class-name` rewritten to
relative paths. The CLI itself is not used: this repo has no `components.json`, and
`shadcn init` would rewrite the design system's own theme tokens.

`styles/tailwind.css` is generated rather than copied. The registry carries the skin's Tailwind
integration as the `_style-theme` item's `cssVars.theme` and `css` fields, which the CLI merges
into the project's global stylesheet. It is the skin's only `@theme`, so
[layouts/tailwind.css](../../../../layouts/tailwind.css) imports it; every other stylesheet here
is plain CSS that a component imports.

Everything in `styles/` is scoped to `.media-skin`, so none of it reaches the rest of the site.

## Our edits

Every one is marked `wm:` in its own file — `grep -rn 'wm:' .` is the list. There are four, and
three of them exist because Video.js 10 has no clipping:

| Where | What |
| --- | --- |
| `video/layout/controls.tsx` | The elapsed time, the duration and the time slider read a playback window from `ClipWindowContext` ([clip-window.tsx](../clip-window.tsx)) and subtract its start |
| `video/behaviors/playback-hotkeys.tsx` | The `0`–`9`, `Home` and `End` keys seek by a share of the media, so a window takes them over |
| `video/layout/controls.tsx` | A 44×44 floor on the centre play button, which measured 42×42 under a 360px container |
| `styles/tailwind.css` | `@theme inline`, not `@theme`. Its own header carries why, and it is the one file here that is generated rather than copied |

Nothing else. Keep it that way: the smaller this diff, the cheaper the next version is.

## Reading the code in here

**A comment inside this tree describes upstream's repo, not this one.** `lib/resolve-class-name.ts`
says a test keeps its theme table equal to `styles/tailwind.css`; that test is upstream's, and
nothing here holds the two equal. Take such a line as a note about where the file came from.

## Upgrading

Re-fetch the registry at the new version, re-apply the four edits, and diff. A `pnpm update` of
`@videojs/react` alone does **not** update these files — they are source, not a dependency.
Re-measure the touch targets afterwards: two of the four edits exist because a measurement found
a control under 44×44.
