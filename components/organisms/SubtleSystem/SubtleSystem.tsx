import { useState, useEffect, useRef, useCallback, ComponentProps } from 'react'
import chartSvg from '../../../assets/chart.svg?raw'
import { Button } from '../../atoms/Button'
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline'
import './SubtleSystem.css'

// Constants
const NESTED_HOVER_DELAY = 100 // ms - delay for nested chakra hover
const MOBILE_BREAKPOINT = 768 // px - breakpoint for mobile layout

// Nested chakra configuration
const NESTED_CHAKRAS = {
  chakra_3b: ['chakra_2', 'chakra_3'],
  chakra_2: ['chakra_3b'],
  chakra_3: ['chakra_3b'],
} as const

/**
 * Article preview item for SubtleSystem component
 */
export interface SubtleSystemItem {
  /** Unique identifier matching SVG element ID (e.g., 'chakra_1', 'channel_left') */
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
 */
export function SubtleSystem({
  items,
  defaultView = 'chakras',
  onNodeSelect,
  className = '',
  ...props
}: SubtleSystemProps) {
  const [activeView, setActiveView] = useState<'chakras' | 'channels'>(defaultView)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [isAnimated, setIsAnimated] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Check if target node is nested within current node
   */
  const isNested = useCallback((current: string | null, target: string) => {
    if (!current) return false
    const nestedGroup = NESTED_CHAKRAS[target as keyof typeof NESTED_CHAKRAS] as readonly string[] | undefined
    return nestedGroup?.includes(current) ?? false
  }, [])

  /**
   * Scroll to preview on mobile
   */
  const scrollToPreview = useCallback((nodeId: string) => {
    if (window.innerWidth > MOBILE_BREAKPOINT) return

    const preview = containerRef.current?.querySelector(`[data-node-id="${nodeId}"]`)

    if (preview) {
      preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [])

  /**
   * Handle node hover with timing delay for nested elements
   */
  const handleNodeHover = useCallback((nodeId: string) => {
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
  }, [activeNode, onNodeSelect, isNested])

  /**
   * Handle node hover end
   */
  const handleNodeHoverEnd = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }, [])

  /**
   * Handle node click
   */
  const handleNodeClick = useCallback((nodeId: string) => {
    setActiveNode(nodeId)
    onNodeSelect?.(nodeId)
    scrollToPreview(nodeId)
  }, [onNodeSelect, scrollToPreview])

  /**
   * Handle view toggle
   */
  const handleViewToggle = useCallback((view: 'chakras' | 'channels') => {
    if (view === activeView) return

    setActiveView(view)
    setIsAnimated(true)
    setActiveNode(null)
    onNodeSelect?.(null)
  }, [activeView, onNodeSelect])

  /**
   * Handle fullscreen toggle
   */
  const handleFullscreenToggle = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen()
        // State will be updated by fullscreenchange event listener
      } else {
        await document.exitFullscreen()
        // State will be updated by fullscreenchange event listener
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }, [isFullscreen])

  /**
   * Listen for fullscreen change events
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  /**
   * Setup SVG hover listeners and update active classes
   */
  useEffect(() => {
    if (!svgRef.current) return

    const svg = svgRef.current.querySelector('svg')
    if (!svg) return

    const containerSelector = activeView === 'chakras' ? '#hover_chakras' : '#hover_channels'
    const hoverContainer = svg.querySelector(containerSelector)
    if (!hoverContainer) return

    const nodes = Array.from(hoverContainer.children) as SVGElement[]

    // Update active classes
    nodes.forEach(node => {
      if (node.id === activeNode) {
        node.classList.add('active')
      } else {
        node.classList.remove('active')
      }
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

    nodes.forEach(node => {
      node.addEventListener('mouseover', handleMouseOver)
      node.addEventListener('mouseout', handleMouseOut)
      node.addEventListener('click', handleClick)
    })

    // Cleanup
    return () => {
      nodes.forEach(node => {
        node.removeEventListener('mouseover', handleMouseOver)
        node.removeEventListener('mouseout', handleMouseOut)
        node.removeEventListener('click', handleClick)
      })
    }
  }, [activeView, activeNode, handleNodeHover, handleNodeHoverEnd, handleNodeClick])

  return (
    <div
      ref={containerRef}
      data-view={activeView}
      data-animated={isAnimated}
      className={`${isFullscreen ? 'bg-white' : ''} ${className}`}
      {...props}
    >
      {/* Toggle */}
      <div className="text-center mb-7 text-base sm:text-lg leading-[25px]">
        <button
          className={`px-2 cursor-pointer transition-colors ${
            activeView === 'chakras' ? 'font-bold text-teal-600' : 'hover:text-teal-600'
          }`}
          onClick={() => handleViewToggle('chakras')}
          aria-pressed={activeView === 'chakras'}
        >
          Chakras
        </button>
        <span className="px-1">|</span>
        <button
          className={`px-2 cursor-pointer transition-colors ${
            activeView === 'channels' ? 'font-bold text-teal-600' : 'hover:text-teal-600'
          }`}
          onClick={() => handleViewToggle('channels')}
          aria-pressed={activeView === 'channels'}
        >
          Channels
        </button>
      </div>

      {/* SVG Chart Container */}
      <div className="relative max-w-[1200px] mx-auto mb-[100px]">
        {/* SVG Chart */}
        <div
          ref={svgRef}
          className="subtle-system-chart min-h-[400px] max-h-[550px] sm:h-[550px] sm:max-h-[80vh] max-w-full block mx-auto"
          dangerouslySetInnerHTML={{ __html: chartSvg }}
        />

        {/* Fullscreen Button */}
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreenToggle}
            icon={isFullscreen ? ArrowsPointingInIcon : ArrowsPointingOutIcon}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          />
        </div>

        {/* Article Previews */}
        <div className="text-left mt-[50px]">
          {items.map((item, index) => {
            const isActive = item.id === activeNode

            return (
              <div
                key={item.id}
                data-node-id={item.id}
                className={`hidden sm:block opacity-0 invisible transition-[visibility,opacity] duration-500 ease-in-out ${
                  isActive ? 'delay-0 block! opacity-100! visible!' : 'delay-0'
                } bg-white/50 shadow-[0_0_10px_5px_rgba(255,255,255,0.5)] sm:absolute sm:top-16 sm:w-80 sm:max-w-[45%] sm:mt-[70px] ${
                  index % 2 === 0 ? 'sm:left-0 sm:pr-0' : 'sm:right-0 sm:pl-0'
                } p-4 sm:p-8`}
              >
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {item.title}
                </h3>
                <p className="text-base mb-4 text-gray-700">
                  {item.description}
                </p>
                <a
                  href={item.linkHref}
                  className="inline-block text-teal-600 hover:text-teal-700 font-medium transition-colors"
                  aria-label={`Learn more about ${item.title}`}
                >
                  Learn More →
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
