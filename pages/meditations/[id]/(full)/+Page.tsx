import { useData } from 'vike-react/useData'
import type { MeditationPageData } from './+data'
import { Heading } from '../../../../components/atoms'
import { MeditationTemplate } from '../../../../components/templates'
import { useT } from '../../../../hooks/useT'

/**
 * Full meditation page (/meditations/:id) — rendered with site chrome. Shows the
 * Embed button so visitors can grab the iframe snippet.
 *
 * The `<h1>` is set here rather than in `MeditationTemplate`, which the embed
 * route and the live preview also render: the embed owes no page heading. The
 * head is the route's `+data.ts`, for the same reason.
 */
export function Page() {
  const { meditation, musicTracks } = useData<MeditationPageData>()
  const t = useT()

  return (
    <>
      {/* Screen-reader-only: the player draws its own frame art and the design
          carries no visible heading, but a page still owes one outline root. */}
      <Heading className="sr-only" level="h1">
        {meditation.title || t('meditation.general.untitled')}
      </Heading>

      <MeditationTemplate showRelated meditation={meditation} musicTracks={musicTracks} />
    </>
  )
}
