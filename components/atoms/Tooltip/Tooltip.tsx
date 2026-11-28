import { ReactNode, cloneElement, isValidElement, useState } from 'react'
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
  /** The trigger element the tooltip describes (for example an icon button). */
  children: ReactNode
  /**
   * Preferred side. The tooltip automatically flips to the opposite side
   * and shifts to stay within the viewport.
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
 * Floating UI. It is viewport-aware, flipping and shifting near edges,
 * rendered in a portal so it is never clipped, and wired with
 * `role="tooltip"` and `aria-describedby` for assistive tech. It dismisses
 * on mouse-leave, blur, or Escape.
 *
 * An inline wrapper takes the ref and the hover and focus handlers, so any
 * child works; hover and focus reach it from the child by bubbling. The
 * child itself carries `aria-describedby`, because a description belongs on
 * the control a screen reader announces, not on a `<span>` around it.
 *
 * @example
 * <Tooltip label="Change background music track">
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
  const { 'aria-describedby': describedBy, ...referenceProps } = getReferenceProps()

  // shortcut: only a single element child is described, as in `FormField`.
  // Upgrade when a caller wraps a fragment or several controls.
  const trigger =
    typeof describedBy === 'string' && isValidElement<{ 'aria-describedby'?: string }>(children)
      ? // The control is the caller's element, so nothing but `cloneElement`
        // can put an attribute on it.
        // eslint-disable-next-line @eslint-react/no-clone-element
        cloneElement(children, {
          'aria-describedby': [children.props['aria-describedby'], describedBy]
            .filter(Boolean)
            .join(' '),
        })
      : children

  return (
    <>
      <span ref={refs.setReference} {...referenceProps} className={`inline-flex ${className}`}>
        {trigger}
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
