import { ComponentProps, forwardRef } from 'react'
import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import type { HeroIcon } from '../Icon/Icon'

export interface InputProps extends ComponentProps<'input'> {
  /**
   * Validation state
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success'

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: 'default' | 'minimal'

  /**
   * Optional icon to display on the right side of the input
   * If not provided, default icons will be used for certain input types:
   * - search: MagnifyingGlassIcon
   * - email: EnvelopeIcon
   * - tel: PhoneIcon
   * - url: GlobeAltIcon
   * Set to null to explicitly disable icon for these types
   */
  icon?: HeroIcon | null
}

/**
 * Input component for text entry.
 *
 * Provides consistent styling with validation states.
 * Supports all native input types and attributes.
 * Automatically displays appropriate icons for certain input types (search, email, tel, url).
 * Defaults to full width - constrain width using max-w-* classes or parent container.
 *
 * @example
 * <Input type="text" placeholder="Enter your name" />
 * <Input type="email" state="error" />
 * <Input type="password" state="success" />
 * <Input type="search" placeholder="Search..." className="max-w-sm" />
 * <Input type="search" icon={CustomIcon} />
 * <Input type="search" icon={null} /> // Explicitly disable icon
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ state = 'default', variant = 'default', icon, className = '', type, ...props }, ref) => {
    // Determine which icon to display
    const getDefaultIcon = (): HeroIcon | null => {
      // If icon is explicitly set (including null), use that
      if (icon !== undefined) {
        return icon
      }

      // Otherwise, use default icons based on input type
      switch (type) {
        case 'search':
          return MagnifyingGlassIcon
        case 'email':
          return EnvelopeIcon
        case 'tel':
          return PhoneIcon
        case 'url':
          return GlobeAltIcon
        default:
          return null
      }
    }

    const IconComponent = getDefaultIcon()

    const baseStyles =
      'px-3 py-3 font-sans text-base placeholder:text-gray-500 transition-colors duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed'

    const variantStyles = {
      default: 'border bg-white',
      minimal: 'border-0 border-b-2 bg-transparent',
    }

    const stateStyles = {
      default:
        'text-gray-900 border-gray-300 hover:border-gray-400 focus:border-teal-500',
      error:
        'text-error border-error hover:border-error-dark focus:border-error',
      success:
        'text-gray-900 border-success hover:border-success focus:border-success',
    }

    // If no icon, render simple input
    if (!IconComponent) {
      return (
        <input
          ref={ref}
          type={type}
          className={`${baseStyles} ${variantStyles[variant]} ${stateStyles[state]} w-full ${className}`}
          aria-invalid={state === 'error'}
          {...props}
        />
      )
    }

    // With icon, render wrapped input with icon on the right
    return (
      <div className={`relative w-full ${className}`}>
        <input
          ref={ref}
          type={type}
          className={`${baseStyles} ${variantStyles[variant]} ${stateStyles[state]} w-full pr-10`}
          aria-invalid={state === 'error'}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <IconComponent className="w-5 h-5 text-gray-800" aria-hidden="true" />
        </div>
      </div>
    )
  }
)

Input.displayName = 'Input'
