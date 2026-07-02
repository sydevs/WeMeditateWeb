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
import { Container, PageTitle } from '../atoms'
import { usePageHead } from '../../lib/head'
import { isPopulated, populatedImageUrl } from '../../lib/cms-relationships'
import { getLeadSplash } from '../../lib/cms-blocks'

export interface PageTemplateProps {
  /**
   * Page data from PayloadCMS
   */
  page: Page

  /**
   * Suppress the PageTitle banner (e.g. on featured nav pages, where the
   * highlighted nav link already names the page). When this is the only header
   * element, the surrounding header Container collapses cleanly.
   * @default false
   */
  hideTitle?: boolean
}

export function PageTemplate({ page, hideTitle = false }: PageTemplateProps) {
  // Set <title>/description/og:image from CMS meta (must run unconditionally).
  usePageHead({ meta: page.meta, fallbackTitle: page.title })

  const author = isPopulated<Author>(page.author) ? page.author : null
  const video = isPopulated<Video>(page.featuredVideo) ? page.featuredVideo : null
  // A lead splash renders its own full-bleed title, so skip the PageTitle banner
  // to avoid showing the title twice. `hideTitle` also suppresses it on featured
  // nav pages, where the highlighted nav link already names the page.
  const showTitle = !getLeadSplash(page.content) && !hideTitle
  const hasVideo = Boolean(video && video.hlsUrl)
  const hasHeader = hasVideo || showTitle || Boolean(author)

  // The article no longer constrains width; the readable column is owned by the
  // Container here (header chrome) and by RichText's own Container (the body), so
  // full-bleed blocks can break out cleanly and rendering is consistent in stories.
  return (
    <article>
      {hasHeader && (
        <Container maxWidth="md">
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
        </Container>
      )}

      <RichText content={page.content} />
    </article>
  )
}
