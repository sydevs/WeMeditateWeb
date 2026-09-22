import { useData } from 'vike-react/useData'

import type { MeditationEmbedPageData } from './+data'
import { MeditationTemplate } from '../../../../components/templates'
import { LivePreviewDocument } from '../../../../lib/live-preview/document'
import { useFrameEditorChannel } from '../../../../lib/live-preview/frame-editor'
import { sahajCloudOrigin, useDocumentPreviewActive } from '../../../../lib/live-preview/session'

/**
 * Meditation embed page (/meditations/:id/embed) — designed for iframe
 * embedding. Bare by construction: it sets no Layout, so it inherits only the
 * global LayoutRoot (no Header/Footer/nav). It hides the Embed button, because
 * it is already inside an iframe, to avoid embed-in-embed.
 *
 * ## It is also what the CMS frame editor points at
 *
 * This used to be `/preview/embed`, a second renderer kept approximately equal
 * to this one. Two `postMessage` channels run on this page while a preview
 * session is open, and neither belongs inline here:
 *
 * - `LivePreviewDocument` — Payload's unsaved-edit stream for the document
 * - `useFrameEditorChannel` — SahajCloud's own seek/playhead channel, which is
 *   what lets an editor click a frame thumbnail and read back the timestamp a
 *   new frame is written at
 *
 * Both are gated on the CMS origin and both fail CLOSED when it is unset.
 */
export function Page() {
  const { meditation: initialMeditation, musicTracks } = useData<MeditationEmbedPageData>()

  const previewingThisMeditation = useDocumentPreviewActive()
  // The frame channel is not Payload's, and not the document stream's to gate:
  // it is a hook on this page either way, enabled or inert.
  const { seekTo, onPlaybackTimeUpdate } = useFrameEditorChannel(
    previewingThisMeditation,
    sahajCloudOrigin(),
  )

  return (
    <LivePreviewDocument initialData={initialMeditation} slug="meditations">
      {(meditation) => (
        <MeditationTemplate
          meditation={meditation}
          musicTracks={musicTracks}
          seekTo={seekTo}
          showEmbedButton={false}
          timeDisplay={previewingThisMeditation ? 'elapsed' : undefined}
          onPlaybackTimeUpdate={previewingThisMeditation ? onPlaybackTimeUpdate : undefined}
        />
      )}
    </LivePreviewDocument>
  )
}
