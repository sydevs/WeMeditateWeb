import { ComponentProps } from 'react'

export interface SimpleLeafSvgProps extends ComponentProps<'svg'> {}

/**
 * Simplified leaf ornament with white fill.
 * Features only the main central leaf without side decorations.
 */
export function SimpleLeafSvg({ className = 'w-6 h-6', ...props }: SimpleLeafSvgProps) {
  return (
    <svg
      viewBox="0 0 13 20"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      {...props}
    >
      <path d="M6.49999 11.6311C4.61344 9.8711 1.97226 5.2071 6.49999 0.631104C8.38656 2.53777 11.0277 7.4071 6.49999 11.6311Z" fill="white"/>
      <path d="M4.10571 7.44304L6.51416 9.57491M4.17613 4.9072L6.51416 6.97689M4.85219 2.91209L6.51416 4.3789M6.50007 0.631062L6.50007 12.1294" stroke="currentColor" strokeWidth="0.5"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M4 6.38023C4 3.8941 5.00704 1.7809 6.5 0.631062C7.99296 1.7809 9 3.92518 9 6.38023C9 8.83528 7.99296 10.9796 6.5 12.1294C5.00704 10.9796 4 8.84149 4 6.38023Z" stroke="currentColor"/>
    </svg>
  )
}
