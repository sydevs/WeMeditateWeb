import { useData } from 'vike-react/useData'
import type { MeditationEmbedPageData } from './+data'
import { MeditationTemplate } from '../../../../components/templates'

/**
 * Meditation embed page (/meditations/:id/embed) — designed for iframe embedding.
 * Bare by construction: it sets no Layout, so it inherits only the global
 * LayoutRoot (no Header/Footer/nav). Already inside an iframe, so the Embed
 * button is hidden to avoid offering embed-in-embed.
 */
export function Page() {
  const { meditation } = useData<MeditationEmbedPageData>()

  return <MeditationTemplate meditation={meditation} showEmbedButton={false} />
}
