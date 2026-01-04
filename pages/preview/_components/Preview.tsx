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
  return (
    <>
      <PreviewBanner collection={collection} locale={locale} />

      {/* Content with top padding to account for fixed banner */}
      <div className="pt-20 min-h-screen">
        {collection === 'pages' && <PagePreview initialData={initialData as Page} />}
        {collection === 'meditations' && <MeditationPreview initialData={initialData as Meditation} />}
      </div>
    </>
  )
}
