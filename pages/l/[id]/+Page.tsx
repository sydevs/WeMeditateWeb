import { useData } from 'vike-react/useData'
import type { LectureEmbedPageData } from './+data'
import { LecturePlayer } from '../../../components/templates'

/**
 * Lecture embed page - designed for iframe embedding.
 * Renders the bare LecturePlayer (no title/duration chrome); LayoutEmbed
 * (configured in +config.ts) removes the sidebar/navigation for embedding.
 */
export function Page() {
  const { lecture, locale } = useData<LectureEmbedPageData>()

  return <LecturePlayer lecture={lecture} locale={locale} />
}
