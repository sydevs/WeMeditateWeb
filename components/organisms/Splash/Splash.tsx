import { ComponentProps, ReactNode, useEffect, useId, useRef, useState } from 'react'
import { LeafSvg } from '../../atoms/graphics/svgs'
import { Link } from '../../atoms/Link'
import { SplashLoader } from '../../atoms/SplashLoader'
import { surface, type Surface } from '../../atoms/surface'
import { isSafeLinkHref } from '../../../lib/urls'
import {
  type AspectRatio,
  type ImageSize,
  getImageURL,
  getVariantName,
} from '../../../lib/cloudflare-images'

/**
 * Ends the loader the moment the hero settles, without waiting for React: the
 * preloaded hero usually lands well before hydration, and until then React's
 * own `onLoad` cannot fire. Only the server's HTML runs it, since React never
 * executes a script it renders itself. The inline `opacity` it writes is not
 * React's, hence `suppressHydrationWarning` on the loader.
 */
const settleLoaderScript = (heroId: string, loaderId: string) =>
  `(function(h,l){if(!h||!l)return;function d(){l.style.opacity='0'}` +
  `if(h.complete)d();else{h.addEventListener('load',d);h.addEventListener('error',d)}})` +
  `(document.getElementById(${JSON.stringify(heroId)}),document.getElementById(${JSON.stringify(loaderId)}))`

export interface SplashProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * URL of the background image.
   * Cloudflare Images URLs are automatically transformed to the matching variant.
   */
  backgroundImage: string
  /**
   * Aspect ratio used to pick a Cloudflare Images variant for `backgroundImage`.
   * Ignored for non-Cloudflare URLs.
   * @default 'ultrawide'
   */
  imageAspectRatio?: AspectRatio
  /**
   * Size tier used to pick a Cloudflare Images variant for `backgroundImage`.
   * Ignored for non-Cloudflare URLs.
   * @default 'xlarge'
   */
  imageSize?: ImageSize
  /** Main title text */
  title?: string
  /** Subtitle text below the title */
  subtitle?: string
  /** Call-to-action text */
  ctaText?: string
  /** Call-to-action link destination */
  ctaHref?: string
  /**
   * The surface the background image paints. Everything inside — text, the
   * CTA, any children — takes its colours from it.
   * @default 'light'
   */
  surface?: Surface
  /** Whether the CTA should pulsate */
  pulsate?: boolean
  /**
   * Marks this splash as the page's LCP candidate. `fetchPriority="high"` is
   * also what makes React hoist a `<link rel="preload" as="image">` for it.
   * @default false
   */
  priority?: boolean
  /**
   * Covers the splash with `SplashLoader` until its background image loads,
   * the way the old site opened its home page. For the splash a visitor lands
   * on: the page's lead splash.
   * @default false
   */
  loader?: boolean
  /** Optional content to display between subtitle and CTA, for example a countdown timer or search input */
  children?: ReactNode
}

/**
 * Full-screen splash section with background image, centered content, and decorative leaves.
 * Reserves 240px (pt-60) at top for the overlaid Header.
 *
 * @example
 * <Splash
 *   backgroundImage="/images/sunset.jpg"
 *   title="Meditate for Better Mental Health"
 *   subtitle="Making a start is easier than you think."
 *   ctaText="Try it now"
 *   ctaHref="/start"
 *   surface="dark"
 *   pulsate
 * />
 */
export function Splash({
  backgroundImage,
  imageAspectRatio = 'ultrawide',
  imageSize = 'xlarge',
  title,
  subtitle,
  ctaText,
  ctaHref,
  surface: surfaceValue = 'light',
  pulsate = false,
  priority = false,
  loader = false,
  children,
  className = '',
  ...props
}: SplashProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageSettled, setImageSettled] = useState(false)
  const loaderId = useId()
  const heroId = `${loaderId}-hero`

  // An image that finished before hydration fired its `load` with no React
  // listener attached yet. `complete` covers a failed image too.
  useEffect(() => {
    if (imageRef.current?.complete) {
      setImageSettled(true)
    }
  }, [])

  const resolvedBackgroundImage = getImageURL(
    backgroundImage,
    getVariantName(imageAspectRatio, imageSize),
  )

  return (
    <div
      className={`group/splash relative min-h-screen flex items-center justify-center overflow-hidden ${surface(surfaceValue)} ${className}`}
      {...props}
    >
      {/* Not a CSS background (invisible to the preload scanner, and it cannot
          carry `fetchPriority`) and not the `Image` atom (its container owns
          the layout and `className` reaches the image, so it cannot fill this
          parent — #145 deferred a fill mode). */}
      <img
        ref={imageRef}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority={priority ? 'high' : undefined}
        id={loader ? heroId : undefined}
        loading={priority ? 'eager' : 'lazy'}
        src={resolvedBackgroundImage}
        onError={() => setImageSettled(true)}
        onLoad={() => setImageSettled(true)}
      />

      {/* Content Container */}
      <div className="relative z-10 w-full px-4 pt-60 pb-12 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          {title && (
            <h1
              className="font-sans text-2xl md:text-4xl font-light leading-tight mb-6 text-fg"
            >
              {title}
            </h1>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p
              className={`text-lg md:text-xl font-light ${children ? 'mb-8' : 'mb-12'} text-fg`}
            >
              {subtitle}
            </p>
          )}

          {/* Optional content, for example countdown, buttons, or search input */}
          {children && <div className="mb-20">{children}</div>}

          {/* Call-to-Action with Decorative Leaves */}
          {/* The gate stays at the call site although `Link` applies it too:
              a refused URL must render no call to action at all, where the
              atom would render the leaves and the words inert. They invite a
              click, so they are worse than absent. */}
          {ctaText && ctaHref && isSafeLinkHref(ctaHref) && (
            <Link
              className={`inline-flex items-center justify-center gap-4 text-xl md:text-2xl font-light text-fg transition-transform hover:scale-105 ${
                pulsate ? 'animate-pulse-scale' : ''
              }`}
              href={ctaHref}
              variant="unstyled"
            >
              {/* Left Leaf (rotated outward) */}
              <LeafSvg aria-hidden="true" className="w-16 h-16 -rotate-90" />

              {/* CTA Text */}
              <span>{ctaText}</span>

              {/* Right Leaf (rotated outward) */}
              <LeafSvg aria-hidden="true" className="w-16 h-16 rotate-90" />
            </Link>
          )}
        </div>
      </div>

      {/* Over the content, under the overlaid header (`LayoutChrome`, z-30).
          It hides the text a moment, so it must never strand anyone there: the
          script ends it when the hero settles, a CSS timer ends it without
          JavaScript, clicks pass through, focus entering the splash hides it
          at once, and reduced motion skips it. Focus hides it with
          `invisible`, not `hidden`: a `display` toggle restarts the timer.
          The dark brand colour is the old site's brown; a light splash gets
          the light warm wash, or the overlaid header's dark text would sit on
          a dark loader. */}
      {loader && (
        <>
          <SplashLoader
            autoExit
            suppressHydrationWarning
            aria-hidden="true"
            backgroundImage={backgroundImage}
            className="z-20 pointer-events-none motion-reduce:hidden group-focus-within/splash:invisible"
            color={surfaceValue === 'dark' ? 'secondary' : 'warm'}
            id={loaderId}
            imageAspectRatio={imageAspectRatio}
            imageSize={imageSize}
            isLoading={!imageSettled}
            size="lg"
          />
          <script
            // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- a constant script of ours; its only inputs are two `useId` values, JSON-encoded
            dangerouslySetInnerHTML={{ __html: settleLoaderScript(heroId, loaderId) }}
          />
        </>
      )}
    </div>
  )
}
