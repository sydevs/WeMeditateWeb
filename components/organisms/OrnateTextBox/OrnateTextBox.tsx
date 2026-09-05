import { ComponentProps } from 'react'
import { Button, Container, Image } from '../../atoms'
import type { AspectRatio } from '../../../lib/cloudflare-images'
import ornateBackground from '../../../assets/ornate.svg'

export interface OrnateTextBoxProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Main heading.
   */
  title: string

  /**
   * Secondary line rendered directly below the title (faded but legible).
   */
  subtitle?: string

  /**
   * Description text. Blank-line or newline separated runs render as
   * separate paragraphs.
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
   * Image width in pixels, optional. Together with imageHeight, this prevents layout shift.
   */
  imageWidth?: number

  /**
   * Image height in pixels, optional. Together with imageWidth, this prevents layout shift.
   */
  imageHeight?: number

  /**
   * Nearest configured Cloudflare aspect ratio for the image. When set, and
   * when `imageSrc` is a Cloudflare URL, the browser fetches an optimized
   * variant and srcset instead of the full-resolution original. The image
   * still renders at its natural ratio: the ratio only selects the variant,
   * not a cropping box.
   */
  imageAspectRatio?: AspectRatio

  /**
   * Decorative vertical label along the outer edge (desktop only). Purely
   * ornamental. @default 'Ancient Wisdom'
   */
  sidetext?: string
}

/** Split a textarea string into paragraph runs on blank lines or newlines. */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/**
 * OrnateTextBox is the decorative "Ancient Wisdom" treatment for a feature
 * image and text block. It mirrors wemeditate.com's
 * `.cb-image-textbox--ornate` (dark variant): a warm-brown ground with a
 * large faded floral graphic on the right, a soft warm gradient that
 * lightens the left edge and bleeds above the block, light text, and a
 * faded vertical sidetext label.
 *
 * The layout is full-width and left-aligned, at least 80vh tall. The title
 * and subtitle sit above the body. The image floats left, and the body sits
 * in its own column beside it, clear of the left gradient. This reuses the
 * `Image` and `Button` atoms and the bundled `assets/ornate.svg` graphic. It
 * stacks on mobile.
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
  imageAspectRatio,
  sidetext = 'Ancient Wisdom',
  className = '',
  ...props
}: OrnateTextBoxProps) {
  const paragraphs = toParagraphs(description)

  return (
    <div
      className={`relative flex min-h-[80vh] items-center overflow-x-clip text-white ${className}`}
      {...props}
    >
      {/* Brown ground: the OrnateTextBox background, furthest back (-z-20).
          This is a separate layer, not the root's bg, so the gradient below
          can sit above it while still using a negative z-index. Note: the
          root has no `isolate`, so the negative-z layers join the page
          stacking context and render behind other blocks' text, where the
          gradient bleeds above this block. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(110deg,#8a6f56_0%,#6b5340_45%,#473729_100%)]"
      />

      {/* Large faded floral graphic, offset ~45% to the right, behind content */}
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[45%] -z-10 h-full w-[80%] object-cover object-left opacity-40"
        src={ornateBackground}
      />

      {/* Soft warm gradient that lightens the left edge. It extends above
          the block (the gradient--ornate ::before). It uses a negative
          z-index, so it sits over the brown ground but behind text from the
          block above. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 bottom-0 left-0 -z-10 w-1/3 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.18)_25%,rgba(255,196,175,0.6)_100%)]"
      />

      {/* Decorative vertical sidetext label (desktop only, single line) */}
      {sidetext && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 right-12 z-10 hidden -translate-y-1/2 rotate-180 select-none whitespace-nowrap text-2xl font-light uppercase tracking-[0.12em] text-white/75 [writing-mode:vertical-rl] lg:block"
        >
          {sidetext}
        </span>
      )}

      {/* Content, capped to a readable width through a Container. The brown
          ground, floral graphic, and gradient stay full-bleed behind it. On
          lg and larger, the centered container's right margin can shrink to
          where the sidetext sits, so this reserves a right gutter
          (lg:pr-24) to keep the body clear of it. */}
      <Container className="relative z-10 py-12 lg:py-20 lg:pr-24" maxWidth="md">
        {/* Title and subtitle header, above the body */}
        <div className="mb-8 lg:mb-6">
          <h2 className="text-2xl font-light lg:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 text-base font-light text-white/80">{subtitle}</p>}
        </div>

        {/* Feature image — floats left, beside the body column */}
        <div className="mb-6 w-full lg:float-left lg:mr-12 lg:mb-4 lg:w-[44%]">
          <Image
            alt={imageAlt}
            aspectRatio={imageAspectRatio}
            className="w-full"
            forceAspectRatio={false}
            height={imageHeight}
            objectFit="cover"
            sizes="(max-width: 1024px) 100vw, 400px"
            src={imageSrc}
            width={imageWidth}
          />
        </div>

        {/* Body: its own block-formatting context, so it stays a clean
            column beside the gradient and never wraps back under the image. */}
        <div className="space-y-5 text-base font-light leading-relaxed text-white/90 lg:flow-root">
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
      </Container>
    </div>
  )
}
