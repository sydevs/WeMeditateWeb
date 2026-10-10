import { useEffect, useLayoutEffect, useRef } from 'react'

const DURATION_MS = 300

// A passive effect lets the new contents paint at full opacity for a frame
// before the fade starts, which reads as a flash. useLayoutEffect runs before
// paint, but warns when React calls it during SSR.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Fade an element's contents in whenever `key` changes, and never on the first
 * render.
 *
 * Imperative on purpose. A Tailwind class that animated a later change would
 * have to be in the server's HTML to be there when the change comes, and that
 * is exactly what shipped index cards at `opacity-0` (#149). `Element.animate`
 * cannot reach the server, so the first render stays visible by construction.
 *
 * `key` comes from the state whose change the fade follows, so the component
 * that caused the transition declares it. Deriving it from the rendered data
 * instead would fade a locale switch or a reorder the same as an interaction.
 */
export function useFadeOnChange(key: string) {
  const ref = useRef<HTMLDivElement>(null)
  const rendered = useRef(key)

  useBeforePaint(() => {
    const changed = rendered.current !== key

    rendered.current = key

    if (!changed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const animation = ref.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: DURATION_MS,
      easing: 'ease-out',
    })

    // A superseded fade otherwise keeps ticking on the same property until its
    // own duration runs out, leaving two animations on the node.
    return () => animation?.cancel()
  }, [key])

  return ref
}
