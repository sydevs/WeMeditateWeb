import { ComponentProps, useState } from 'react'

export interface AvatarProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * Image source URL
   */
  src?: string

  /**
   * Alternative text for the image
   */
  alt: string

  /**
   * Avatar size
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

  /**
   * Avatar shape
   * @default 'circle'
   */
  shape?: 'circle' | 'rounded' | 'square'

  /**
   * Avatar color scheme
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'neutral'

  /**
   * Fallback initials when image is not available
   */
  initials?: string
}

/**
 * Avatar component for user/author profile images.
 *
 * Displays circular or rounded images with fallback to initials.
 * Supports various sizes, colors, and automatic fallback handling.
 *
 * @example
 * <Avatar src="/user.jpg" alt="John Doe" />
 * <Avatar src="/author.jpg" alt="Jane Smith" size="lg" color="secondary" />
 * <Avatar alt="John Doe" initials="JD" color="neutral" />
 * <Avatar src="/profile.jpg" alt="User" shape="rounded" size="xl" />
 */
export function Avatar({
  src,
  alt,
  size = 'md',
  shape = 'circle',
  color = 'primary',
  initials,
  className = '',
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(!!src)

  const sizeStyles = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  }

  const shapeStyles = {
    circle: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none',
  }

  const colorStyles = {
    primary: 'bg-teal-500 text-white',
    secondary: 'bg-coral-500 text-white',
    neutral: 'bg-gray-200 text-gray-700',
  }

  const baseStyles = 'relative inline-flex items-center justify-center overflow-hidden font-medium flex-shrink-0'

  const showImage = src && !hasError

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  // Generate initials from alt text if not provided
  const displayInitials =
    initials ||
    (alt || '')
      .split(' ')
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    '?'

  return (
    <div
      className={`${baseStyles} ${colorStyles[color]} ${sizeStyles[size]} ${shapeStyles[shape]} ${className}`}
      {...props}
    >
      {/* Always render initials underneath */}
      <span aria-label={alt} className={showImage ? 'absolute' : ''}>
        {displayInitials}
      </span>
      {showImage && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover absolute inset-0 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}
