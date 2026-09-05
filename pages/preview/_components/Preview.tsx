/**
 * Unified preview component.
 *
 * Routes to the preview component for the given collection type.
 */

'use client'

import type { BasePreviewData } from './types'
import { PreviewBanner } from './PreviewBanner'
import { PagePreview } from './PagePreview'
import { MeditationPreview } from './MeditationPreview'
import { LecturePreview } from './LecturePreview'
import { usePreviewLinkGuard } from './previewNavigation'

export interface PreviewProps {
  /**
   * The previewed document, as a discriminated union (collection,
   * initialData, and locale, plus musicTracks for meditations). Preview
   * narrows on `collection`, so a collection-specific payload (for
   * example, a meditation's music) stays type-safe here, without
   * per-route narrowing or casts. FullPreviewData, which also carries
   * `settings`, is accepted structurally.
   */
  data: BasePreviewData
  /**
   * Whether the meditation or lecture preview should show the Embed
   * button. The embed preview (/preview/embed) renders inside an iframe,
   * so it passes false, to avoid embed-in-embed. This matches the
   * /meditations/:id/embed and /lectures/:id/embed routes.
   * @default true
   */
  showEmbedButton?: boolean
}

export function Preview({ data, showEmbedButton = true }: PreviewProps) {
  // Make every link in the preview inert, so editors do not navigate the
  // live-preview iframe away from the document being edited.
  usePreviewLinkGuard()

  switch (data.collection) {
    case 'pages':
      return <PagePreview initialData={data.initialData} />
    case 'meditations':
      return (
        <MeditationPreview
          initialData={data.initialData}
          musicTracks={data.musicTracks}
          showEmbedButton={showEmbedButton}
        />
      )
    case 'lectures':
      return (
        <LecturePreview
          initialData={data.initialData}
          locale={data.locale}
          showEmbedButton={showEmbedButton}
        />
      )
  }
}
