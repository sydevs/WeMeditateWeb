import { useState } from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  useHover,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  safePolygon,
  FloatingPortal,
} from '@floating-ui/react'
import { Button } from '../../atoms'
import { HeaderDropdown, type HeaderDropdownProps } from '../HeaderDropdown'

export interface HeaderNavDropdownProps {
  /** The nav trigger label (the featured page title, for example "About Meditation"). */
  label: string
  /** Mega-menu panel content, rendered in a portal when open. */
  dropdown: HeaderDropdownProps
  /**
   * Trigger theme, matching the surrounding nav.
   * @default 'light'
   */
  theme?: 'light' | 'dark'
  /** Extra classes for the trigger wrapper (for example flex sizing to match siblings). */
  className?: string
}

/**
 * A header-specific mega-menu wrapper that opens a {@link HeaderDropdown}
 * panel on hover or click of a nav item, positioned with Floating UI.
 *
 * This intentionally does not reuse the shared `Dropdown` atom: its panel
 * is a white rounded card with a min-width, which clashes with the
 * full-bleed gray mega menu. Instead this wires `@floating-ui/react`
 * directly, the same pattern as `Tooltip`. The panel renders in a
 * `FloatingPortal` with no extra chrome. `HeaderDropdown` owns all of the
 * visuals.
 *
 * Interaction:
 * - `useHover` and `safePolygon`, so the cursor can travel from the
 *   trigger onto the panel without it closing.
 * - `useClick`, so a tap or click also toggles it, which covers touch and
 *   no-hover devices.
 * - `useDismiss` (Escape and outside click) and `useRole({ role: 'dialog' })`.
 *
 * The trigger is a real `<Button>` carrying `aria-haspopup` and
 * `aria-expanded`, so it is keyboard-focusable and opens on Enter or Space.
 * The positioning and interaction props live on the wrapping element
 * instead, because Button does not forward a ref.
 */
export function HeaderNavDropdown({
  label,
  dropdown,
  theme = 'light',
  className = '',
}: HeaderNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom',
    // Fixed positioning, with no transform, keeps Floating UI's vertical
    // placement, below the nav and tracking the sticky state, while pinning
    // the panel to the viewport horizontally. Its inner max-w-7xl box then
    // centers to the page content area.
    strategy: 'fixed',
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [offset(0)],
  })

  const hover = useHover(context, { handleClose: safePolygon() })
  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'dialog' })

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss, role])

  return (
    <>
      {/*
       * The span is the positioning anchor, because Button does not forward
       * a ref. The interaction props and ARIA attributes — aria-haspopup,
       * aria-expanded, and aria-controls from useRole, plus the hover,
       * click, and keyboard handlers — go on the focusable Button instead,
       * so the popup contract lives on the element a keyboard or
       * assistive-tech user lands on.
       */}
      <span ref={refs.setReference} className={`flex ${className}`}>
        <Button
          className="px-0 w-full"
          size="sm"
          theme={theme}
          variant="ghost"
          {...getReferenceProps()}
        >
          {label}
        </Button>
      </span>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            // `left:0; right:0` (not `width:100vw`) spans the viewport content
            // area, excluding the scrollbar, so the open panel never adds a
            // horizontal scrollbar. The inner max-w-7xl box still centers to
            // the content area.
            style={{
              position: floatingStyles.position,
              top: floatingStyles.top,
              left: 0,
              right: 0,
            }}
            {...getFloatingProps()}
            className="z-50"
          >
            <HeaderDropdown {...dropdown} />
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
