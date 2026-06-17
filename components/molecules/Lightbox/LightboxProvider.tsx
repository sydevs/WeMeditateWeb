import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Lightbox } from './index'

/**
 * A single lightbox slide.
 *
 * Structurally a subset of the library's `SlideImage` (plus the Captions
 * plugin's `description`), but defined here — in a library-free module — so the
 * provider and the `Image` atom can build/collect slides without ever importing
 * the browser-only lightbox package. Only the lazy {@link Lightbox} impl does.
 */
export interface LightboxSlide {
  /** Full-resolution image URL (largest Cloudflare variant for CMS images). */
  src: string
  /** Accessible alt text, mirrored into the caption. */
  alt?: string
  /** Caption text shown by the Captions plugin. */
  description?: string
}

/** Slides registered for one group, keyed by their document-order index. */
type GroupSlides = Record<number, LightboxSlide>

interface LightboxContextValue {
  /** Register (or replace) a slide in a group at its document-order index. */
  register: (group: string, index: number, slide: LightboxSlide) => void
  /** Remove a slide when its `Image` unmounts. */
  unregister: (group: string, index: number) => void
  /** Open the lightbox for `group` on the slide at `index`. */
  openAt: (group: string, index: number) => void
}

const LightboxContext = createContext<LightboxContextValue | null>(null)

/**
 * Access the ambient lightbox controller, or `null` when no
 * {@link LightboxProvider} is mounted — letting the `Image` atom degrade to
 * plain, non-interactive rendering.
 */
export function useLightbox(): LightboxContextValue | null {
  return useContext(LightboxContext)
}

export interface LightboxProviderProps {
  children: ReactNode
}

/** Slides of a group sorted into document order (ascending index). */
function orderedSlides(slides: GroupSlides | undefined): LightboxSlide[] {
  return Object.entries(slides ?? {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, slide]) => slide)
}

/**
 * Collects lightbox slides registered by descendant `Image`s (grouped by a
 * caller-provided key, positioned by an explicit index) and renders a single
 * client-only overlay for whichever group is open. Centralizing the state here
 * means each surface (gallery, inline upload) opts in with just a `lightboxGroup`
 * (+ `lightboxIndex`) prop and shares one overlay and one library load.
 *
 * Registration is keyed by index rather than mount order, so it's idempotent and
 * order-stable across re-renders/remounts (StrictMode, Fast Refresh): clicking an
 * image always opens its own slide. The overlay only mounts once a group is open
 * (always after a client-side click), so the lightbox library stays in a lazy
 * client chunk and never enters the SSR / Workers bundle.
 */
export function LightboxProvider({ children }: LightboxProviderProps) {
  const [groups, setGroups] = useState<Record<string, GroupSlides>>({})
  // Mirror for synchronous reads in openAt without making the callback depend on
  // `groups` — keeps the context value referentially stable across registrations.
  const groupsRef = useRef(groups)

  groupsRef.current = groups
  const [active, setActive] = useState<{ group: string; position: number } | null>(null)

  const register = useCallback((group: string, index: number, slide: LightboxSlide) => {
    setGroups((prev) => ({ ...prev, [group]: { ...prev[group], [index]: slide } }))
  }, [])

  const unregister = useCallback((group: string, index: number) => {
    setGroups((prev) => {
      const slides = prev[group]

      if (!slides || !(index in slides)) {
        return prev
      }
      const nextSlides = { ...slides }

      delete nextSlides[index]
      const next = { ...prev }

      if (Object.keys(nextSlides).length === 0) {
        delete next[group]
      } else {
        next[group] = nextSlides
      }

      return next
    })
  }, [])

  const openAt = useCallback((group: string, index: number) => {
    // Map the registered index to its position in the ordered slide list, so the
    // overlay opens on the clicked image even if some indices never registered.
    const order = Object.keys(groupsRef.current[group] ?? {})
      .map(Number)
      .sort((a, b) => a - b)
    const position = order.indexOf(index)

    setActive({ group, position: position < 0 ? 0 : position })
  }, [])

  const value = useMemo(() => ({ register, unregister, openAt }), [register, unregister, openAt])

  const slides = active ? orderedSlides(groups[active.group]) : []
  // If the active group lost images while open (e.g. a live-preview edit), clamp
  // the position and drop the overlay once empty, so the library never receives
  // an out-of-range index.
  const position = Math.min(active?.position ?? 0, Math.max(slides.length - 1, 0))

  return (
    <LightboxContext.Provider value={value}>
      {children}
      {active && slides.length > 0 ? (
        <Lightbox open close={() => setActive(null)} index={position} slides={slides} />
      ) : null}
    </LightboxContext.Provider>
  )
}
