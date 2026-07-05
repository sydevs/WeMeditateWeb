/**
 * Lecture Preview Component
 *
 * Preview component for the Lecture content type using PayloadCMS live preview.
 * Live preview delivers a RAW Lecture (full or clip), so this replicates the
 * server-side clip→parent metadata/subtitle merge client-side via resolveLecture
 * — fetching at depth 2 so a clip's `fullLecture` (and its metadata) is populated.
 */

'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import type { Lecture, RelatedMeditationCard } from './types'
import { LectureTemplate } from '../../../components/templates'
import { resolveLecture } from '../../../lib/lecture-shape'

export interface LecturePreviewProps {
  initialData: Lecture
  /** Current locale — selects which subtitle track is the default. */
  locale?: string
  /**
   * Related meditations (from the loader), shown below the player. Fixed for the
   * preview session — live updates only carry the edited lecture's own fields.
   * @default []
   */
  relatedMeditations?: RelatedMeditationCard[]
  /** Whether the underlying template shows the Embed button. @default true */
  showEmbedButton?: boolean
}

export function LecturePreview({
  initialData,
  locale,
  relatedMeditations = [],
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
      relatedMeditations={relatedMeditations}
      showEmbedButton={showEmbedButton}
    />
  )
}
