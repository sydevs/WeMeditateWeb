import { ReactNode } from 'react'
import { Avatar } from '../../atoms/Avatar/Avatar'

export interface AuthorProps {
  /**
   * Display variant
   */
  variant: 'mini' | 'hero'

  /**
   * Author's name
   */
  name: string

  /**
   * Country code (e.g., "FI", "US")
   */
  countryCode?: string

  /**
   * Author's profile image URL
   */
  imageUrl?: string

  /**
   * How long the author has been meditating
   */
  meditationYears?: number

  /**
   * Author's title or credentials (hero variant only)
   */
  title?: string

  /**
   * Estimated reading time in minutes (mini variant only)
   */
  readingTime?: number

  /**
   * Author's bio or description (hero variant only)
   */
  description?: ReactNode

  /**
   * Link to author's profile page
   */
  href?: string

  /**
   * Text alignment
   * @default 'left'
   */
  align?: 'left' | 'right'

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Author component displays author information in mini or hero formats.
 *
 * The mini variant is compact and right-aligned, ideal for article headers.
 * The hero variant is larger and center-aligned, suitable for author bio sections.
 *
 * @example
 * // Mini variant for article byline
 * <Author
 *   variant="mini"
 *   name="Gabriel Kolanen"
 *   countryCode="FI"
 *   imageUrl="/author.jpg"
 *   meditationYears={5}
 *   readingTime={5}
 *   href="#author"
 * />
 *
 * @example
 * // Hero variant for author bio section
 * <Author
 *   variant="hero"
 *   name="Gabriel Kolanen"
 *   countryCode="FI"
 *   imageUrl="/author.jpg"
 *   title="Graduate of English Literature and History"
 *   meditationYears={5}
 *   description={<p>A student of boisterous books...</p>}
 * />
 */
export function Author({
  variant,
  name,
  countryCode,
  imageUrl,
  meditationYears,
  title,
  readingTime,
  description,
  href,
  align = 'left',
  className = '',
}: AuthorProps) {
  const isMini = variant === 'mini'
  const isHero = variant === 'hero'
  const isRight = align === 'right'

  // Common elements
  const avatarSize = isMini ? 'xl' : '2xl'
  const avatarElement = (
    <Avatar
      src={imageUrl}
      alt={name}
      size={avatarSize}
    />
  )

  const nameWithCountry = countryCode ? `${name}, ${countryCode}` : name
  const meditationText = meditationYears ? `Meditating for ${meditationYears} year${meditationYears === 1 ? '' : 's'}` : null
  const readingTimeText = readingTime ? `${readingTime} minute read` : null

  if (isMini) {
    const textAlign = isRight ? 'text-right' : 'text-left'

    return (
      <div className={`${textAlign} text-gray-700 max-w-xs ${className}`}>
        <div className="mb-8">
          {href ? (
            <a href={href}>
              {avatarElement}
            </a>
          ) : (
            avatarElement
          )}
        </div>
        <div className="text-sm sm:text-base font-light leading-tight">
          Written by <em className="not-italic font-normal">{name}</em>
          {countryCode && `, ${countryCode}`}
        </div>
        {meditationText && (
          <div className="text-sm font-light leading-tight">
            {meditationText}
          </div>
        )}
        {readingTimeText && (
          <div className="text-sm font-light mt-1.5 leading-tight">
            {readingTimeText}
          </div>
        )}
      </div>
    )
  }

  if (isHero) {
    const titleAlign = isRight ? 'text-center md:text-right' : 'text-center md:text-left'
    const metaAlign = isRight ? 'md:items-end md:text-right' : 'md:items-start md:text-left'
    const orderClasses = isRight ? 'md:flex-row-reverse' : 'md:flex-row'

    return (
      <div className={`text-gray-700 ${className}`}>
        <h2 className={`text-xl font-semibold text-gray-700 mb-5 ${titleAlign}`}>
          About the author
        </h2>
        <div className={`flex flex-col ${orderClasses} gap-8`}>
          <div className={`flex flex-col items-center ${metaAlign} text-center w-full md:w-48 shrink-0`}>
            <div className="mb-8">{avatarElement}</div>
            <div className="text-sm sm:text-base font-light leading-relaxed">
              {nameWithCountry}
            </div>
            {title && (
              <div className="text-sm font-light leading-relaxed">
                {title}
              </div>
            )}
            {meditationText && (
              <div className="text-sm font-light leading-relaxed">
                {meditationText}
              </div>
            )}
          </div>
          {description && (
            <div className="flex-1 mt-10 md:mt-0">
              <div className="text-sm sm:text-base font-light leading-relaxed text-left">
                {description}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
