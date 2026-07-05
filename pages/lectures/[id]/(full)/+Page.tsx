import { useData } from 'vike-react/useData'
import type { LecturePageData } from './+data'
import { LectureTemplate } from '../../../../components/templates'

/**
 * Full lecture page (/lectures/:id) — rendered with site chrome. LectureTemplate
 * wraps the player with a title + duration and shows the Embed button.
 */
export function Page() {
  const { lecture, locale } = useData<LecturePageData>()

  return <LectureTemplate showRelated lecture={lecture} locale={locale} />
}
