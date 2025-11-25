import { useData } from 'vike-react/useData'
import type { MeditationPageData } from './+data'
import { MeditationTemplate } from '../../../components/templates'

/**
 * Meditation page with full layout (sidebar, navigation)
 * Renders the meditation player with frame-based media
 */
export function Page() {
  const { meditation } = useData<MeditationPageData>()

  return <MeditationTemplate meditation={meditation} />
}
