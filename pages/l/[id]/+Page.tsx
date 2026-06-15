import { useData } from 'vike-react/useData'
import type { LectureEmbedPageData } from './+data'
import { LectureTemplate } from '../../../components/templates'

/**
 * Lecture embed page - designed for iframe embedding.
 * Uses LectureTemplate for consistent rendering; LayoutEmbed (configured in
 * +config.ts) removes the sidebar/navigation for embedding.
 */
export function Page() {
  const { lecture, locale } = useData<LectureEmbedPageData>()

  return <LectureTemplate lecture={lecture} locale={locale} />
}
