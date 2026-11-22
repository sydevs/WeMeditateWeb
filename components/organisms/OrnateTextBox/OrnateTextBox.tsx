import { ComponentProps } from 'react'
import { Button, Container, Image } from '@/components/atoms'
import type { AspectRatio } from '@/lib/media/cloudflare-images'
import { toParagraphs } from '@/lib/content/paragraphs'
import ornateBackground from '@/assets/ornate.svg'

export interface OrnateTextBoxProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Main heading. */
  title: string

  /** Secondary line rendered directly below the title. */
  subtitle?: string

  /** Description text. Each line break starts a new paragraph. */
  description: string

  /** Call-to-action button text. When omitted, no CTA button is rendered. */
  ctaText?: string

  /** Call-to-action button destination URL (used when `ctaText` is set). */
  ctaHref?: string

  /** Feature image source URL */
  imageSrc: string

  /** Image alternative text for accessibility */
  imageAlt: string

  /** Image width in pixels, optional. Together with imageHeight, this prevents layout shift. */
  imageWidth?: number

  /** Image height in pixels, optional. Together with imageWidth, this prevents layout shift. */
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
   * ornamental, and absent it draws nothing.
   *
   * It used to default to `blocks.general.wisdom_sidetext`. That key is
   * declared in SahajCloud's schema but holds no English yet
   * (sydevs/SahajCloud#1218), so every wisdom-style block painted the key
   * path down its own edge. Restore the default once the key answers.
   */
  sidetext?: string

  /**
   * Which side the image column takes, at `lg` and above. The warm gradient
   * follows it at every width, faint below `lg` and full from `lg` up; the
   * floral graphic and the sidetext never move.
   * - left: image on the left, body column on the right
   * - right: image on the right, body column on the left
   * @default 'left'
   */
  align?: 'left' | 'right'
}

/**
 * OrnateTextBox is the decorative "Ancient Wisdom" treatment for a feature
 * image and text block. It mirrors wemeditate.com's
 * `.cb-image-textbox--ornate` (dark variant): a warm-brown ground with a
 * large faded floral graphic on the right, a soft warm gradient that
 * lightens the image's edge and bleeds above the block, light text, and a
 * faded vertical sidetext label.
 *
 * The layout is full-width, at least 80vh tall. At `lg` it is two grid
 * columns: the image on the `align` side, and the title, subtitle and body
 * stacked in the column beside it, clear of the gradient. This reuses the
 * `Image` and `Button` atoms and the bundled `assets/ornate.svg` graphic. It
 * stacks on mobile, in source order.
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
  sidetext,
  align = 'left',
  className = '',
  ...props
}: OrnateTextBoxProps) {
  const paragraphs = toParagraphs(description)

  // Tailwind v4 emits an arbitrary value only for a candidate it finds
  // verbatim in a scanned file, so each gradient is written out whole rather
  // than interpolating the angle or the alphas — either would compile to no
  // gradient at all. 270deg points left, so the peach stop at 100% stays on
  // the band's inner edge from `right-0`, exactly as 90deg keeps it there
  // from `left-0`.
  //
  // Below `lg` the body column is full-width and crosses the band, so the
  // band runs at an eighth of its alphas there. At full strength it drops
  // body text to 2.57:1; faint it measures 5.54:1, against a 5.77:1 ceiling
  // set by the brown ground alone (#193, #205).
  const bandSide = align === 'right' ? 'right-0' : 'left-0'
  const bandGradient =
    align === 'right'
      ? 'bg-[linear-gradient(270deg,rgba(255,255,255,0.01)_0%,rgba(255,255,255,0.02)_25%,rgba(255,196,175,0.08)_100%)] lg:bg-[linear-gradient(270deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.18)_25%,rgba(255,196,175,0.6)_100%)]'
      : 'bg-[linear-gradient(90deg,rgba(255,255,255,0.01)_0%,rgba(255,255,255,0.02)_25%,rgba(255,196,175,0.08)_100%)] lg:bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.18)_25%,rgba(255,196,175,0.6)_100%)]'

  // The `lg` layout is a two-column grid rather than a float, so the source
  // order is the reading order at every width: title, subtitle, image, body.
  // A float would have had to come before the header to put it in the text
  // column, which no `order-*` reorder fixes for a screen reader — it reads
  // source order (Flexbox §5.4, WCAG SC 1.3.2). Placement is explicit on all
  // three children because auto-placement follows source order, which is the
  // one thing this layout must not do. Each column pair is written out whole:
  // Tailwind v4 emits an arbitrary value only for a candidate it finds
  // verbatim in a scanned file (#262).
  const gridColumns = align === 'right' ? 'lg:grid-cols-[1fr_44%]' : 'lg:grid-cols-[44%_1fr]'
  const imageColumn = align === 'right' ? 'lg:col-start-2' : 'lg:col-start-1'
  const textColumn = align === 'right' ? 'lg:col-start-1' : 'lg:col-start-2'

  return (
    <div
      className={`surface-dark relative flex min-h-[80vh] items-center overflow-x-clip text-white ${className}`}
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

      {/* Large faded floral graphic, behind the content. `loading="lazy"` is
          load-bearing: without it React hoists a `<link rel="preload">` for
          this 156 KB SVG, and `aria-hidden` does not exempt it. */}
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[45%] -z-10 h-full w-[80%] object-cover object-left opacity-25"
        loading="lazy"
        src={ornateBackground}
      />

      {/* Soft warm gradient that lightens the image's edge. It extends above
          the block (the gradient--ornate ::before). It uses a negative
          z-index, so it sits over the brown ground but behind text from the
          block above. It mirrors with the image because the text column on
          the left would otherwise sit over the band: the body measures
          2.50:1 there and the header 2.47:1 (#193, #205, #262). */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-24 bottom-0 ${bandSide} -z-10 w-1/3 ${bandGradient}`}
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
          (lg:pr-24) to keep the body clear of it.

          Below `lg` this is ordinary block flow, so the three children stack
          in source order. The `lg:gap-x-12` matches the gutter the image's
          own margin used to hold (#262). */}
      <Container
        className={`relative z-10 py-12 lg:grid lg:gap-x-12 ${gridColumns} lg:py-20 lg:pr-24`}
        maxWidth="md"
      >
        {/* Title and subtitle header, in the text column beside the image.
            Across the band instead, the title measures 2.47:1 against a 3:1
            bar (#262). */}
        <div className={`mb-8 ${textColumn} lg:row-start-1 lg:mb-6`}>
          <h2 className="text-2xl font-light lg:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 text-base font-light">{subtitle}</p>}
        </div>

        {/* Feature image — its own column on the `align` side, spanning the
            header's row and the body's */}
        <div className={`mb-6 w-full ${imageColumn} lg:row-span-2 lg:row-start-1 lg:mb-0`}>
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

        {/* Body: the text column's second row, so it stays a clean column
            clear of the gradient whichever side the image takes. */}
        <div
          className={`space-y-5 text-base font-light leading-relaxed text-white ${textColumn} lg:row-start-2`}
        >
          {paragraphs.map((paragraph, index) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- paragraphs of one body of copy: position is identity, and nothing reorders them
            <p key={index}>{paragraph}</p>
          ))}

          {ctaText && ctaHref && (
            <Button
              className="mt-2 border-white text-white"
              href={ctaHref}
              size="lg"
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
