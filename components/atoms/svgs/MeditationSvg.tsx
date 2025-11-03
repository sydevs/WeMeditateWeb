import { ComponentProps } from 'react'

export interface MeditationSvgProps extends ComponentProps<'svg'> {}

/**
 * Person sitting in meditation pose (lotus position).
 * Used in call-to-action sections.
 * Original viewBox: 0 0 100 100
 */
export function MeditationSvg({ className = 'w-24 h-24', ...props }: MeditationSvgProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Head */}
      <circle cx="50" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />

      {/* Torso */}
      <path
        d="M 50 28 L 50 50"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Arms in meditation pose */}
      <path
        d="M 50 35 Q 40 38 35 45 Q 32 50 30 52"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 50 35 Q 60 38 65 45 Q 68 50 70 52"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Hands resting on knees */}
      <circle cx="30" cy="52" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="70" cy="52" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />

      {/* Legs in lotus position */}
      <path
        d="M 50 50 Q 35 55 25 60 Q 20 62 18 65"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 50 50 Q 65 55 75 60 Q 80 62 82 65"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Feet crossed */}
      <path
        d="M 18 65 Q 22 68 28 68 Q 35 68 42 65"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 82 65 Q 78 68 72 68 Q 65 68 58 65"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
