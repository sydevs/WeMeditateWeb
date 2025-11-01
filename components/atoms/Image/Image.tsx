import { ComponentProps, useState } from 'react'

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
}

/**
 * Image component with responsive sizing and loading states.
 *
 * Provides consistent image rendering with aspect ratio control.
 * Supports loading states and various object-fit options.
 *
 * @example
 * <Image src="/path/to/image.jpg" alt="Description" />
 * <Image src="/banner.jpg" alt="Banner" aspectRatio="16/9" />
 * <Image src="/profile.jpg" alt="Profile" aspectRatio="square" rounded="circle" />
 */
export function Image({
  src,
  alt,
  aspectRatio,
  objectFit = 'cover',
  rounded = 'square',
  showLoading = true,
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
      {showLoading && isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          Failed to load image
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
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
