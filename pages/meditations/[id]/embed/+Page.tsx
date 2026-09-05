import { useData } from 'vike-react/useData'
import type { MeditationEmbedPageData } from './+data'
import { MeditationTemplate } from '../../../../components/templates'

/**
 * Meditation embed page (/meditations/:id/embed) — designed for iframe embedding.
 * Bare by construction: it sets no Layout, so it inherits only the global
 * LayoutRoot (no Header/Footer/nav). It hides the Embed button, because it
 * is already inside an iframe, to avoid embed-in-embed.
 */
export function Page() {
  const { meditation, musicTracks } = useData<MeditationEmbedPageData>()

  return (
    <MeditationTemplate meditation={meditation} musicTracks={musicTracks} showEmbedButton={false} />
  )
}
