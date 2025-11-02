import { ReactNode, useEffect, useRef, useState } from 'react'

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
  /** Additional CSS classes for the trigger wrapper */
  className?: string
}

/**
 * A generic dropdown component with keyboard accessibility.
 * Handles click-outside and Escape key to close.
 *
 * @example
 * ```tsx
 * <Dropdown trigger={<button>Open Menu</button>}>
 *   <a href="/link1">Link 1</a>
 *   <a href="/link2">Link 2</a>
 * </Dropdown>
 * ```
 */
export function Dropdown({ trigger, children, align = 'left', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  )
}
