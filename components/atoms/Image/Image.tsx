import { ComponentProps, useState } from 'react'
import { Placeholder } from '../Placeholder'
import { Icon } from '../Icon'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

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
   * Aspect ratio for the image container
   * @default undefined (intrinsic aspect ratio)
   */
  aspectRatio?: 'square' | 'video' | '4/3' | '3/2' | '16/9' | '21/9'

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
 * When width and height are provided, uses a blurred gradient placeholder
 * with shimmer animation to prevent layout shift during loading.
 *
 * @example
 * <Image src="/path/to/image.jpg" alt="Description" />
 * <Image src="/banner.jpg" alt="Banner" aspectRatio="16/9" />
 * <Image src="/profile.jpg" alt="Profile" aspectRatio="square" rounded="circle" />
 * <Image src="/hero.jpg" alt="Hero" width={1200} height={600} placeholderVariant="primary" />
 */
export function Image({
  src,
  alt,
  width,
  height,
  aspectRatio,
  objectFit = 'cover',
  rounded = 'square',
  showLoading = true,
  placeholderVariant = 'neutral',
  className = '',
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const aspectRatioStyles = aspectRatio
    ? {
        square: 'aspect-square',
        video: 'aspect-video',
        '4/3': 'aspect-[4/3]',
        '3/2': 'aspect-[3/2]',
        '16/9': 'aspect-[16/9]',
        '21/9': 'aspect-[21/9]',
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
          src={src}
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
