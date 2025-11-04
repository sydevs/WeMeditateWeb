import { ComponentProps, useState, useEffect } from 'react'
import { Link, Image } from '../../atoms'
import { LotusDotsSvg, LogoSvg } from '../../atoms/svgs'

export interface HeaderDropdownLink {
  label: string
  href: string
}

export interface HeaderDropdownArticle {
  title: string
  image: string
  imageAlt: string
  href: string
}

export interface HeaderDropdownProps extends ComponentProps<'div'> {
  /**
   * Dropdown section title
   */
  title: string

  /**
   * Navigation links displayed in the left column
   */
  links: HeaderDropdownLink[]

  /**
   * Featured articles displayed on the right with thumbnails
   */
  featuredArticles: HeaderDropdownArticle[]
}

/**
 * Header dropdown mega nav component with title, navigation links, and featured articles.
 * Features hover overlay on article thumbnails with lotus decoration.
 */
export function HeaderDropdown({
  title,
  links,
  featuredArticles,
  className = '',
  ...props
}: HeaderDropdownProps) {
  // Validate and limit to 2 articles
  useEffect(() => {
    if (featuredArticles.length > 2) {
      console.warn(
        `HeaderDropdown: Only 2 featured articles are allowed. Received ${featuredArticles.length}. Extra articles will be truncated.`
      )
    }
  }, [featuredArticles.length])

  const validArticles = featuredArticles.slice(0, 2)

  return (
    <div
      className={`bg-gray-100 max-w-7xl mx-auto relative px-16 pb-12 overflow-hidden ${className}`}
      {...props}
    >
      {/* Background Logo - scaled 2x, top-left quadrant visible */}
      <div className="absolute -top-16 left-0 lg:-left-1/5 w-[180%] h-[180%] pointer-events-none opacity-70">
        <LogoSvg className="w-full h-full text-white" />
      </div>

      {/* Horizontal divider line */}
      <div className="absolute left-0 right-0 top-20 h-0 border-t border-gray-300" />

      {/* Grid Layout: 3 columns on desktop */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        {/* Column 1: Title and Links */}
        <div className="flex flex-col">
          {/* Title - Fixed Height */}
          <div className="h-20 py-4 flex items-center">
            <h3 className="text-xl font-semibold text-gray-700 line-clamp-2">
              {title}
            </h3>
          </div>

          {/* Links Section */}
          <nav className="py-6">
            <ul className="flex flex-col gap-3">
              {links.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    variant="neutral"
                    size="base"
                    className="hover:text-teal-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Columns 2 & 3: Featured Articles */}
        {validArticles.map((article, index) => (
          <FeaturedArticleColumn
            key={index}
            article={article}
            className={index === 0 ? 'hidden md:flex' : 'hidden lg:flex'}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Featured article column with title and thumbnail
 */
interface FeaturedArticleColumnProps {
  article: HeaderDropdownArticle
  className?: string
}

function FeaturedArticleColumn({ article, className = '' }: FeaturedArticleColumnProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Article Title - Fixed Height */}
      <div className="h-20 py-4 flex items-center">
        <Link
          href={article.href}
          variant="neutral"
          className="hover:text-teal-600 transition-colors line-clamp-3 text-sm"
        >
          {article.title}
        </Link>
      </div>

      {/* Article Thumbnail with Hover Overlay */}
      <div>
        <Link
          href={article.href}
          variant="unstyled"
          className="relative block aspect-square overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Image
            src={article.image}
            alt={article.imageAlt}
            aspectRatio="square"
            objectFit="cover"
            className="w-full h-full"
          />

          {/* Hover Overlay */}
          <div
            className={`
              absolute inset-0 bg-black/50 flex flex-col items-center justify-center
              transition-opacity duration-300
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}
          >
            {/* Centered Text */}
            <p className="text-white text-sm font-light text-center px-8">
              Inspiration comes from within
            </p>

            {/* SVG anchored to bottom */}
            <div className="absolute bottom-8">
              <LotusDotsSvg className="w-16 h-4 text-white" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
