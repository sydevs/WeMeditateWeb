import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  lazy,
  Suspense,
  ComponentProps,
} from 'react'
import * as Sentry from '@sentry/react'
import { ClientOnly } from 'vike-react/ClientOnly'
import { Button } from '@/components/atoms/Button'
import { Link } from '@/components/atoms/Link'
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline'
import './SubtleSystem.css'
import { useT } from '@/hooks/useT'

// Constants
const NESTED_HOVER_DELAY = 100 // ms - delay for nested chakra hover
const MOBILE_BREAKPOINT = 768 // px - breakpoint for mobile layout

// Nested chakra configuration
const NESTED_CHAKRAS = {
  chakra_3b: ['chakra_2', 'chakra_3'],
  chakra_2: ['chakra_3b'],
  chakra_3: ['chakra_3b'],
} as const

const SubtleSystemChart = lazy(() =>
  import('./SubtleSystemChart').then((mod) => ({ default: mod.SubtleSystemChart })),
)

// The drawing's own viewBox, so the `.subtle-system-chart svg` rule sizes this
// empty stand-in exactly as it sizes the chart, and nothing moves when it lands.
const CHART_PLACEHOLDER = <svg aria-hidden="true" viewBox="0 0 442.49 558.05" />

const panelId = (prefix: string, nodeId: string) => `${prefix}-${nodeId}`

/** A node that opens a panel is a button for it; any other node is no tab stop at all. */
function setNodeKeyboard(
  node: Element,
  panel: { id: string; title: string; expanded: boolean } | null,
) {
  if (!panel) {
    for (const name of ['tabindex', 'role', 'aria-label', 'aria-controls', 'aria-expanded']) {
      node.removeAttribute(name)
    }

    return
  }
  node.setAttribute('tabindex', '0')
  node.setAttribute('role', 'button')
  node.setAttribute('aria-label', panel.title)
  node.setAttribute('aria-controls', panel.id)
  node.setAttribute('aria-expanded', String(panel.expanded))
}

/** Article preview item for SubtleSystem component */
export interface SubtleSystemItem {
  /** Unique identifier matching an SVG element ID, for example 'chakra_1' or 'channel_left' */
  id: string
  /** Display title for the preview */
  title: string
  /** Description text for the preview */
  description: string
  /** Link URL for "Learn More" button */
  linkHref: string
}

export interface SubtleSystemProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Array of article preview items */
  items: SubtleSystemItem[]
  /** Default view mode */
  defaultView?: 'chakras' | 'channels'
  /** Callback when a node is selected */
  onNodeSelect?: (nodeId: string | null) => void
}

/**
 * Interactive SVG visualization of the subtle system (chakras and channels).
 *
 * Features:
 * - Two toggleable views: Chakras and Channels
 * - Idle animations when no preview is selected
 * - Hover interactions that highlight SVG elements
 * - Article previews with title, description, and "Learn More" button
 * - Mobile: previews below chart with auto-scroll
 * - Fullscreen mode
 * - Keyboard: a node with a preview is a button; focus shows its preview, and
 *   Enter or Space moves focus into it
 *
 * The drawing loads in the browser only (see `SubtleSystemChart`); the
 * previews, and their links, are in the server HTML.
 */
export function SubtleSystem({
  items,
  defaultView = 'chakras',
  onNodeSelect,
  className = '',
  ...props
}: SubtleSystemProps) {
  const t = useT()
  const [activeView, setActiveView] = useState<'chakras' | 'channels'>(defaultView)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [isAnimated, setIsAnimated] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [chart, setChart] = useState<HTMLDivElement | null>(null)
  const [focusRequest, setFocusRequest] = useState<{ nodeId: string } | null>(null)
  const panelBaseId = useId()

  const containerRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /** Check if target node is nested within current node */
  const isNested = useCallback((current: string | null, target: string) => {
    if (!current) return false
    const nestedGroup = NESTED_CHAKRAS[target as keyof typeof NESTED_CHAKRAS] as
      readonly string[] | undefined

    return nestedGroup?.includes(current) ?? false
  }, [])

  /** Scroll to preview on mobile */
  const scrollToPreview = useCallback((nodeId: string) => {
    if (window.innerWidth > MOBILE_BREAKPOINT) return

    const preview = containerRef.current?.querySelector(`[data-node-id="${nodeId}"]`)

    if (preview) {
      preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [])

  /** Handle node hover with timing delay for nested elements */
  const handleNodeHover = useCallback(
    (nodeId: string) => {
      if (nodeId === activeNode) return

      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }

      // Determine delay time for nested chakras
      const delay = isNested(activeNode, nodeId) ? NESTED_HOVER_DELAY : 0

      hoverTimeoutRef.current = setTimeout(() => {
        setIsAnimated(false)
        setActiveNode(nodeId)
        onNodeSelect?.(nodeId)
      }, delay)
    },
    [activeNode, onNodeSelect, isNested],
  )

  /** Handle node hover end */
  const handleNodeHoverEnd = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }, [])

  /** Focus selects at once: the nested-chakra delay is for a pointer crossing overlapping shapes. */
  const handleNodeFocus = useCallback(
    (nodeId: string) => {
      handleNodeHoverEnd()
      // No `nodeId === activeNode` check, unlike hover: a listener can still
      // hold the render before the pointer moved the selection, and would skip both.
      setIsAnimated(false)
      setActiveNode(nodeId)
      onNodeSelect?.(nodeId)
    },
    [onNodeSelect, handleNodeHoverEnd],
  )

  /** Handle node click */
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setActiveNode(nodeId)
      onNodeSelect?.(nodeId)
      scrollToPreview(nodeId)
    },
    [onNodeSelect, scrollToPreview],
  )

  /** Handle view toggle */
  const handleViewToggle = useCallback(
    (view: 'chakras' | 'channels') => {
      if (view === activeView) return

      setActiveView(view)
      setIsAnimated(true)
      setActiveNode(null)
      onNodeSelect?.(null)
    },
    [activeView, onNodeSelect],
  )

  /** Handle fullscreen toggle */
  const handleFullscreenToggle = useCallback(async () => {
    // Support the WebKit-prefixed Fullscreen API (Safari < 16.4) alongside
    // the standard one. Without the fallback, the request throws, and the
    // catch block swallows it, so the button silently does nothing in those
    // browsers.
    const el = containerRef.current as
      (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> }) | null

    if (!el) return
    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> }

    try {
      if (!isFullscreen) {
        // State will be updated by the fullscreenchange event listener
        await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.())
      } else {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.())
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }, [isFullscreen])

  /** Listen for fullscreen change events (standard + WebKit-prefixed) */
  useEffect(() => {
    const doc = document as Document & { webkitFullscreenElement?: Element | null }
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  /** Move focus into the panel a node opened: the only way a keyboard reaches its link. */
  useEffect(() => {
    if (!focusRequest) return

    containerRef.current
      ?.querySelector<HTMLElement>(`[data-node-id="${focusRequest.nodeId}"] a`)
      ?.focus()
  }, [focusRequest])

  /** Setup SVG hover listeners and update active classes */
  useEffect(() => {
    const svg = chart?.querySelector('svg')

    if (!svg) return

    const containerSelector = activeView === 'chakras' ? '#hover_chakras' : '#hover_channels'
    const hoverContainer = svg.querySelector(containerSelector)

    if (!hoverContainer) return

    const nodes = Array.from(hoverContainer.children) as SVGElement[]
    const itemsById = new Map(items.map((item) => [item.id, item]))

    // Update active classes
    nodes.forEach((node) => {
      if (node.id === activeNode) {
        node.classList.add('active')
      } else {
        node.classList.remove('active')
      }
    })

    // Both views, because `kundalini` and `chakra_7` stay drawn in the channels
    // view, where no handler is bound to them and so no tab stop may be either.
    svg.querySelectorAll('#hover_chakras > *, #hover_channels > *').forEach((node) => {
      const item = node.parentElement === hoverContainer ? itemsById.get(node.id) : undefined

      setNodeKeyboard(
        node,
        item
          ? {
              id: panelId(panelBaseId, item.id),
              title: item.title,
              expanded: item.id === activeNode,
            }
          : null,
      )
    })

    // Setup event listeners
    const handleMouseOver = (event: Event) => {
      const target = event.currentTarget as SVGElement

      handleNodeHover(target.id)
    }

    const handleMouseOut = () => {
      handleNodeHoverEnd()
    }

    const handleClick = (event: Event) => {
      const target = event.currentTarget as SVGElement

      handleNodeClick(target.id)
    }

    const handleFocus = (event: Event) => {
      handleNodeFocus((event.currentTarget as SVGElement).id)
    }

    const handleKeyDown = (event: Event) => {
      const { key } = event as KeyboardEvent

      if (key !== 'Enter' && key !== ' ') return

      // Space would scroll the page, as it does for any element that is not a native button.
      event.preventDefault()
      const nodeId = (event.currentTarget as SVGElement).id

      handleNodeFocus(nodeId)
      setFocusRequest({ nodeId })
    }

    nodes.forEach((node) => {
      node.addEventListener('mouseover', handleMouseOver)
      node.addEventListener('mouseout', handleMouseOut)
      node.addEventListener('click', handleClick)
      node.addEventListener('focus', handleFocus)
      node.addEventListener('keydown', handleKeyDown)
    })

    // Cleanup
    return () => {
      nodes.forEach((node) => {
        node.removeEventListener('mouseover', handleMouseOver)
        node.removeEventListener('mouseout', handleMouseOut)
        node.removeEventListener('click', handleClick)
        node.removeEventListener('focus', handleFocus)
        node.removeEventListener('keydown', handleKeyDown)
      })
    }
  }, [
    chart,
    items,
    panelBaseId,
    activeView,
    activeNode,
    handleNodeHover,
    handleNodeHoverEnd,
    handleNodeClick,
    handleNodeFocus,
  ])

  return (
    <div
      ref={containerRef}
      className={`${isFullscreen ? 'bg-white' : ''} ${className}`}
      data-animated={isAnimated}
      data-view={activeView}
      {...props}
    >
      {/* Toggle */}
      <div className="text-center mb-7 text-base sm:text-lg leading-[25px]">
        <button
          aria-pressed={activeView === 'chakras'}
          className={`inline-flex touch-target items-center justify-center px-2 cursor-pointer transition-colors ${
            activeView === 'chakras' ? 'font-bold text-teal-600' : 'hover:text-teal-600'
          }`}
          onClick={() => handleViewToggle('chakras')}
        >
          {t('blocks.general.chakras')}
        </button>
        <span className="px-1">|</span>
        <button
          aria-pressed={activeView === 'channels'}
          className={`inline-flex touch-target items-center justify-center px-2 cursor-pointer transition-colors ${
            activeView === 'channels' ? 'font-bold text-teal-600' : 'hover:text-teal-600'
          }`}
          onClick={() => handleViewToggle('channels')}
        >
          {t('blocks.general.channels')}
        </button>
      </div>

      {/* SVG Chart Container */}
      <div className="relative max-w-[1200px] mx-auto mb-[100px]">
        {/* SVG Chart */}
        <div className="subtle-system-chart min-h-[400px] max-h-[550px] sm:h-[550px] sm:max-h-[80vh] max-w-full block mx-auto">
          <ClientOnly fallback={CHART_PLACEHOLDER}>
            {/* A chunk that fails to load costs the picture; the root boundary would take the page. */}
            <Sentry.ErrorBoundary fallback={CHART_PLACEHOLDER}>
              <Suspense fallback={CHART_PLACEHOLDER}>
                <SubtleSystemChart ref={setChart} />
              </Suspense>
            </Sentry.ErrorBoundary>
          </ClientOnly>
        </div>

        {/* Fullscreen Button */}
        <div className="absolute top-4 right-4">
          <Button
            aria-label={
              isFullscreen ? t('blocks.a11y.exit_fullscreen') : t('blocks.a11y.enter_fullscreen')
            }
            icon={isFullscreen ? ArrowsPointingInIcon : ArrowsPointingOutIcon}
            size="sm"
            variant="outline"
            onClick={handleFullscreenToggle}
          />
        </div>

        {/* Article Previews */}
        <div className="text-left mt-[50px]">
          {items.map((item, index) => {
            const isActive = item.id === activeNode

            // Only a closing panel transitions `visibility`, to stay drawn while it
            // fades. An opening one is visible in the commit that opens it, so
            // Enter can focus its link there. `inert` takes a closing panel out of
            // reach at once, where `invisible` would leave it reachable for the fade.
            return (
              <div
                key={item.id}
                className={`hidden sm:block opacity-0 invisible duration-500 ease-in-out ${
                  isActive
                    ? 'delay-0 block! opacity-100! visible! transition-opacity'
                    : 'delay-0 transition-[visibility,opacity]'
                } bg-white/50 shadow-[0_0_10px_5px_rgba(255,255,255,0.5)] sm:absolute sm:top-16 sm:w-80 sm:max-w-[45%] sm:mt-[70px] ${
                  index % 2 === 0 ? 'sm:left-0 sm:pr-0' : 'sm:right-0 sm:pl-0'
                } p-4 sm:p-8`}
                data-node-id={item.id}
                id={panelId(panelBaseId, item.id)}
                inert={!isActive}
              >
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-base mb-4 text-gray-700">{item.description}</p>
                <Link
                  aria-label={t('blocks.a11y.learn_more_about', { title: item.title })}
                  className="inline-block"
                  href={item.linkHref}
                  variant="primary"
                >
                  {t('blocks.general.learn_more')}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
