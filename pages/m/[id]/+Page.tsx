import { useData } from 'vike-react/useData'
import type { MeditationEmbedPageData } from './+data'
import { MeditationTemplate } from '../../../components/templates'

/**
 * Meditation embed page - designed for iframe embedding
 * Uses MeditationTemplate for consistent data parsing and error handling.
 * The LayoutEmbed (configured in +config.ts) removes sidebar/navigation for embedding.
 */
export function Page() {
  const { meditation } = useData<MeditationEmbedPageData>()

  return <MeditationTemplate meditation={meditation} />
}
