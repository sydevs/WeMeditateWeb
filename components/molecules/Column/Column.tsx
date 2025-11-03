import { ReactNode } from 'react'
import { Image, Link } from '../../atoms'

export interface ColumnProps {
  /**
   * Column title
   */
  title: string

  /**
   * Column description content
   */
  description: ReactNode

  /**
   * Optional image URL
   */
  imageUrl?: string

  /**
   * Alt text for the image
   */
  imageAlt?: string

  /**
   * Optional link URL - makes the title clickable
   */
  href?: string

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Column component for displaying content in a vertical layout with optional image, title, and description.
 * Designed to be used within a multi-column grid layout.
 */
export function Column({
  title,
  description,
  imageUrl,
  imageAlt = '',
  href,
  className = '',
}: ColumnProps) {
  const titleElement = href ? (
    <Link
      href={href}
      variant="unstyled"
      size="inherit"
      className="text-xl font-medium text-gray-600 hover:text-teal-600 transition-colors"
    >
      {title}
    </Link>
  ) : (
    <h3 className="text-xl font-medium text-gray-600">{title}</h3>
  )

  return (
    <div className={`flex flex-col items-center gap-4 w-full max-w-sm ${className}`}>
      {imageUrl && (
        <div className="flex justify-center mb-2">
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={160}
            height={160}
            className="w-32 h-32 md:w-40 md:h-40"
          />
        </div>
      )}

      <div className="text-center mb-2">{titleElement}</div>

      <div className="text-base font-light text-gray-700 leading-relaxed text-left w-full">
        {description}
      </div>
    </div>
  )
}
