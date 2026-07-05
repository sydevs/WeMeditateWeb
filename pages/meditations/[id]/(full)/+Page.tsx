import { useData } from 'vike-react/useData'
import type { MeditationPageData } from './+data'
import { MeditationTemplate } from '../../../../components/templates'

/**
 * Full meditation page (/meditations/:id) — rendered with site chrome. Shows the
 * Embed button so visitors can grab the iframe snippet.
 */
export function Page() {
  const { meditation, musicTracks, relatedLectures } = useData<MeditationPageData>()

  return (
    <MeditationTemplate
      meditation={meditation}
      musicTracks={musicTracks}
      relatedLectures={relatedLectures}
    />
  )
}
