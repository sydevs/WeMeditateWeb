import { useData } from 'vike-react/useData'
import type { MeditationsIndexData } from './+data'
import { Container, Heading } from '@/components/atoms'
import { ContentGrid } from '@/components/molecules'
import { moodCardKey, moodCardLabel } from '@/components/organisms/MoodFinder'
import { useT } from '@/hooks/useT'

/** One column of the grid below, at each breakpoint it draws. */
const CARD_SIZES = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 360px'

/**
 * /meditations — a plain grid of every meditation the mood finder offers,
 * each named by the feeling it is for and how long it runs.
 *
 * The name is composed here, not read: `Meditations.title` is a virtual
 * English fallback with eight distinct values across these fourteen rows, so
 * two entries would otherwise look identical.
 */
export function Page() {
  const { moods } = useData<MeditationsIndexData>()
  const t = useT()
  const title = t('meditation.general.all_meditations')

  return (
    <Container className="py-12" maxWidth="xl">
      <Heading className="mb-8 text-center" level="h1">
        {title}
      </Heading>

      <ContentGrid
        headingLevel="h2"
        items={moods.map((mood) => ({
          id: moodCardKey(mood),
          title: moodCardLabel(t, mood),
          href: mood.href,
          thumbnailSrc: mood.thumbnail?.url ?? '',
          thumbnailAlt: mood.thumbnail?.alt || mood.moodTitle,
          aspectRatio: mood.thumbnail?.aspectRatio,
          playButton: true,
          durationMinutes: mood.durationMinutes,
        }))}
        sizes={CARD_SIZES}
      />
    </Container>
  )
}
