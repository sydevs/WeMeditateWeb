import { ComponentProps, useMemo, useState } from 'react'
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
   * Size tier used to pick a Cloudflare Images variant and generate srcset.
   * Ignored for non-Cloudflare URLs.
   * @default 'medium'
   */
  size?: ImageSize

  /**
   * Emit a responsive srcset for Cloudflare-hosted images.
   * Has no effect on non-Cloudflare URLs.
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
  rounded?: 'square' | 'rounded' | 'circle'

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
}

/**
 * Image component with responsive sizing and loading states.
 *
 * Provides consistent image rendering with aspect ratio control.
 * Supports loading states and various object-fit options.
 *
 * When `src` is a Cloudflare Images URL (imagedelivery.net) and `aspectRatio`
 * is set, the component automatically appends a variant (`{aspectRatio}-{width}`)
 * and emits a responsive srcset.
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
  size = 'medium',
  responsive = true,
  objectFit = 'cover',
  rounded = 'square',
  showLoading = true,
  placeholderVariant = 'neutral',
  className = '',
  sizes,
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const { imageSrc, imageSrcSet } = useMemo(() => {
    if (!aspectRatio || !isCloudflareImageURL(src)) {
      return { imageSrc: src, imageSrcSet: undefined as string | undefined }
    }
    return {
      imageSrc: getImageURL(src, getVariantName(aspectRatio, size)),
      imageSrcSet: responsive ? getImageSrcSet(src, aspectRatio) : undefined,
    }
  }, [src, aspectRatio, size, responsive])

  const aspectRatioStyles = aspectRatio
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
    square: '',
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

  const containerClasses = aspectRatio
    ? `relative ${aspectRatioStyles} ${roundedStyles} overflow-hidden`
    : `relative ${roundedStyles} overflow-hidden`

  const imageClasses = `${objectFitStyles} ${
    aspectRatio ? 'absolute inset-0 w-full h-full' : ''
  } transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`

  return (
    <div className={containerClasses}>
      {/* Always show Placeholder when loading or error */}
      {showLoading && (isLoading || hasError) && (
        <Placeholder
          width={width}
          height={height}
          variant={placeholderVariant}
          animate={!hasError}
          className="absolute inset-0"
        >
          {hasError && <Icon icon={ExclamationCircleIcon} size="lg" />}
        </Placeholder>
      )}

      {/* Image element (hidden until loaded, not rendered on error) */}
      {!hasError && (
        <img
          src={imageSrc}
          srcSet={imageSrcSet}
          sizes={sizes ?? (imageSrcSet ? DEFAULT_SIZES : undefined)}
          alt={alt}
          width={width}
          height={height}
          className={imageClasses}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  )
}
