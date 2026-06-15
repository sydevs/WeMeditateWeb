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

import type { Page, Author, Video, Image } from '../../server/cms-types'
import { RichText, VideoPlayer } from '../organisms'
import { Author as AuthorByline } from '../molecules/Author'
import { usePageHead } from '../../lib/head'

/** Narrow a relationship field to its populated document (vs. a bare id). */
function isPopulated<T extends object>(value: number | T | null | undefined): value is T {
  return typeof value === 'object' && value !== null
}

/** Resolve an Image relationship to its URL, if populated. */
function imageUrl(image: number | Image | null | undefined): string | undefined {
  return isPopulated<Image>(image) ? (image.url ?? undefined) : undefined
}

export interface PageTemplateProps {
  /**
   * Page data from PayloadCMS
   */
  page: Page
}

export function PageTemplate({ page }: PageTemplateProps) {
  // Set <title>/description/og:image from CMS meta (must run unconditionally).
  usePageHead({ meta: page.meta, fallbackTitle: page.title })

  const author = isPopulated<Author>(page.author) ? page.author : null
  const video = isPopulated<Video>(page.featuredVideo) ? page.featuredVideo : null

  return (
    <article className="max-w-4xl mx-auto">
      {video && video.hlsUrl ? (
        <VideoPlayer
          className="mb-8"
          hlsUrl={video.hlsUrl}
          poster={imageUrl(video.thumbnail)}
          subtitles={video.subtitles}
          title={video.title}
        />
      ) : null}

      <header className="mb-8">
        <h1 className="text-5xl font-bold mb-4">{page.title}</h1>
        {page.createdAt ? (
          <time className="text-sm text-gray-500">
            Published: {new Date(page.createdAt).toLocaleDateString()}
          </time>
        ) : null}
        {author ? (
          <AuthorByline
            className="mt-6"
            countryCode={author.countryCode ?? undefined}
            imageUrl={imageUrl(author.photo)}
            meditationYears={author.yearsMeditating ?? undefined}
            name={author.name}
            variant="mini"
          />
        ) : null}
      </header>

      <RichText content={page.content} />
    </article>
  )
}
