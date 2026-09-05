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
   * Width of the image in pixels. Together with height, this prevents
   * layout shift during loading.
   */
  width?: number

  /**
   * Height of the image in pixels. Together with width, this prevents
   * layout shift during loading.
   */
  height?: number

  /**
   * Aspect ratio for the image container. Values align with Cloudflare
   * Images variant prefixes, so this automatically optimizes
   * SahajCloud-hosted images (for example `video` maps to `video-800`).
   * @default undefined (intrinsic aspect ratio)
   */
  aspectRatio?: AspectRatio

  /**
   * When `aspectRatio` is set, this also crops the layout to a fixed box of
   * that ratio: the `<img>` fills it through `absolute inset-0` and
   * `object-fit`. The aspect ratio still picks an optimized Cloudflare
   * variant and srcset either way. Set `false` to keep the `<img>` in
   * natural document flow, sized by its intrinsic width and height, while
   * still fetching an optimized variant. Feature blocks that render at the
   * image's own ratio use this.
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
   * When true, this uses a `sizes` attribute tuned for full-width viewport
   * layouts by default. A caller that renders images inside grids, cards, or
   * fixed-width containers should pass its own `sizes` prop, so the browser
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
   * Color variant for the loading placeholder.
   * This applies only when width and height are provided.
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
   * Position of this image within its {@link lightboxGroup}, in document
   * order. This determines slide order and which slide the trigger opens.
   * It must be unique per group, for example the map index for a gallery,
   * or `0` for a single-image group.
   * @default 0
   */
  lightboxIndex?: number
}

/**
 * Build a {@link LightboxSlide} for an image. For a Cloudflare-hosted
 * image, this requests the largest configured variant, so the full-screen
 * view, and zoom, get the highest available resolution. Other URLs pass
 * through as-is. The alt text doubles as the slide caption.
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
 * Image renders with responsive sizing and loading states.
 *
 * It gives consistent image rendering with aspect ratio control, loading
 * states, and several object-fit options.
 *
 * When `src` is a Cloudflare Images URL (imagedelivery.net) and
 * `aspectRatio` is set, the component automatically appends a variant
 * (`{aspectRatio}-{width}`) and emits a responsive srcset. The default
 * `sizes` attribute assumes a roughly full-width viewport layout. Pass an
 * explicit `sizes` prop when rendering inside grids, cards, or fixed-width
 * containers.
 *
 * When width and height are provided, the component uses a blurred
 * gradient placeholder, with a shimmer animation, to prevent layout shift
 * during loading.
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

  // Register the slide with the ambient provider, so the shared overlay can
  // show it, keyed by its document-order index. Effects do not run during
  // SSR, so registration happens on the client after hydration. The trigger
  // markup itself renders on both.
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

  // Reset loading and error state when the resolved src changes in place.
  // This happens for a persistent <Image> whose `src` prop mutates, for
  // example the AudioPlayer now-playing thumbnail on a track switch. React's
  // "adjust state during render" pattern runs before paint, so the new
  // image shows its placeholder instead of briefly flashing the previous
  // state, or a stuck error state. The effect below then clears `isLoading`
  // immediately if the new src is already cached.
  const [loadedSrc, setLoadedSrc] = useState(imageSrc)

  if (imageSrc !== loadedSrc) {
    setLoadedSrc(imageSrc)
    setIsLoading(true)
    setHasError(false)
  }

  // A cached image can already be `complete` before React attaches
  // `onLoad`, so the load event never reaches this component's handler, and
  // `isLoading` stays stuck at `true`: the placeholder lingers, and the
  // image stays at opacity-0. Effects do not run during SSR. So on mount,
  // and whenever the resolved src changes, this re-checks `complete` and
  // clears the loading state for an already-decoded image. `naturalWidth >
  // 0` excludes broken images, so `onError` still owns the error path.
  useEffect(() => {
    const img = imgRef.current

    if (img?.complete && img.naturalWidth > 0) {
      setIsLoading(false)
    }
  }, [imageSrc, imageSrcSet])

  // `aspectRatio` always drives Cloudflare variant and srcset selection
  // (above), but it constrains the layout to a fixed-ratio box only when
  // `forceAspectRatio` is set, the default. A natural-flow caller passes
  // `forceAspectRatio=false` to render the image at its own ratio, while
  // still fetching an optimized variant.
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

  // An empty `src` must never reach the <img>: the browser treats src=""
  // as a request for the current page URL, which re-downloads the whole
  // document, and React warns about it. This happens when a caller threads
  // an unpopulated CMS image field straight through, for example a bare or
  // absent relationship. Treat a blank src as a missing image: skip the
  // <img> and let the placeholder show.
  const hasSrc = typeof imageSrc === 'string' && imageSrc.trim() !== ''

  // `aspectRatioStyles` is '' unless boxed, so one literal covers both cases.
  const containerClasses = `relative ${aspectRatioStyles} ${roundedStyles} overflow-hidden`

  const imageClasses = `${objectFitStyles} ${
    boxed ? 'absolute inset-0 w-full h-full' : ''
  } transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`

  const content = (
    <>
      {/* Loading and error overlay. This always positions `absolute
          inset-0`, to fill the container the image occupies, so it must not
          take explicit pixel dimensions. Passing the intrinsic width and
          height here would size the overlay to the raw image and anchor it
          top-left, overflowing or clipping instead of matching the rendered
          image box. The <img>'s own width and height attributes reserve
          layout space and prevent shift. */}
      {showLoading && (isLoading || hasError || !hasSrc) && (
        <Placeholder
          animate={!hasError && hasSrc}
          className="absolute inset-0"
          variant={placeholderVariant}
        >
          {hasError && <Icon icon={ExclamationCircleIcon} size="lg" />}
        </Placeholder>
      )}

      {/* Image element. Hidden until loaded, and skipped on error or a blank src. */}
      {!hasError && hasSrc && (
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

  // With a lightboxGroup and a provider mounted above, this renders the
  // image as a focusable trigger that opens the shared lightbox at this
  // image's slide. Otherwise the container stays unchanged: no wrapper
  // element, no click handler.
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
