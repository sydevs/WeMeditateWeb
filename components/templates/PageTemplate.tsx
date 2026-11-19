/**
 * PageTemplate renders page content.
 *
 * Both regular pages ([slug]) and the live-preview route use it, so
 * rendering stays consistent. Following Atomic Design, templates represent
 * page layout structures. It composes the article chrome: featured video,
 * title, author byline and rich-text body. The head is built in the route's
 * `+data.ts`, never here: the live preview and the embed routes share this
 * template and neither is a URL to point a crawler at.
 *
 * @example
 * <PageTemplate page={pageData} />
 */

import type { Page, Author, Video } from '../../server/sahajcloud-types'
import { RichText } from '../organisms'
import { VideoPlayer, Author as AuthorByline } from '../molecules'
import { Container, Heading, PageTitle } from '../atoms'
import { isPopulated, populatedImageUrl } from '../../lib/payload-relationships'
import { getLeadSplash } from '../../lib/content-blocks'

export interface PageTemplateProps {
  /** Page data from PayloadCMS */
  page: Page

  /**
   * Suppress the PageTitle banner (for example on featured nav pages, where the
   * highlighted nav link already names the page). When this is the only header
   * element, the surrounding header Container collapses cleanly.
   * @default false
   */
  hideTitle?: boolean
}

export function PageTemplate({ page, hideTitle = false }: PageTemplateProps) {
  const author = isPopulated<Author>(page.author) ? page.author : null
  const video = isPopulated<Video>(page.featuredVideo) ? page.featuredVideo : null
  const leadSplash = getLeadSplash(page.content)
  // A lead splash renders its own full-bleed title, so skip the PageTitle banner
  // to avoid showing the title twice. `hideTitle` also suppresses it on featured
  // nav pages, where the highlighted nav link already names the page.
  const showTitle = !leadSplash && !hideTitle
  // `hideTitle` suppresses a banner a visitor does not need, not the page's
  // only heading. A lead splash draws its own `<h1>` only when it carries a
  // title, and that field is optional upstream — so an untitled splash needs
  // this too.
  const srOnlyTitle = !showTitle && !leadSplash?.hasTitle
  const hasVideo = Boolean(video && video.hlsUrl)
  const hasHeader = hasVideo || showTitle || Boolean(author)

  // The article no longer constrains width. The Container here, the header
  // chrome, and RichText's own Container, the body, each own the readable
  // column instead. So full-bleed blocks can break out cleanly, and
  // rendering stays consistent in stories.
  return (
    <article>
      {srOnlyTitle ? (
        <Heading className="sr-only" level="h1">
          {page.title}
        </Heading>
      ) : null}

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
