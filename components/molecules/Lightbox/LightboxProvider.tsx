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

/** A registered slide plus the stable key identifying its `Image` instance. */
interface Registration {
  key: string
  slide: LightboxSlide
}

interface LightboxContextValue {
  /** Register (or update) a slide under a group, keyed by the image's stable id. */
  register: (group: string, key: string, slide: LightboxSlide) => void
  /** Remove a slide when its `Image` unmounts. */
  unregister: (group: string, key: string) => void
  /** Open the lightbox for `group` at the slide registered under `key`. */
  openAt: (group: string, key: string) => void
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

/**
 * Collects lightbox slides registered by descendant `Image`s (grouped by a
 * caller-provided key) and renders a single client-only overlay for whichever
 * group is open. Centralizing the state here means each surface (gallery,
 * inline upload) opts in with just a `lightboxGroup` prop and shares one overlay
 * and one library load.
 *
 * The overlay only mounts once a group is open (always after a client-side
 * click), so the lightbox library stays in a lazy client chunk and never enters
 * the SSR / Workers bundle.
 */
export function LightboxProvider({ children }: LightboxProviderProps) {
  const [groups, setGroups] = useState<Record<string, Registration[]>>({})
  // Mirror for synchronous reads in openAt without making the callback depend on
  // `groups` — keeps the context value referentially stable across the many
  // registrations a gallery triggers on mount.
  const groupsRef = useRef(groups)

  groupsRef.current = groups
  const [active, setActive] = useState<{ group: string; index: number } | null>(null)

  const register = useCallback((group: string, key: string, slide: LightboxSlide) => {
    setGroups((prev) => {
      const list = prev[group] ?? []
      const existing = list.findIndex((r) => r.key === key)
      const next =
        existing >= 0
          ? list.map((r, i) => (i === existing ? { key, slide } : r))
          : [...list, { key, slide }]

      return { ...prev, [group]: next }
    })
  }, [])

  const unregister = useCallback((group: string, key: string) => {
    setGroups((prev) => {
      const list = prev[group]

      if (!list) {
        return prev
      }
      const next = list.filter((r) => r.key !== key)

      if (next.length === list.length) {
        return prev
      }
      const copy = { ...prev }

      if (next.length === 0) {
        delete copy[group]
      } else {
        copy[group] = next
      }

      return copy
    })
  }, [])

  const openAt = useCallback((group: string, key: string) => {
    const list = groupsRef.current[group] ?? []
    const index = list.findIndex((r) => r.key === key)

    setActive({ group, index: index < 0 ? 0 : index })
  }, [])

  const value = useMemo(() => ({ register, unregister, openAt }), [register, unregister, openAt])

  const slides = active ? (groups[active.group] ?? []).map((r) => r.slide) : []
  // If the active group lost images while the overlay was open (e.g. a
  // live-preview edit removing a gallery image), clamp the index and drop the
  // overlay once empty, so the library never receives an out-of-range index.
  const index = Math.min(active?.index ?? 0, Math.max(slides.length - 1, 0))

  return (
    <LightboxContext.Provider value={value}>
      {children}
      {active && slides.length > 0 ? (
        <Lightbox open close={() => setActive(null)} index={index} slides={slides} />
      ) : null}
    </LightboxContext.Provider>
  )
}
