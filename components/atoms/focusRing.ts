/**
 * The one focus indicator every interactive atom draws.
 *
 * The colour is per theme, never per variant. A per-variant axis is what let
 * `Link` ship eight ring colours against a width nobody set, and every
 * light-theme colour `Button` reached for sat under the 3:1 that WCAG 2.1
 * SC 1.4.11 requires: `teal-500` 2.70, `coral-500` 2.53, `gray-400` 1.71 on
 * white. `teal-600` measures 3.85 on white, and `white` measures 4.68 on the
 * lightest dark surface the site ships (`#8a6f56`, OrnateTextBox's gradient).
 *
 * The offset band needs an explicit colour: `--tw-ring-offset-color` defaults
 * to `#fff`, so a dark-theme button would otherwise wear a white band.
 *
 * `focus-visible:`, not `focus:`, so a mouse click leaves no lingering ring —
 * and a browser without `:focus-visible` keeps its own outline rather than
 * losing both.
 */
export function focusRing(theme: 'light' | 'dark' = 'light'): string {
  const ring =
    theme === 'dark'
      ? 'focus-visible:ring-white focus-visible:ring-offset-teal-900'
      : 'focus-visible:ring-teal-600 focus-visible:ring-offset-white'

  return `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${ring}`
}
