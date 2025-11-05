import { ComponentProps } from 'react'

export interface AnimatedLogoSvgProps extends ComponentProps<'svg'> {}

/**
 * Animated WeMeditate logo SVG used for loading states.
 *
 * Features a three-part drawing animation that loops continuously.
 * The animation uses stroke-dasharray and stroke-dashoffset to create
 * a hand-drawn effect.
 *
 * @example
 * <AnimatedLogoSvg className="w-24 h-24" />
 */
export function AnimatedLogoSvg({ className = 'w-12 h-12', ...props }: AnimatedLogoSvgProps) {
  return (
    <svg
      id="animated-logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 94.44"
      className={className}
      {...props}
    >
      <defs>
        <style>{`
          .animated-logo-stroke {
            fill: none;
            stroke: currentColor;
            stroke-miterlimit: 10;
            stroke-width: 3px;
          }
          .animated-logo-path-0 {
            stroke-dasharray: 202 204;
            stroke-dashoffset: 203;
            animation: animated-logo-draw-0 3200ms linear 0ms infinite,
                       animated-logo-fade 3200ms linear 0ms infinite;
          }
          .animated-logo-path-1 {
            stroke-dasharray: 148 150;
            stroke-dashoffset: 149;
            animation: animated-logo-draw-1 3200ms linear 0ms infinite,
                       animated-logo-fade 3200ms linear 0ms infinite;
          }
          .animated-logo-path-2 {
            stroke-dasharray: 149 151;
            stroke-dashoffset: 150;
            animation: animated-logo-draw-2 3200ms linear 0ms infinite,
                       animated-logo-fade 3200ms linear 0ms infinite;
          }
          @keyframes animated-logo-draw {
            to {
              stroke-dashoffset: 0;
            }
          }
          @keyframes animated-logo-fade {
            0%, 87.5% {
              stroke-opacity: 1;
            }
            to {
              stroke-opacity: 0;
            }
          }
          @keyframes animated-logo-draw-0 {
            25% {
              stroke-dashoffset: 203;
            }
            66.66666666666667%, to {
              stroke-dashoffset: 0;
            }
          }
          @keyframes animated-logo-draw-1 {
            35.416666666666664% {
              stroke-dashoffset: 149;
            }
            77.08333333333334%, to {
              stroke-dashoffset: 0;
            }
          }
          @keyframes animated-logo-draw-2 {
            45.83333333333333% {
              stroke-dashoffset: 150;
            }
            87.5%, to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      </defs>
      <title>WeMeditate Animated Logo</title>
      <path
        className="animated-logo-stroke animated-logo-path-0"
        d="M99.49 70.45a61.66 61.66 0 0 1-18.44 44.12c-.3.29-.61.6-.93.89-.48-.46-1-.93-1.44-1.4a61.58 61.58 0 0 1-17.94-43.6V68.8a61.48 61.48 0 0 1 19.38-43.34 61.55 61.55 0 0 1 19.33 42.89c.03.65.04 1.39.04 2.1z"
        transform="translate(-15.86 -23.4)"
      />
      <path
        className="animated-logo-stroke animated-logo-path-1"
        d="M99.45 68.35a61.49 61.49 0 0 1 42.88-15.65A61.89 61.89 0 0 1 81 116.32h-2.29"
        transform="translate(-15.86 -23.4)"
      />
      <path
        className="animated-logo-stroke animated-logo-path-2"
        d="M81 116.32h-2.29A61.91 61.91 0 0 1 17.39 52.7a61.57 61.57 0 0 1 43.38 16.07"
        transform="translate(-15.86 -23.4)"
      />
    </svg>
  )
}
