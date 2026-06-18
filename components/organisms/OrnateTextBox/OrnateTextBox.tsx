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
 * right, a soft warm gradient lightening the left edge (and bleeding above the
 * block), light text, and a faded vertical sidetext label.
 *
 * Full-width and left-aligned: the title + subtitle sit above the body; the
 * image floats left and the body text wraps around it, reclaiming the full
 * width below. Reuses the `Image` and `Button` atoms and the bundled
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
  sidetext = 'Ancient Wisdom',
  className = '',
  ...props
}: OrnateTextBoxProps) {
  const paragraphs = toParagraphs(description)

  return (
    <div
      className={`relative isolate w-full [background-image:linear-gradient(110deg,#8a6f56_0%,#6b5340_45%,#473729_100%)] text-white ${className}`}
      {...props}
    >
      {/* Large faded floral graphic on the right, behind content */}
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-0 h-full w-[80%] object-cover object-right opacity-60"
        src={ornateBackground}
      />

      {/* Soft warm gradient lightening the left edge — extends above the block
          (the gradient--ornate ::before). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 bottom-0 left-0 z-0 w-1/3 [background-image:linear-gradient(90deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.18)_25%,rgba(255,196,175,0.6)_100%)]"
      />

      {/* Decorative vertical sidetext label (desktop only, single line) */}
      {sidetext && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 right-6 z-10 hidden -translate-y-1/2 rotate-180 select-none whitespace-nowrap text-4xl font-light uppercase tracking-[0.12em] text-white/75 [writing-mode:vertical-rl] lg:block"
        >
          {sidetext}
        </span>
      )}

      {/* Content. Asymmetric desktop padding insets the column and reserves the
          sidetext side. */}
      <div className="relative z-10 mx-auto max-w-[2000px] px-8 py-12 lg:py-20 lg:pl-[11%] lg:pr-[16%]">
        {/* Title + subtitle header, above the body */}
        <div className="mb-8 lg:mb-6">
          <h2 className="text-2xl font-light lg:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 text-base font-light text-white/80">{subtitle}</p>}
        </div>

        {/* Feature image — floats left so the body text wraps around it */}
        <div className="mb-6 w-full lg:float-left lg:mr-12 lg:mb-4 lg:w-[44%]">
          <Image
            alt={imageAlt}
            className="w-full"
            height={imageHeight}
            objectFit="cover"
            src={imageSrc}
            width={imageWidth}
          />
        </div>

        {/* Body text — wraps around the floated image, reclaiming width below it */}
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
