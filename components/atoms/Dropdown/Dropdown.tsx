import { ComponentProps, ReactNode, useEffect, useRef, useState } from 'react'

/**
 * Props for the Dropdown component
 */
export interface DropdownProps {
  /** The trigger element that opens/closes the dropdown */
  trigger: ReactNode
  /** The content to display in the dropdown */
  children: ReactNode
  /** Alignment of the dropdown relative to trigger */
  align?: 'left' | 'right'
  /** Size variant controlling spacing and dimensions */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes for the trigger wrapper */
  className?: string
  /** Controlled open state (optional - if not provided, uses internal state) */
  isOpen?: boolean
  /** Callback when open state changes (for controlled mode) */
  onOpenChange?: (isOpen: boolean) => void
  /** Open dropdown when trigger receives focus */
  openOnFocus?: boolean
  /** Close dropdown when trigger loses focus */
  closeOnBlur?: boolean
  /** Make dropdown width match trigger width (useful for autocomplete) */
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

/**
 * A generic dropdown component with keyboard accessibility.
 * Handles click-outside and Escape key to close.
 * Supports both controlled and uncontrolled modes.
 *
 * @example
 * Uncontrolled (default):
 * <Dropdown trigger={<button>Open Menu</button>}>
 *   <DropdownItem href="/link1">Link 1</DropdownItem>
 *   <DropdownItem href="/link2">Link 2</DropdownItem>
 * </Dropdown>
 *
 * Controlled with focus behavior:
 * <Dropdown
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   openOnFocus={true}
 *   fullWidth={true}
 *   trigger={<Input />}
 * >
 *   Autocomplete suggestions
 * </Dropdown>
 */
export function Dropdown({
  trigger,
  children,
  align = 'left',
  size = 'md',
  className = '',
  isOpen: controlledIsOpen,
  onOpenChange,
  openOnFocus = false,
  closeOnBlur = false,
  fullWidth = false,
}: DropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = (value: boolean) => {
    if (controlledIsOpen !== undefined) {
      // Controlled mode - call callback
      onOpenChange?.(value)
    } else {
      // Uncontrolled mode - update internal state
      setInternalIsOpen(value)
    }
  }

  const sizeWidthStyles = {
    sm: 'min-w-56',  // 224px (14rem)
    md: 'min-w-64',  // 256px (16rem)
    lg: 'min-w-72',  // 288px (18rem)
  }

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div
      ref={dropdownRef}
      className={`relative ${fullWidth ? 'w-full' : 'inline-block'} ${className}`}
    >
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={() => {
          if (!openOnFocus) {
            setIsOpen(!isOpen)
          }
        }}
        onFocus={() => {
          if (openOnFocus) {
            setIsOpen(true)
          }
        }}
        onBlur={(e) => {
          if (closeOnBlur) {
            // Check if focus is moving to dropdown content
            if (
              dropdownRef.current &&
              !dropdownRef.current.contains(e.relatedTarget as Node)
            ) {
              setIsOpen(false)
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (!openOnFocus) {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={openOnFocus ? '' : 'cursor-pointer'}
      >
        {trigger}
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-white border border-gray-200 shadow-lg ${
            fullWidth ? 'w-full' : sizeWidthStyles[size]
          } ${align === 'right' ? 'right-0' : 'left-0'}`}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  )
}
