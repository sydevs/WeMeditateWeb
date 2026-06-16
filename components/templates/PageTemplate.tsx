/**
 * PageTemplate - Template for rendering page content
 *
 * Used by both regular pages ([slug]) and the live-preview route so rendering
 * stays consistent. Following Atomic Design, templates represent page layout
 * structures. Composes the article chrome: featured video, title, author
 * byline, rich-text body, and SEO `<head>` tags from the page's CMS meta.
 *
 * @example
 * <PageTemplate page={pageData} />
 */

import type { Page, Author, Video } from '../../server/cms-types'
import { RichText } from '../organisms'
import { VideoPlayer, Author as AuthorByline } from '../molecules'
import { PageTitle } from '../atoms'
import { usePageHead } from '../../lib/head'
import { isPopulated, populatedImageUrl } from '../../lib/cms-relationships'

export interface PageTemplateProps {
  /**
   * Page data from PayloadCMS
   */
  page: Page
}

/**
 * True when the page's content leads with a `splash` block. A splash renders
 * its own full-bleed title, so the PageTitle banner is skipped to avoid showing
 * the title twice.
 */
function leadsWithSplash(content: Page['content']): boolean {
  const first = content?.root?.children?.[0] as
    | { type?: string; fields?: { blockType?: string } }
    | undefined

  return first?.type === 'block' && first?.fields?.blockType === 'splash'
}

export function PageTemplate({ page }: PageTemplateProps) {
  // Set <title>/description/og:image from CMS meta (must run unconditionally).
  usePageHead({ meta: page.meta, fallbackTitle: page.title })

  const author = isPopulated<Author>(page.author) ? page.author : null
  const video = isPopulated<Video>(page.featuredVideo) ? page.featuredVideo : null
  const showTitle = !leadsWithSplash(page.content)

  return (
    <article className="max-w-4xl mx-auto">
      {video && video.hlsUrl ? (
        <VideoPlayer
          className="mb-8"
          hlsUrl={video.hlsUrl}
          poster={populatedImageUrl(video.thumbnail)}
          subtitles={video.subtitles}
          title={video.title}
        />
      ) : null}

      {showTitle ? <PageTitle title={page.title} /> : null}

      {author ? (
        <AuthorByline
          className="mb-8"
          countryCode={author.countryCode ?? undefined}
          imageUrl={populatedImageUrl(author.photo)}
          meditationYears={author.yearsMeditating ?? undefined}
          name={author.name}
          variant="mini"
        />
      ) : null}

      <RichText content={page.content} />
    </article>
  )
}
