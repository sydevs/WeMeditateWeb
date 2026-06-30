import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react'
import { Placeholder } from '../Placeholder'
import { Icon } from '../Icon'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import {
  type AspectRatio,
  type ImageSize,
  getImageSrcSet,
  getImageURL,
  getVariantName,
  isCloudflareImageURL,
} from '../../../lib/cloudflare-images'
import { useLightbox, type LightboxSlide } from '../../molecules/Lightbox/LightboxProvider'

const DEFAULT_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px'

export interface ImageProps extends ComponentProps<'img'> {
  /**
   * Image source URL
   */
  src: string

  /**
   * Alternative text for accessibility
   */
  alt: string

  /**
   * Width of the image in pixels
   * When provided with height, prevents layout shift during loading
   */
  width?: number

  /**
   * Height of the image in pixels
   * When provided with width, prevents layout shift during loading
   */
  height?: number

  /**
   * Aspect ratio for the image container.
   * Values align with Cloudflare Images variant prefixes so SahajCloud-hosted
   * images are automatically optimized (e.g. `video` → `video-800`).
   * @default undefined (intrinsic aspect ratio)
   */
  aspectRatio?: AspectRatio

  /**
   * When an `aspectRatio` is set, also crop the layout to a fixed box of that
   * ratio (the `<img>` fills it via `absolute inset-0` + `object-fit`). The
   * aspect ratio is still used to pick an optimized Cloudflare variant + srcset
   * either way. Set `false` to keep the `<img>` in natural document flow (sized
   * by its intrinsic `width`/`height`) while still fetching an optimized
   * variant — used by feature blocks that render at the image's own ratio.
   * @default true
   */
  forceAspectRatio?: boolean

  /**
   * Size tier used to pick a Cloudflare Images variant and generate srcset.
   * Ignored for non-Cloudflare URLs.
   * @default 'medium'
   */
  size?: ImageSize

  /**
   * Emit a responsive srcset for Cloudflare-hosted images.
   * Has no effect on non-Cloudflare URLs.
   *
   * When true, a `sizes` attribute tuned for full-width viewport layouts is
   * used by default. Callers rendering images inside grids, cards, or
   * fixed-width containers should pass their own `sizes` prop so the browser
   * picks the correct variant instead of over-fetching.
   * @default true
   */
  responsive?: boolean

  /**
   * Object fit for the image
   * @default 'cover'
   */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'

  /**
   * Border radius style
   * @default 'square'
   */
  rounded?: 'none' | 'square' | 'rounded' | 'circle'

  /**
   * Show loading state
   * @default true
   */
  showLoading?: boolean

  /**
   * Color variant for the loading placeholder
   * Only used when width and height are provided
   * @default 'neutral'
   */
  placeholderVariant?: 'primary' | 'secondary' | 'neutral'

  /**
   * Opt into the rich-text lightbox. When set *and* a `LightboxProvider` is
   * mounted above, the image registers a full-resolution slide under this group
   * key and renders as a focusable trigger that opens the lightbox at its slide.
   * When unset (or with no provider) the image renders exactly as it otherwise
   * would — no wrapper element and no click handler.
   */
  lightboxGroup?: string

  /**
   * Position of this image within its {@link lightboxGroup}, in document order.
   * Determines slide order and which slide the trigger opens. Must be unique per
   * group (e.g. the map index for a gallery; `0` for a single-image group).
   * @default 0
   */
  lightboxIndex?: number
}

/**
 * Build a {@link LightboxSlide} for an image. For Cloudflare-hosted images the
 * largest configured variant is requested so the full-screen view (and zoom)
 * get the highest available resolution; other URLs are used as-is. The alt text
 * doubles as the slide caption.
 */
export function buildLightboxSlide(
  src: string,
  alt: string,
  aspectRatio?: AspectRatio,
): LightboxSlide {
  const fullRes =
    aspectRatio && isCloudflareImageURL(src)
      ? getImageURL(src, getVariantName(aspectRatio, 'xlarge'))
      : src

  return { src: fullRes, alt, description: alt || undefined }
}

/**
 * Image component with responsive sizing and loading states.
 *
 * Provides consistent image rendering with aspect ratio control.
 * Supports loading states and various object-fit options.
 *
 * When `src` is a Cloudflare Images URL (imagedelivery.net) and `aspectRatio`
 * is set, the component automatically appends a variant (`{aspectRatio}-{width}`)
 * and emits a responsive srcset. The default `sizes` attribute assumes a
 * roughly full-width viewport layout — pass an explicit `sizes` prop when
 * rendering inside grids, cards, or fixed-width containers.
 *
 * When width and height are provided, uses a blurred gradient placeholder
 * with shimmer animation to prevent layout shift during loading.
 *
 * @example
 * <Image src="/path/to/image.jpg" alt="Description" />
 * <Image src="/banner.jpg" alt="Banner" aspectRatio="video" />
 * <Image src="/profile.jpg" alt="Profile" aspectRatio="square" rounded="circle" />
 * <Image src="/hero.jpg" alt="Hero" width={1200} height={600} placeholderVariant="primary" />
 */
export function Image({
  src,
  alt,
  width,
  height,
  aspectRatio,
  forceAspectRatio = true,
  size = 'medium',
  responsive = true,
  objectFit = 'cover',
  rounded = 'square',
  showLoading = true,
  placeholderVariant = 'neutral',
  lightboxGroup,
  lightboxIndex = 0,
  className = '',
  sizes,
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const lightbox = useLightbox()

  const slide = useMemo(
    () => (lightbox && lightboxGroup ? buildLightboxSlide(src, alt, aspectRatio) : null),
    [lightbox, lightboxGroup, src, alt, aspectRatio],
  )

  // Register the slide with the ambient provider so the shared overlay can show
  // it, keyed by its document-order index. Effects don't run during SSR, so
  // registration happens on the client after hydration; the trigger markup
  // itself renders on both.
  useEffect(() => {
    if (!lightbox || !lightboxGroup || !slide) {
      return
    }
    lightbox.register(lightboxGroup, lightboxIndex, slide)

    return () => lightbox.unregister(lightboxGroup, lightboxIndex)
  }, [lightbox, lightboxGroup, lightboxIndex, slide])

  const { imageSrc, imageSrcSet } = useMemo(() => {
    if (!aspectRatio || !isCloudflareImageURL(src)) {
      return { imageSrc: src, imageSrcSet: undefined as string | undefined }
    }
    const srcSet = responsive ? getImageSrcSet(src, aspectRatio) : ''

    return {
      imageSrc: getImageURL(src, getVariantName(aspectRatio, size)),
      imageSrcSet: srcSet || undefined,
    }
  }, [src, aspectRatio, size, responsive])

  // A cached image can already be `complete` before React attaches `onLoad`, so
  // the load event never reaches our handler and `isLoading` stays stuck `true`
  // (placeholder lingers, image held at opacity-0). Effects don't run during SSR,
  // so on mount — and whenever the resolved src changes — re-check `complete` and
  // clear the loading state for an already-decoded image. `naturalWidth > 0`
  // excludes broken images so `onError` still owns the error path.
  useEffect(() => {
    const img = imgRef.current

    if (img?.complete && img.naturalWidth > 0) {
      setIsLoading(false)
    }
  }, [imageSrc, imageSrcSet])

  // `aspectRatio` always drives Cloudflare variant/srcset selection (above), but
  // only constrains the layout to a fixed-ratio box when `forceAspectRatio`
  // is set (the default). Natural-flow callers pass `forceAspectRatio=false`
  // to render the image at its own ratio while still fetching an optimized variant.
  const boxed = Boolean(aspectRatio) && forceAspectRatio

  const aspectRatioStyles =
    boxed && aspectRatio
      ? {
          square: 'aspect-square',
          video: 'aspect-video',
          '4-3': 'aspect-[4/3]',
          '3-2': 'aspect-[3/2]',
          ultrawide: 'aspect-[21/9]',
        }[aspectRatio]
      : ''

  const objectFitStyles = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  }[objectFit]

  const roundedStyles = {
    none: '',
    square: 'rounded-xs',
    rounded: 'rounded-lg',
    circle: 'rounded-full',
  }[rounded]

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false)
    onLoad?.(e)
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false)
    setHasError(true)
    onError?.(e)
  }

  const containerClasses = boxed
    ? `relative ${aspectRatioStyles} ${roundedStyles} overflow-hidden`
    : `relative ${roundedStyles} overflow-hidden`

  const imageClasses = `${objectFitStyles} ${
    boxed ? 'absolute inset-0 w-full h-full' : ''
  } transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`

  const content = (
    <>
      {/* Loading/error overlay. It's always positioned `absolute inset-0` to fill
          the container the image occupies, so it must NOT take explicit pixel
          dimensions — passing the intrinsic width/height here would size the
          overlay to the raw image and anchor it top-left, overflowing/clipping
          instead of matching the rendered image box. The <img>'s own width/height
          attributes reserve layout space and prevent shift. */}
      {showLoading && (isLoading || hasError) && (
        <Placeholder animate={!hasError} className="absolute inset-0" variant={placeholderVariant}>
          {hasError && <Icon icon={ExclamationCircleIcon} size="lg" />}
        </Placeholder>
      )}

      {/* Image element (hidden until loaded, not rendered on error) */}
      {!hasError && (
        <img
          ref={imgRef}
          alt={alt}
          className={imageClasses}
          height={height}
          loading="lazy"
          sizes={sizes ?? (imageSrcSet ? DEFAULT_SIZES : undefined)}
          src={imageSrc}
          srcSet={imageSrcSet}
          width={width}
          onError={handleError}
          onLoad={handleLoad}
          {...props}
        />
      )}
    </>
  )

  // With a lightboxGroup and a provider mounted above, render the image as a
  // focusable trigger that opens the shared lightbox at this image's slide;
  // otherwise the container is unchanged (no wrapper element, no click handler).
  if (lightbox && lightboxGroup) {
    return (
      <button
        aria-haspopup="dialog"
        aria-label={alt ? `View image: ${alt}` : 'View image'}
        className={`${containerClasses} block w-full cursor-zoom-in appearance-none border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2`}
        type="button"
        onClick={() => lightbox.openAt(lightboxGroup, lightboxIndex)}
      >
        {content}
      </button>
    )
  }

  return <div className={containerClasses}>{content}</div>
}
