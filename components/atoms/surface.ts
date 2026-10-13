/** The surface a component paints: what its descendants' colours resolve against. */
export type Surface = 'light' | 'dark'

/**
 * The `surface-*` class for a surface, or '' when none was given.
 *
 * '' lets the element inherit from the nearest surface ancestor — see the
 * surface tokens in `layouts/tailwind.css`. The literals are spelled out so
 * Tailwind's scanner sees them.
 */
export function surface(value?: Surface): string {
  if (!value) return ''
  return value === 'dark' ? 'surface-dark' : 'surface-light'
}
