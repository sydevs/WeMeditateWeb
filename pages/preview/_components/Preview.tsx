/**
 * Unified Preview Component
 *
 * Routes to the appropriate preview component based on collection type.
 * Includes the preview banner and content wrapper.
 */

'use client'

import type { BasePreviewData, Page, Meditation, Lecture, MeditationSong } from './types'
import { PreviewBanner } from './PreviewBanner'
import { PagePreview } from './PagePreview'
import { MeditationPreview } from './MeditationPreview'
import { LecturePreview } from './LecturePreview'

export interface PreviewProps {
  collection: BasePreviewData['collection']
  locale: string
  initialData: Page | Meditation | Lecture
  /**
   * Background-music tracks for a meditation preview (ignored by other
   * collections). Threaded into the player so live preview matches the
   * published routes.
   * @default []
   */
  musicTracks?: MeditationSong[]
  /**
   * Whether the meditation/lecture preview should show the Embed button.
   * The embed preview (/preview/embed) renders inside an iframe, so it passes
   * false to avoid embed-in-embed — matching the /meditations/:id/embed and
   * /lectures/:id/embed routes.
   * @default true
   */
  showEmbedButton?: boolean
}

export function Preview({
  collection,
  locale,
  initialData,
  musicTracks = [],
  showEmbedButton = true,
}: PreviewProps) {
  switch (collection) {
    case 'pages':
      return <PagePreview initialData={initialData as Page} />
    case 'meditations':
      return (
        <MeditationPreview
          initialData={initialData as Meditation}
          musicTracks={musicTracks}
          showEmbedButton={showEmbedButton}
        />
      )
    case 'lectures':
      return (
        <LecturePreview
          initialData={initialData as Lecture}
          locale={locale}
          showEmbedButton={showEmbedButton}
        />
      )
  }
}
