import { ComponentProps } from 'react'

export interface LocationSvgProps extends ComponentProps<'svg'> {}

/**
 * Location pin icon.
 * Used in call-to-action sections for finding classes.
 * Original viewBox: 0 0 100 100
 */
export function LocationSvg({ className = 'w-24 h-24', ...props }: LocationSvgProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Pin shape */}
      <path
        d="M 50 10 C 35 10 25 20 25 35 C 25 45 30 55 50 80 C 70 55 75 45 75 35 C 75 20 65 10 50 10 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Inner circle */}
      <circle cx="50" cy="35" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}
