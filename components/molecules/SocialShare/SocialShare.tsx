import { ComponentProps } from 'react'
import { SocialIcon } from '../../atoms/SocialIcon'

export interface SocialShareProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * The URL to share (current page URL)
   */
  url: string

  /**
   * Optional title/text to include with the share
   */
  title?: string

  /**
   * Label text to display before the share icons
   * @default ''
   */
  label?: string

  /**
   * Size of the social icons
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'

  /**
   * Color variant for the icons
   * @default 'primary'
   */
  color?: 'gray' | 'primary' | 'secondary' | 'brand'

  /**
   * Social platforms to display
   * @default ['facebook', 'pinterest', 'linkedin', 'bluesky']
   */
  platforms?: Array<'facebook' | 'pinterest' | 'whatsapp' | 'telegram' | 'linkedin' | 'bluesky'>
}

/**
 * SocialShare component for sharing content on social media.
 *
 * Displays social media icons that open share dialogs for various platforms.
 * Optionally includes a label before the icons.
 *
 * Share URL Formats:
 * - Facebook: https://www.facebook.com/sharer/sharer.php?u={url}
 * - Pinterest: https://pinterest.com/pin/create/button/?url={url}
 * - WhatsApp: https://wa.me/?text={url}
 * - Telegram: https://t.me/share/url?url={url}&text={text}
 * - LinkedIn: https://www.linkedin.com/sharing/share-offsite/?url={url}
 * - Bluesky: https://bsky.app/intent/compose?text={text}
 *
 * @example
 * <SocialShare url="https://wemeditate.com/classes" />
 *
 * @example
 * <SocialShare
 *   url="https://wemeditate.com/classes"
 *   title="Free Meditation Classes"
 *   label="Share:"
 *   size="lg"
 *   color="brand"
 *   platforms={['facebook', 'linkedin', 'bluesky']}
 * />
 */
export function SocialShare({
  url,
  title = '',
  label = '',
  size = 'md',
  color = 'primary',
  platforms = ['facebook', 'pinterest', 'linkedin', 'bluesky'],
  className = '',
  ...props
}: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedText = encodedTitle ? `${encodedTitle}%20${encodedUrl}` : encodedUrl

  const shareUrls: Record<string, string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}${encodedTitle ? `&text=${encodedTitle}` : ''}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    bluesky: `https://bsky.app/intent/compose?text=${encodedText}`,
  }

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      role="region"
      aria-label="Social media sharing options"
      {...props}
    >
      {label && (
        <span className="text-base sm:text-lg font-normal mr-1">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2" role="group" aria-label="Share on social media">
        {platforms.sort().map((platform) => (
          <SocialIcon
            key={platform}
            platform={platform}
            href={shareUrls[platform]}
            size={size}
            color={color}
            aria-label={`Share on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
          />
        ))}
      </div>
    </div>
  )
}
