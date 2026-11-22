import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MoodFinder } from './MoodFinder'
import type { MoodCard } from '@/lib/content/blocks'
import { enT } from '@/lib/i18n/i18n'
import { anchorFor, classOf, openTag } from '@/tests/_helpers/markup'

const mood = (moodId: number, moodTitle: string, minutes: number): MoodCard => ({
  moodId,
  moodTitle,
  iconUrl: `https://assets.test/mood-${moodId}.svg`,
  color: '#FFD591',
  href: `/meditations/${moodId * 3}`,
  durationMinutes: minutes,
  thumbnail: null,
})

const moods = [mood(1, 'Excited for the day!', 15), mood(2, 'Feel fine', 13)]

describe('MoodFinder', () => {
  it('names the region and asks the question, both from SahajCloud', () => {
    const html = renderToStaticMarkup(<MoodFinder moods={moods} />)

    expect(openTag(html, 'section')).toContain(
      `aria-label="${enT('meditation.a11y.finder_region')}"`,
    )
    expect(html).toContain(enT('meditation.general.finder_question'))
  })

  it('names each meditation by its mood and its length', () => {
    const html = renderToStaticMarkup(<MoodFinder moods={moods} />)

    expect(html).toContain(
      enT('meditation.general.mood_meditation_label', { mood: 'Excited for the day!', count: 15 }),
    )
    expect(html).toContain(
      enT('meditation.general.mood_meditation_label', { mood: 'Feel fine', count: 13 }),
    )
  })

  it('links each tile at the meditation the mood names', () => {
    const html = renderToStaticMarkup(<MoodFinder moods={moods} />)

    expect(anchorFor(html, '/meditations/3')).not.toBe('')
    expect(anchorFor(html, '/meditations/6')).not.toBe('')
    expect(html).not.toContain('/undefined')
  })

  it('offers the list of every meditation', () => {
    const html = renderToStaticMarkup(<MoodFinder moods={moods} />)

    expect(anchorFor(html, '/meditations')).not.toBe('')
    expect(html).toContain(enT('meditation.general.all_meditations'))
  })

  it('says it cannot load rather than leaving a blank space', () => {
    const html = renderToStaticMarkup(<MoodFinder moods={[]} />)

    // React escapes the apostrophe this string carries, so the tail of it is
    // what survives the render unchanged.
    expect(html).toContain('load the meditations just now')
    expect(html).not.toContain(enT('meditation.general.all_meditations'))
  })

  it('keeps the editor colour off every text element', () => {
    const html = renderToStaticMarkup(<MoodFinder moods={moods} />)
    const accent = html.slice(html.indexOf('background-color'))

    // The only styled element is the icon's backing shape, and it is hidden
    // from the accessibility tree because it carries no words.
    expect(accent).toContain('aria-hidden')
    expect(classOf(html, 'Excited for the day!')).not.toContain('background-color')
  })

  it('refuses a colour that is not a hex value', () => {
    const html = renderToStaticMarkup(
      <MoodFinder moods={[{ ...mood(3, 'Calm', 15), color: 'url(javascript:alert(1))' }]} />,
    )

    expect(html).not.toContain('javascript')
    expect(html).not.toContain('background-color')
  })
})
