import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MeditationLibrary } from './MeditationLibrary'
import type { ResolvedMeditationLibrary } from '@/lib/content/blocks'
import { enT } from '@/lib/i18n/i18n'
import { anchorFor, classOf } from '@/tests/_helpers/markup'

const LIBRARY: ResolvedMeditationLibrary = {
  choices: [
    {
      id: 1,
      kind: 'mood',
      title: 'Excited for the day!',
      iconUrl: 'https://assets.test/choice-1.svg',
      color: '#FFD591',
      slots: { morning: 69, evening: 89 },
    },
    {
      id: 8,
      kind: 'mood',
      title: 'Need to focus',
      iconUrl: null,
      color: 'rgb(255,0,0)', // not a hex value, so it must not reach the style
      slots: { afternoon: 85 },
    },
    {
      id: 25,
      kind: 'duration',
      title: '5 min',
      iconUrl: 'https://assets.test/choice-25.svg',
      color: '#A4D9D1',
      slots: { morning: 69 },
    },
  ],
  meditations: [
    { id: 69, href: '/meditations/69', durationMinutes: 15, thumbnail: null, choiceIds: [1, 25] },
    { id: 89, href: '/meditations/89', durationMinutes: 13, thumbnail: null, choiceIds: [1] },
    { id: 85, href: '/meditations/85', durationMinutes: 20, thumbnail: null, choiceIds: [8] },
  ],
}

const render = (library: ResolvedMeditationLibrary = LIBRARY) =>
  renderToStaticMarkup(<MeditationLibrary library={library} />)

/** The unavailable line's apostrophe renders as `&#x27;`, so match around it. */
const UNAVAILABLE = 'load the meditations just now'

describe('MeditationLibrary', () => {
  it('asks both questions and names the region', () => {
    const html = render()

    expect(html).toContain(enT('meditation.general.finder_question'))
    expect(html).toContain(enT('meditation.general.length_question'))
    expect(html).toContain(enT('meditation.general.all_meditations'))
    expect(html).toContain(`aria-label="${enT('meditation.a11y.finder_region')}"`)
  })

  it('server-renders every (choice, slot) tile link, not just one slot', () => {
    // `useEffect` does not run under an SSR render, which is exactly the
    // pre-mount state a crawler and a visitor without JavaScript get.
    const html = render()

    expect(anchorFor(html, '/meditations/69')).not.toBe('')
    expect(anchorFor(html, '/meditations/89')).not.toBe('')
    expect(anchorFor(html, '/meditations/85')).not.toBe('')
  })

  it('server-renders every meditation card, named by its mood or its length', () => {
    const html = render()

    // 69 and 89 are named by a mood; 85's own mood names it too. A card with
    // only a duration choice falls back to the length label.
    expect(html).toContain(
      enT('meditation.general.mood_meditation_label', { mood: 'Excited for the day!', count: 15 }),
    )
    expect(html).toContain(
      enT('meditation.general.mood_meditation_label', { mood: 'Need to focus', count: 20 }),
    )
    // Never the upstream `Meditations.title`, which is a virtual English fallback.
    expect(html).not.toContain('Meditation for Nabhi')
  })

  it('labels a meditation no mood names by its length alone', () => {
    const html = render({
      choices: LIBRARY.choices.filter((choice) => choice.kind === 'duration'),
      meditations: [
        { id: 69, href: '/meditations/69', durationMinutes: 15, thumbnail: null, choiceIds: [25] },
      ],
    })

    expect(html).toContain(enT('meditation.general.length_meditation_label', { count: 15 }))
  })

  it('renders a chip per choice, with the choice icon', () => {
    const html = render()

    expect(html).toContain('>5 min<')
    expect(html).toContain('https://assets.test/choice-25.svg')
    expect(html).toContain(enT('article.general.filter_all'))
  })

  it('keeps a non-hex accent out of the inline style', () => {
    const html = render()

    expect(html).toContain('background-color:#FFD591')
    expect(html).not.toContain('rgb(255,0,0)')
  })

  it('holds the tile row height so narrowing to one slot cannot collapse it', () => {
    // The browser drops two slots' tiles after mount. The row keeps a floor so
    // the list below it does not jump between slots.
    expect(classOf(render(), '<ul').split(' ')).toContain('min-h-24')
  })

  it('says it cannot load rather than rendering a blank region', () => {
    const empty = render({ choices: [], meditations: [] })

    expect(empty).toContain(UNAVAILABLE)
    expect(empty).not.toContain(enT('meditation.general.finder_question'))
  })

  it('says the same when the choices resolved but no meditation survived', () => {
    const html = render({ choices: LIBRARY.choices, meditations: [] })

    expect(html).toContain(UNAVAILABLE)
  })
})
