import { ReactNode } from 'react'
import { Heading, Image, Link } from '@/components/atoms'

export interface ColumnProps {
  /** Column title */
  title: string

  /** Column description content */
  description: ReactNode

  /** Optional image URL */
  imageUrl?: string

  /** Alt text for the image */
  imageAlt?: string

  /** Optional link URL. Makes the title clickable. */
  href?: string

  /**
   * The heading level the title takes. A column sits under a section heading
   * most of the time, but a section with no heading of its own leaves the
   * column to start the level (axe `heading-order`).
   * @default 'h3'
   */
  headingLevel?: 'h2' | 'h3'

  /** Additional CSS classes */
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
  headingLevel = 'h3',
  className = '',
}: ColumnProps) {
  // A linked column used to contribute no heading at all, so one column of a
  // row joined the outline and the next did not (#278).
  const titleElement = (
    <Heading className="text-xl font-medium text-gray-700" level={headingLevel} styleAs="none">
      {href ? (
        <Link
          className="hover:text-teal-600 transition-colors"
          href={href}
          size="inherit"
          variant="unstyled"
        >
          {title}
        </Link>
      ) : (
        title
      )}
    </Heading>
  )

  return (
    <div className={`flex flex-col items-center gap-4 w-full max-w-sm ${className}`}>
      {imageUrl && (
        <div className="flex justify-center mb-2">
          <Image
            alt={imageAlt}
            // The box is square, but `w-32 h-32 md:w-40 md:h-40` already draws
            // it, so the ratio is here only to pick a variant and a srcset.
            aspectRatio="square"
            className="w-32 h-32 md:w-40 md:h-40"
            forceAspectRatio={false}
            height={160}
            sizes="160px"
            src={imageUrl}
            width={160}
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
