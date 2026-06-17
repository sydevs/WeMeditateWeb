/**
 * Unified Preview Component
 *
 * Routes to the appropriate preview component based on collection type.
 * Includes the preview banner and content wrapper.
 */

'use client'

import type { BasePreviewData, Page, Meditation, Lecture } from './types'
import { PreviewBanner } from './PreviewBanner'
import { PagePreview } from './PagePreview'
import { MeditationPreview } from './MeditationPreview'
import { LecturePreview } from './LecturePreview'

export interface PreviewProps {
  collection: BasePreviewData['collection']
  locale: string
  initialData: Page | Meditation | Lecture
  /**
   * Whether the meditation/lecture preview should show the Embed button.
   * The embed preview (/preview/embed) renders inside an iframe, so it passes
   * false to avoid embed-in-embed — matching the /meditations/:id/embed and
   * /lectures/:id/embed routes.
   * @default true
   */
  showEmbedButton?: boolean
}

export function Preview({ collection, locale, initialData, showEmbedButton = true }: PreviewProps) {
  switch (collection) {
    case 'pages':
      return <PagePreview initialData={initialData as Page} />
    case 'meditations':
      return (
        <MeditationPreview
          initialData={initialData as Meditation}
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
