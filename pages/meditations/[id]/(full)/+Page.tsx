import { useData } from 'vike-react/useData'
import type { MeditationPageData } from './+data'
import { MeditationTemplate } from '../../../../components/templates'
import { useContentHead } from '../../../../lib/head'

/**
 * Full meditation page (/meditations/:id) — rendered with site chrome. Shows the
 * Embed button so visitors can grab the iframe snippet.
 */
export function Page() {
  const { meditation, musicTracks } = useData<MeditationPageData>()
  // Canonical only, with no `hreflang` cluster: `meditations` does not opt
  // into per-locale publish state upstream (SahajCloud#718 covers `pages`
  // and `app-cards`), so there is no per-document claim that a translation
  // of this URL exists. Advertising the site's locale set instead is the
  // failure this ticket's whole investigation was about.
  useContentHead()

  return <MeditationTemplate showRelated meditation={meditation} musicTracks={musicTracks} />
}
