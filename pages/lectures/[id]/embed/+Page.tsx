import { useData } from 'vike-react/useData'
import type { LectureEmbedPageData } from './+data'
import { LecturePlayer } from '../../../../components/templates'

/**
 * Lecture embed page (/lectures/:id/embed) — designed for iframe embedding.
 * Bare by construction: it sets no Layout, so it inherits only the global
 * LayoutRoot (no Header/Footer/nav). Renders the bare LecturePlayer (no
 * title/duration chrome) because it is already inside an iframe.
 */
export function Page() {
  const { lecture, locale } = useData<LectureEmbedPageData>()

  return <LecturePlayer lecture={lecture} locale={locale} />
}
