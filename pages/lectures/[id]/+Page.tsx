import { useData } from 'vike-react/useData'
import type { LecturePageData } from './+data'
import { LectureTemplate } from '../../../components/templates'

/**
 * Lecture page with full layout (sidebar, navigation).
 * Renders the HLS video player; clips play within their start/stop window.
 */
export function Page() {
  const { lecture, locale } = useData<LecturePageData>()

  return <LectureTemplate lecture={lecture} locale={locale} />
}
