/**
 * Lecture preview component.
 *
 * Preview component for the Lecture content type, using PayloadCMS live
 * preview. Live preview delivers a raw Lecture (full or clip). This
 * replicates the server-side merge of a clip's metadata and subtitle from
 * its parent, client-side, with resolveLecture. It fetches at depth 2, so
 * a clip's `fullLecture` (and its metadata) is populated.
 */

'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import type { Lecture } from './types'
import { LectureTemplate } from '../../../components/templates'
import { resolveLecture } from '../../../lib/lecture-shape'

export interface LecturePreviewProps {
  initialData: Lecture
  /** Current locale — selects which subtitle track is the default. */
  locale?: string
  /**
   * Whether the underlying template shows the Embed button. This also
   * gates the client-loaded related-content section, because both are
   * full-chrome features. They show in the full preview, but not in the
   * bare embed preview.
   * @default true
   */
  showEmbedButton?: boolean
}

export function LecturePreview({
  initialData,
  locale,
  showEmbedButton = true,
}: LecturePreviewProps) {
  // useLivePreview listens for postMessage updates from SahajCloud admin.
  // depth: 2 populates a clip's `fullLecture` so its parent metadata resolves.
  const { data: liveData } = useLivePreview<Lecture>({
    initialData,
    serverURL: import.meta.env.PUBLIC__SAHAJCLOUD_URL,
    depth: 2,
  })

  // Normalize full lectures and clips into the same shape the template expects.
  const lecture = resolveLecture(liveData ?? initialData)

  return (
    <LectureTemplate
      lecture={lecture}
      locale={locale}
      showEmbedButton={showEmbedButton}
      showRelated={showEmbedButton}
    />
  )
}
