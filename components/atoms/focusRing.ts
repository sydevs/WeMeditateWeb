const LIGHT =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600 focus-visible:ring-offset-white'

const DARK =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white focus-visible:ring-offset-teal-900'

/**
 * The one focus indicator an interactive component draws.
 *
 * Per theme, never per variant — a per-variant axis is how every light ring
 * drifted under the 3:1 of WCAG 2.1 SC 1.4.11 (#133). `ring-offset-<color>` is
 * explicit because `--tw-ring-offset-color` defaults to `#fff`. The colours and
 * the `focus-visible:` choice are argued in `docs/rules/design-system.md`.
 */
export function focusRing(theme: 'light' | 'dark' = 'light'): string {
  return theme === 'dark' ? DARK : LIGHT
}
