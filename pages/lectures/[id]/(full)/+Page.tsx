import { useData } from 'vike-react/useData'
import type { LecturePageData } from './+data'
import { LectureTemplate } from '../../../../components/templates'
import { useContentHead } from '../../../../lib/head'

/**
 * Full lecture page (/lectures/:id) — rendered with site chrome. LectureTemplate
 * wraps the player with a title and duration, and shows the Embed button.
 */
export function Page() {
  const { lecture, locale } = useData<LecturePageData>()
  // Canonical only. `lectures` carries no `_status` at all upstream, so
  // there is no per-locale publish state to advertise — see the same note
  // on the meditation page.
  useContentHead()

  return <LectureTemplate showRelated lecture={lecture} locale={locale} />
}
