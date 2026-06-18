import { ComponentProps } from 'react'
import { Button, Image } from '../../atoms'
import ornateBackground from '../../../assets/ornate.svg'

export interface OrnateTextBoxProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Main heading/title
   */
  title: string

  /**
   * Secondary line rendered directly below the title (faded but legible).
   */
  subtitle?: string

  /**
   * Description text. Blank-line / newline separated runs render as separate
   * paragraphs.
   */
  description: string

  /**
   * Call-to-action button text. When omitted, no CTA button is rendered.
   */
  ctaText?: string

  /**
   * Call-to-action button destination URL (used when `ctaText` is set).
   */
  ctaHref?: string

  /**
   * Feature image source URL
   */
  imageSrc: string

  /**
   * Image alternative text for accessibility
   */
  imageAlt: string

  /**
   * Image width in pixels (optional). With imageHeight, prevents layout shift.
   */
  imageWidth?: number

  /**
   * Image height in pixels (optional). With imageWidth, prevents layout shift.
   */
  imageHeight?: number

  /**
   * Image position (the title + image form a column the text wraps around).
   * @default 'left'
   */
  align?: 'left' | 'right'

  /**
   * Decorative vertical label along the outer edge (desktop only). Purely
   * ornamental. @default 'Ancient Wisdom'
   */
  sidetext?: string
}

/** Split a textarea string into paragraph runs on blank lines / newlines. */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/**
 * OrnateTextBox is the decorative "Ancient Wisdom" treatment for a feature
 * image + text block. It mirrors wemeditate.com's `.cb-image-textbox--ornate`
 * (dark variant): a warm-brown ground with a large faded floral graphic on the
 * far side, a soft warm gradient lightening the image edge, light text, and a
 * faded vertical sidetext label.
 *
 * Full-width: the title + image form a floated column that the body text wraps
 * around (reclaiming the full width below the image), with the body kept to the
 * side of the gradient. Reuses the `Image` and `Button` atoms and the bundled
 * `assets/ornate.svg` graphic. Stacks on mobile.
 *
 * @example
 * <OrnateTextBox
 *   title="A Mother's Love"
 *   description={"In every culture…\n\nIn Hinduism…"}
 *   imageSrc="/images/durga.jpg"
 *   imageAlt="Goddess Durga"
 * />
 */
export function OrnateTextBox({
  title,
  subtitle,
  description,
  ctaText,
  ctaHref,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  align = 'left',
  sidetext = 'Ancient Wisdom',
  className = '',
  ...props
}: OrnateTextBoxProps) {
  const imageOnRight = align === 'right'
  const paragraphs = toParagraphs(description)

  return (
    <div
      className={`relative isolate w-full overflow-hidden text-white [background-image:linear-gradient(110deg,#8a6f56_0%,#6b5340_45%,#473729_100%)] ${className}`}
      {...props}
    >
      {/* Large faded floral graphic anchored to the image side, behind content */}
      <img
        alt=""
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 z-0 h-full w-[80%] object-cover opacity-60 ${
          imageOnRight ? 'left-0 object-left' : 'right-0 object-right'
        }`}
        src={ornateBackground}
      />

      {/* Soft warm gradient that lightens the image-side edge (the ::before) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 z-0 w-1/3 ${
          imageOnRight
            ? 'right-0 [background-image:linear-gradient(270deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.18)_25%,rgba(255,196,175,0.6)_100%)]'
            : 'left-0 [background-image:linear-gradient(90deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.18)_25%,rgba(255,196,175,0.6)_100%)]'
        }`}
      />

      {/* Decorative vertical sidetext label (desktop only) */}
      {sidetext && (
        <span
          aria-hidden="true"
          className={`absolute top-1/2 z-10 hidden -translate-y-1/2 rotate-180 select-none text-4xl font-light uppercase tracking-[0.12em] text-white/75 [writing-mode:vertical-rl] lg:block ${
            imageOnRight ? 'left-6' : 'right-6'
          }`}
        >
          {sidetext}
        </span>
      )}

      {/* Content. Asymmetric desktop padding reserves the sidetext side and
          insets the title/image column, keeping the body in its own narrower
          column to the side of the gradient. */}
      <div
        className={`relative z-10 mx-auto max-w-[2000px] px-8 py-12 lg:py-24 ${
          imageOnRight ? 'lg:pr-[11%] lg:pl-[16%]' : 'lg:pl-[11%] lg:pr-[16%]'
        }`}
      >
        {/* Title + image form a floated column; the body text wraps around it */}
        <div
          className={`mb-8 lg:mb-0 lg:w-[32%] ${
            imageOnRight ? 'lg:float-right lg:ml-12' : 'lg:float-left lg:mr-12'
          }`}
        >
          <h2 className="text-3xl font-light lg:text-4xl">{title}</h2>
          {subtitle && <p className="mt-2 text-lg font-light text-white/80">{subtitle}</p>}

          <Image
            alt={imageAlt}
            className="mt-8 w-full"
            height={imageHeight}
            objectFit="cover"
            src={imageSrc}
            width={imageWidth}
          />
        </div>

        {/* Body text — wraps around the floated column, reclaiming width below it */}
        <div className="space-y-5 text-base font-light leading-relaxed text-white/90">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}

          {ctaText && ctaHref && (
            <Button
              className="mt-2 border-white text-white"
              href={ctaHref}
              size="lg"
              theme="dark"
              variant="outline"
            >
              {ctaText}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
