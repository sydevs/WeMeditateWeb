import { useData } from 'vike-react/useData'
import type { LecturePageData } from './+data'
import { Heading } from '../../../../components/atoms'
import { LectureTemplate } from '../../../../components/templates'
import { useT } from '../../../../hooks/useT'
import { usePageHead } from '../../../../lib/head'
import { resolveLecture } from '../../../../lib/lecture-shape'
import { LivePreviewDocument } from '../../../../lib/live-preview/document'
import type { Locale, ResolvedLecture } from '../../../../server/sahajcloud-types'

/**
 * Full lecture page (/lectures/:id) — rendered with site chrome. LectureTemplate
 * wraps the player with a title and duration, and shows the Embed button.
 *
 * ## It is also what the SahajCloud preview panel points at
 *
 * `/lectures/:id/embed` is not a preview target, so this subscriber is the
 * lecture's only one. Off-preview the server sends no raw document at all
 * (`../_lecture.ts`), which is what the branch below renders.
 */
export function Page() {
  const { document: initialLecture, lecture, locale } = useData<LecturePageData>()

  if (!initialLecture) return <LectureBody lecture={lecture} locale={locale} />

  return (
    <LivePreviewDocument initialData={initialLecture} slug="lectures">
      {(liveLecture) => <LectureBody lecture={resolveLecture(liveLecture)} locale={locale} />}
    </LivePreviewDocument>
  )
}

/**
 * The page itself, from a resolved lecture.
 *
 * A component rather than a fragment, because `usePageHead` is a hook and the
 * branch above is an early return. Inside the subscriber that also makes the
 * `<title>` follow the stream, as `PageTemplate` already does on `/[slug]`.
 *
 * The `<title>` is set here rather than in `LectureTemplate`, which the embed
 * route also renders: the embed sets its own. `LectureTemplate` draws the
 * visible `<h1>` whenever the lecture has a title, so this only covers the one
 * that has none.
 */
function LectureBody({ lecture, locale }: { lecture: ResolvedLecture; locale: Locale }) {
  const t = useT()

  usePageHead({ meta: null, fallbackTitle: lecture.title })

  return (
    <>
      {/* `LectureTemplate` draws the visible `<h1>` from the title. Without one
          the page would have no heading at all, so this stands in, unseen. */}
      {lecture.title ? null : (
        <Heading className="sr-only" level="h1">
          {t('lecture.a11y.untitled_heading')}
        </Heading>
      )}

      <LectureTemplate showRelated lecture={lecture} locale={locale} />
    </>
  )
}
