import { ComponentProps } from 'react'
import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import type { HeroIcon } from '@/components/atoms/Icon/Icon'

/**
 * The icon each input type shows when the caller passes none. A table, not a
 * function: `@eslint-react/static-components` reads a call returning a
 * component as one created during render.
 */
const DEFAULT_ICONS: Partial<Record<NonNullable<ComponentProps<'input'>['type']>, HeroIcon>> = {
  search: MagnifyingGlassIcon,
  email: EnvelopeIcon,
  tel: PhoneIcon,
  url: GlobeAltIcon,
}

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
   * Icon on the right of the input. Omitted, the input type picks one from
   * `DEFAULT_ICONS`; `null` suppresses that default.
   */
  icon?: HeroIcon | null
}

/**
 * Input component for text entry.
 *
 * Provides consistent styling with validation states.
 * Supports all native input types and attributes.
 * Automatically displays appropriate icons for certain input types (search, email, tel, url).
 * Defaults to full width. Constrain width with max-w-* classes or a parent container.
 *
 * @example
 * <Input type="text" placeholder="Enter your name" />
 * <Input type="email" state="error" />
 * <Input type="password" state="success" />
 * <Input type="search" placeholder="Search..." className="max-w-sm" />
 * <Input type="search" icon={CustomIcon} />
 * <Input type="search" icon={null} /> // Explicitly disable icon
 */
export function Input({
  state = 'default',
  variant = 'default',
  icon,
  className = '',
  type,
  ref,
  ...props
}: InputProps) {
  // An explicit `icon`, `null` included, overrides the type's default.
  // `type` arrives unvalidated — FormBuilder passes a SahajCloud block type
  // through as a plain string — so an inherited `toString` must not read as
  // an icon and get rendered. A `Map` would say this, but the rule above
  // rejects a lookup call as a component built during render.
  const IconComponent =
    icon === undefined && type && Object.hasOwn(DEFAULT_ICONS, type) ? DEFAULT_ICONS[type] : icon

  const baseStyles =
    'px-3 py-3 font-sans text-base placeholder:text-gray-500 transition-colors duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed'

  const variantStyles = {
    default: 'border bg-white',
    minimal: 'border-0 border-b-2 bg-transparent',
  }

  const stateStyles = {
    default: 'text-gray-900 border-gray-300 hover:border-gray-400 focus:border-teal-500',
    error: 'text-error border-error hover:border-error-dark focus:border-error',
    success: 'text-gray-900 border-success hover:border-success focus:border-success',
  }

  // If no icon, render simple input
  if (!IconComponent) {
    return (
      <input
        ref={ref}
        aria-invalid={state === 'error'}
        className={`${baseStyles} ${variantStyles[variant]} ${stateStyles[state]} w-full ${className}`}
        type={type}
        {...props}
      />
    )
  }

  // With icon, render wrapped input with icon on the right
  return (
    <div className={`relative w-full ${className}`}>
      <input
        ref={ref}
        aria-invalid={state === 'error'}
        className={`${baseStyles} ${variantStyles[variant]} ${stateStyles[state]} w-full pr-10`}
        type={type}
        {...props}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <IconComponent aria-hidden="true" className="w-5 h-5 text-gray-800" />
      </div>
    </div>
  )
}
