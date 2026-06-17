import { ReactNode, useState } from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react'

/** Side of the trigger the tooltip prefers (it flips to stay on screen). */
export type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  /** The short text shown on hover or keyboard focus of the trigger. */
  label: ReactNode
  /** The trigger element the tooltip describes (e.g. an icon button). */
  children: ReactNode
  /**
   * Preferred side; the tooltip automatically flips to the opposite side and
   * shifts to stay within the viewport.
   * @default 'top'
   */
  side?: TooltipSide
  /**
   * Delay in milliseconds before the tooltip appears on hover (it hides
   * immediately). Keyboard focus shows it without delay.
   * @default 200
   */
  delay?: number
  /** Additional classes for the inline trigger wrapper. */
  className?: string
}

/**
 * A small text tooltip that appears on hover or keyboard focus, built on
 * Floating UI: it is viewport-aware (flips/shifts near edges), rendered in a
 * portal so it is never clipped, and wired with `role="tooltip"` +
 * `aria-describedby` for assistive tech. Dismisses on mouse-leave, blur, or
 * Escape.
 *
 * The trigger is wrapped in an inline element rather than cloned, so it works
 * with any child (including components that don't forward a ref); hover/focus
 * still resolve to the child via event bubbling.
 *
 * @example
 * <Tooltip label="Play a different background music track">
 *   <Button icon={ArrowPathRoundedSquareIcon} aria-label="Shuffle music track" />
 * </Tooltip>
 */
export function Tooltip({
  label,
  children,
  side = 'top',
  delay = 200,
  className = '',
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: side,
    whileElementsMounted: autoUpdate,
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
  })

  const hover = useHover(context, { move: false, delay: { open: delay, close: 0 } })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role])

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()} className={`inline-flex ${className}`}>
        {children}
      </span>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 max-w-xs rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
          >
            {label}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
