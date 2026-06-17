import { ComponentProps, ReactNode, useState } from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
  type Placement,
} from '@floating-ui/react'

/** Side of the trigger the panel opens on. */
export type DropdownSide = 'top' | 'bottom' | 'left' | 'right'

/**
 * Alignment of the panel along the chosen side. `'left'`/`'right'` are kept as
 * aliases for `'start'`/`'end'` so existing callers don't have to change.
 */
export type DropdownAlign = 'start' | 'center' | 'end' | 'left' | 'right'

/** ARIA role applied to the panel (and wired into the trigger). */
export type DropdownRole = 'menu' | 'dialog' | 'listbox'

/**
 * Props for the Dropdown component
 */
export interface DropdownProps {
  /** The trigger element that opens/closes the dropdown */
  trigger: ReactNode
  /** The content to display in the dropdown */
  children: ReactNode
  /**
   * Side of the trigger the panel opens on. The panel automatically flips to the
   * opposite side and shifts along the cross-axis to stay within the viewport.
   * @default 'bottom'
   */
  side?: DropdownSide
  /**
   * Alignment of the panel along `side`. `'left'`/`'right'` are accepted as
   * aliases for `'start'`/`'end'`.
   * @default 'start'
   */
  align?: DropdownAlign
  /**
   * ARIA role for the panel — `'menu'` for action lists, `'listbox'` for
   * autocomplete results, `'dialog'` for rich content panels.
   * @default 'menu'
   */
  role?: DropdownRole
  /**
   * Accessible name for the panel. Recommended for `role="dialog"` panels so the
   * popover is announced (e.g. "Audio settings").
   */
  ariaLabel?: string
  /** Size variant controlling the panel's minimum width */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes for the trigger wrapper */
  className?: string
  /** Controlled open state (optional - if not provided, uses internal state) */
  isOpen?: boolean
  /** Callback when open state changes (for controlled mode) */
  onOpenChange?: (isOpen: boolean) => void
  /** Open dropdown when the trigger (or a child of it) receives focus */
  openOnFocus?: boolean
  /** Close dropdown when focus leaves the trigger and the panel */
  closeOnBlur?: boolean
  /** Make the panel width match the trigger width (useful for autocomplete) */
  fullWidth?: boolean
}

/**
 * Props for the DropdownItem component
 */
export interface DropdownItemProps extends ComponentProps<'a'> {
  /** Size variant - inherited from parent Dropdown if not specified */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

/**
 * DropdownItem component for consistent dropdown item styling.
 * Use this for individual items within a Dropdown.
 */
export function DropdownItem({
  size = 'md',
  className = '',
  children,
  ...props
}: DropdownItemProps) {
  const sizeStyles = {
    sm: 'px-4 py-2.5 text-sm',
    md: 'px-5 py-3.5 text-sm',
    lg: 'px-6 py-4 text-base',
  }

  return (
    <a
      className={`block hover:bg-gray-100 font-medium text-gray-700 transition-colors ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </a>
  )
}

const sizeWidthStyles = {
  sm: 'min-w-56', // 224px (14rem)
  md: 'min-w-64', // 256px (16rem)
  lg: 'min-w-72', // 288px (18rem)
}

/** Map the friendly `side` + `align` props to a Floating UI placement. */
function toPlacement(side: DropdownSide, align: DropdownAlign): Placement {
  const alignment = align === 'left' ? 'start' : align === 'right' ? 'end' : align

  return alignment === 'center' ? side : (`${side}-${alignment}` as Placement)
}

/**
 * A generic popover/dropdown with viewport-aware placement, keyboard
 * accessibility, and click-outside / Escape dismissal.
 *
 * Positioning is handled by Floating UI: the panel opens on `side`, automatically
 * **flips** to the opposite side when there isn't room, and **shifts** along the
 * cross-axis to stay on screen. The panel is rendered in a portal, so it is never
 * clipped by an ancestor's `overflow` or `@container`/transform context.
 *
 * Supports both click-to-open (default) and focus-to-open (`openOnFocus`, for
 * autocomplete) modes, and controlled or uncontrolled open state.
 *
 * @example
 * // Uncontrolled menu (default)
 * <Dropdown trigger={<button>Open Menu</button>}>
 *   <DropdownItem href="/link1">Link 1</DropdownItem>
 * </Dropdown>
 *
 * @example
 * // Rich panel opening above and centered on the trigger
 * <Dropdown side="top" align="center" role="dialog" trigger={<IconButton />}>
 *   <VolumeControls />
 * </Dropdown>
 *
 * @example
 * // Controlled autocomplete matching the input width
 * <Dropdown
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   openOnFocus
 *   closeOnBlur
 *   fullWidth
 *   role="listbox"
 *   trigger={<Input />}
 * >
 *   {suggestions}
 * </Dropdown>
 */
export function Dropdown({
  trigger,
  children,
  side = 'bottom',
  align = 'start',
  role: roleProp = 'menu',
  ariaLabel,
  size: sizeVariant = 'md',
  className = '',
  isOpen: controlledIsOpen,
  onOpenChange,
  openOnFocus = false,
  closeOnBlur = false,
  fullWidth = false,
}: DropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  // Use controlled state if provided, otherwise internal state.
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen
  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value)
    } else {
      setInternalIsOpen(value)
    }
  }

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: toPlacement(side, align),
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      // Match the panel width to the trigger (e.g. autocomplete under an input).
      ...(fullWidth
        ? [
            size({
              apply({ rects, elements }) {
                elements.floating.style.width = `${rects.reference.width}px`
              },
            }),
          ]
        : []),
    ],
  })

  // Click-to-open for the default mode. Focus-to-open is handled with React's
  // (bubbling) onFocus/onBlur below, because Floating UI's useFocus binds native
  // focus on the reference element, which does not fire when a *child* of the
  // trigger (e.g. an autocomplete <input/>) is focused.
  const click = useClick(context, { enabled: !openOnFocus })
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: roleProp })

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const focusProps = openOnFocus
    ? {
        onFocus: () => setIsOpen(true),
        onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
          if (!closeOnBlur) return
          // Keep open while focus moves into the panel (which lives in a portal,
          // so check the floating element, not a DOM descendant of the trigger).
          const next = event.relatedTarget as Node | null

          if (next && refs.floating.current?.contains(next)) return
          setIsOpen(false)
        },
      }
    : {}

  return (
    <>
      <div
        ref={refs.setReference}
        {...getReferenceProps({
          ...focusProps,
          // In click mode the wrapper is the focusable button (callers may keep
          // their inner control out of the tab order). In focus mode the inner
          // control (e.g. an Input) owns focus, so the wrapper stays transparent.
          ...(openOnFocus ? {} : { role: 'button', tabIndex: 0 }),
        })}
        className={`${fullWidth ? 'w-full' : 'inline-block'} ${
          openOnFocus ? '' : 'cursor-pointer'
        } ${className}`}
      >
        {trigger}
      </div>

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            // Non-modal so background stays interactive; don't pull focus into the
            // panel on open (preserves autocomplete typing / avoids focus jumps).
            disabled={openOnFocus}
            initialFocus={-1}
            modal={false}
            returnFocus={!openOnFocus}
          >
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps({ 'aria-label': ariaLabel })}
              className={`z-50 rounded-lg border border-gray-200 bg-white shadow-xl ${
                fullWidth ? '' : sizeWidthStyles[sizeVariant]
              }`}
            >
              {children}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}
