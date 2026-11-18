import { useData } from 'vike-react/useData'
import type { LecturePageData } from './+data'
import { Heading } from '../../../../components/atoms'
import { LectureTemplate } from '../../../../components/templates'
import { useT } from '../../../../hooks/useT'
import { usePageHead } from '../../../../lib/head'

/**
 * Full lecture page (/lectures/:id) — rendered with site chrome. LectureTemplate
 * wraps the player with a title and duration, and shows the Embed button.
 *
 * The `<title>` is set here rather than in `LectureTemplate`, which the embed
 * route and the live preview also render: the embed sets its own.
 * `LectureTemplate` draws the visible `<h1>` whenever the lecture has a title,
 * so this route only covers the one that has none.
 */
export function Page() {
  const { lecture, locale } = useData<LecturePageData>()
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
