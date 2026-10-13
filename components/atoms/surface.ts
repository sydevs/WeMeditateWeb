/**
 * The `surface-*` class for a theme, or '' when none was given.
 *
 * '' lets the element inherit its ring colours from the nearest surface
 * ancestor — see `focus-ring` in `layouts/tailwind.css`. The literals are
 * spelled out so Tailwind's scanner sees them.
 */
export function surface(theme?: 'light' | 'dark'): string {
  if (!theme) return ''
  return theme === 'dark' ? 'surface-dark' : 'surface-light'
}
