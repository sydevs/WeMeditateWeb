/**
 * Unified Preview Component
 *
 * Routes to the appropriate preview component based on collection type.
 * Includes the preview banner and content wrapper.
 */

'use client'

import type { BasePreviewData, Page, Meditation } from './types'
import { PreviewBanner } from './PreviewBanner'
import { PagePreview } from './PagePreview'
import { MeditationPreview } from './MeditationPreview'

export interface PreviewProps {
  collection: BasePreviewData['collection']
  locale: string
  initialData: Page | Meditation
}

export function Preview({ collection, locale, initialData }: PreviewProps) {
  switch (collection) {
    case 'pages':
      return <PagePreview initialData={initialData as Page} />
    case 'meditations':
      return <MeditationPreview initialData={initialData as Meditation} />
  }
}
