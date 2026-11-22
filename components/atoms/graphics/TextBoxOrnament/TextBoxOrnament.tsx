import { CircleDecorationSvg, TriangleDecorationSvg } from '@/components/atoms/graphics/svgs'
import type { TextBoxDecoration } from '@/lib/content/blocks'

export interface TextBoxOrnamentProps {
  /** Which of the three ornaments to draw. */
  decoration: TextBoxDecoration
  /**
   * The side of the positioned ancestor to hang it on. Each organism works
   * this out from its own layout, so `side` means one thing here: the
   * triangle and the wash take the image's outer side, the circle its inner
   * one, and an overlay's triangle the corner away from its text.
   */
  side: 'left' | 'right'
}

const SIDES = {
  circle: { left: '-left-24', right: '-right-24' },
  gradient: {
    left: 'left-0 right-[40%] bg-linear-to-l',
    right: 'left-[40%] right-0 bg-linear-to-r',
  },
  triangle: { left: 'left-6', right: 'right-6' },
}

const BASE = 'pointer-events-none absolute hidden lg:block'

/**
 * One ornament of the three wemeditate.com hung off its text boxes, drawn
 * from `lg` up and out of the a11y tree. `textBoxDecoration` in
 * lib/content/blocks.ts picks which.
 *
 * Both text-box organisms draw it from here. Their class lists were identical
 * but for the offset while `align` meant the opposite side in each, so the two
 * read as contradicting one another.
 */
export function TextBoxOrnament({ decoration, side }: TextBoxOrnamentProps) {
  if (decoration === 'gradient') {
    return (
      <div
        aria-hidden="true"
        className={`${BASE} -bottom-28 -z-10 h-56 from-teal-100 to-transparent mask-b-from-50% ${SIDES.gradient[side]}`}
      />
    )
  }

  if (decoration === 'circle') {
    return (
      <CircleDecorationSvg
        aria-hidden="true"
        className={`${BASE} -bottom-24 -z-10 h-auto w-80 text-line-subtle ${SIDES.circle[side]}`}
      />
    )
  }

  return (
    <TriangleDecorationSvg
      aria-hidden="true"
      className={`${BASE} bottom-0 h-auto w-60 translate-y-1/3 2xl:w-72 ${SIDES.triangle[side]}`}
    />
  )
}
