import { useData } from 'vike-react/useData'
import type { LecturePageData } from './+data'
import { Heading } from '../../../../components/atoms'
import { LectureTemplate } from '../../../../components/templates'
import { useT } from '../../../../hooks/useT'
import { usePageHead } from '../../../../lib/head'
import { resolveLecture } from '../../../../lib/lecture-shape'
import { LivePreviewDocument } from '../../../../lib/live-preview/document'

/**
 * Full lecture page (/lectures/:id) — rendered with site chrome. LectureTemplate
 * wraps the player with a title and duration, and shows the Embed button.
 *
 * The `<title>` is set here rather than in `LectureTemplate`, which the embed
 * route and the live preview also render: the embed sets its own.
 * `LectureTemplate` draws the visible `<h1>` whenever the lecture has a title,
 * so this route only covers the one that has none.
 *
 * ## It is also what the SahajCloud preview panel points at
 *
 * Off-preview this renders the server's lecture and mounts nothing at all;
 * under an open session it renders the admin's unsaved edits. See
 * `lib/live-preview/document.tsx`. `/lectures/:id/embed` is not a preview
 * target, so the subscriber is this route's alone.
 */
export function Page() {
  const { document: initialLecture, lecture, locale } = useData<LecturePageData>()
  const t = useT()

  // The server's title, not the stream's: `useConfig` is a hook, and the
  // panel is a preview of the page rather than of its tab.
  usePageHead({ meta: null, fallbackTitle: lecture.title })

  return (
    <LivePreviewDocument initialData={initialLecture} slug="lectures">
      {(liveLecture) => {
        // ⚠ The view model is rebuilt here, never subscribed to. A clip's
        // playback source lives on its parent, and merging unsaved fields
        // into an already-resolved lecture would overwrite it.
        const resolved = resolveLecture(liveLecture)

        return (
          <>
            {/* `LectureTemplate` draws the visible `<h1>` from the title. Without one
                the page would have no heading at all, so this stands in, unseen. */}
            {resolved.title ? null : (
              <Heading className="sr-only" level="h1">
                {t('lecture.a11y.untitled_heading')}
              </Heading>
            )}

            <LectureTemplate showRelated lecture={resolved} locale={locale} />
          </>
        )
      }}
    </LivePreviewDocument>
  )
}
