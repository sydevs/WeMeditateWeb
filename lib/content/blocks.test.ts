import { describe, it, expect } from 'vitest'
import {
  contentIndexCard,
  contentIndexTrack,
  galleryImages,
  getLeadSplash,
  leadSplashFromRouteData,
  claimedSlots,
  choiceMeditationIds,
  meditationChoice,
  populatedImage,
  showcaseItems,
  splashSurface,
  subtleSystemItems,
  textColorToSurface,
  type ShowcaseItem,
} from './blocks'
import type { Page } from '@/types/sahajcloud'

/** Build a `pages.content` shape whose first child is `firstBlock` (or none). */
const leadContent = (firstBlock?: Record<string, unknown>) =>
  ({ root: { children: firstBlock ? [firstBlock] : [] } }) as unknown as Page['content']

/** A populated Cloudflare image (1600×900, about 16:9, maps to `video`). */
const cfImage = (over: Record<string, unknown> = {}) => ({
  id: 1,
  url: 'https://imagedelivery.net/acct/img/',
  alt: 'Alt text',
  width: 1600,
  height: 900,
  ...over,
})

const page = (id: number, slug: string, title: string, description?: string) => ({
  id,
  slug,
  title,
  meta: { description: description ?? null },
})

describe('populatedImage', () => {
  it('resolves a populated image with nearest aspect ratio', () => {
    expect(populatedImage(cfImage())).toEqual({
      url: 'https://imagedelivery.net/acct/img/',
      alt: 'Alt text',
      width: 1600,
      height: 900,
      aspectRatio: 'video',
    })
  })

  it('returns null for a bare id or an image with no url', () => {
    expect(populatedImage(42)).toBeNull()
    expect(populatedImage(cfImage({ url: '' }))).toBeNull()
    expect(populatedImage(null)).toBeNull()
  })
})

describe('galleryImages', () => {
  it('keeps only populated images', () => {
    const images = galleryImages([cfImage({ id: 1 }), 99, cfImage({ id: 2, url: '' })] as never)

    expect(images).toHaveLength(1)
    expect(images[0].aspectRatio).toBe('video')
  })

  it('returns [] for nullish input', () => {
    expect(galleryImages(null)).toEqual([])
    expect(galleryImages(undefined)).toEqual([])
  })
})

describe('showcaseItems', () => {
  it('maps a meditation to a card with a play button and duration', () => {
    const items: ShowcaseItem[] = [
      {
        relationTo: 'meditations',
        value: { id: 5, title: 'Morning', thumbnail: cfImage(), durationMinutes: 10 } as never,
      },
    ]
    const [card] = showcaseItems(items)

    expect(card.href).toBe('/meditations/5')
    expect(card.playButton).toBe(true)
    expect(card.durationMinutes).toBe(10)
    expect(card.thumbnailSrc).toBe('https://imagedelivery.net/acct/img/')
    expect(card.title).toBe('Morning')
  })

  it('maps a page using its meta.image and slug route', () => {
    const items: ShowcaseItem[] = [
      {
        relationTo: 'pages',
        value: { id: 2, slug: 'about', title: 'About', meta: { image: cfImage() } } as never,
      },
    ]
    const [card] = showcaseItems(items)

    expect(card.href).toBe('/about')
    expect(card.playButton).toBe(false)
    expect(card.thumbnailSrc).toBe('https://imagedelivery.net/acct/img/')
  })

  it('maps a lecture to a card by id (now routable)', () => {
    const items: ShowcaseItem[] = [
      { relationTo: 'lectures', value: { id: 3, title: 'Lecture', thumbnail: cfImage() } as never },
    ]
    const [card] = showcaseItems(items)

    expect(card.href).toBe('/lectures/3')
    expect(card.playButton).toBe(false)
    expect(card.thumbnailSrc).toBe('https://imagedelivery.net/acct/img/')
  })

  it('drops unroutable (app-cards), bare-id, and thumbnail-less refs', () => {
    const items: ShowcaseItem[] = [
      { relationTo: 'app-cards', value: { id: 3, title: 'Card', thumbnail: cfImage() } as never },
      { relationTo: 'pages', value: 7 },
      { relationTo: 'pages', value: { id: 8, slug: 'no-thumb', title: 'NT' } as never },
    ]

    expect(showcaseItems(items)).toEqual([])
  })
})

describe('subtleSystemItems', () => {
  it('maps SahajCloud field names to SVG node ids, dropping unpublished refs', () => {
    // The schema requires all twelve; an unpublished page arrives as a bare id.
    const items = subtleSystemItems({
      blockType: 'subtle-system',
      left: page(61, 'left-channel', 'Left Channel', 'The left side') as never,
      right: 62,
      center: 63,
      mooladhara: page(52, 'mooladhara-chakra', 'Mooladhara') as never,
      kundalini: 99,
      swadhistan: 53,
      nabhi: 54,
      void: page(55, 'void-chakra', 'Void') as never,
      anahat: 56,
      vishuddhi: 57,
      agnya: 58,
      sahasrara: 59,
    })

    expect(items.map((i) => i.id)).toEqual(['channel_left', 'chakra_1', 'chakra_3b'])
    const left = items.find((i) => i.id === 'channel_left')

    expect(left).toMatchObject({
      title: 'Left Channel',
      description: 'The left side',
      linkHref: '/left-channel',
    })
  })
})

describe('contentIndexCard', () => {
  it('routes pages by slug and meditations by id', () => {
    expect(
      contentIndexCard(
        { id: 2, slug: 'guide', title: 'Guide', meta: { image: cfImage() } },
        'pages',
      ),
    ).toMatchObject({ href: '/guide', playButton: false })

    expect(
      contentIndexCard(
        { id: 5, title: 'Med', thumbnail: cfImage(), durationMinutes: 8 },
        'meditations',
      ),
    ).toMatchObject({ href: '/meditations/5', playButton: true, durationMinutes: 8 })
  })

  it('routes lectures by id (/lectures/:id)', () => {
    expect(
      contentIndexCard({ id: 7, title: 'Lecture', thumbnail: cfImage() }, 'lectures'),
    ).toMatchObject({ href: '/lectures/7', playButton: false })
  })

  it('uses the /for-audience feed thumbnailUrl string when there is no thumbnail relationship', () => {
    const card = contentIndexCard(
      { id: 7, title: 'Lecture', thumbnailUrl: 'https://img.example/mq.jpg' },
      'lectures',
    )

    expect(card).toMatchObject({
      href: '/lectures/7',
      thumbnailSrc: 'https://img.example/mq.jpg',
    })
  })

  it('returns null when the doc has no id', () => {
    expect(contentIndexCard({ title: 'x' }, 'pages')).toBeNull()
  })

  it('attaches page-tag facets with display labels, omitting unknown tags', () => {
    const card = contentIndexCard(
      { id: 2, slug: 'guide', title: 'Guide', tags: ['wisdom', 'technique', 'bogus'] },
      'pages',
      { wisdom: 'Wisdom', technique: 'Technique' },
    )

    expect(card?.tags).toEqual([
      { id: 'wisdom', label: 'Wisdom' },
      { id: 'technique', label: 'Technique' },
    ])
  })

  it('falls back to the enum value when a page-tag label is missing', () => {
    // A SahajCloud gap must show the identifier, not an empty pill.
    const card = contentIndexCard(
      { id: 2, slug: 'guide', title: 'Guide', tags: ['wisdom'] },
      'pages',
    )

    expect(card?.tags).toEqual([{ id: 'wisdom', label: 'wisdom' }])
  })

  it('labels page-tag facets from SahajCloud, in the page locale', () => {
    const card = contentIndexCard(
      { id: 2, slug: 'guide', title: 'Guide', tags: ['wisdom'] },
      'pages',
      {
        wisdom: 'Sagesse',
      },
    )

    expect(card?.tags).toEqual([{ id: 'wisdom', label: 'Sagesse' }])
  })

  it('attaches lecture facets from populated user-choices (dropping bare ids / empty titles)', () => {
    const card = contentIndexCard(
      {
        id: 7,
        title: 'Lecture',
        userChoices: [{ id: 3, title: 'Calm' }, 99, { id: 4, title: '' }],
      },
      'lectures',
    )

    expect(card?.tags).toEqual([{ id: '3', label: 'Calm' }])
  })

  it('omits tags entirely when none resolve', () => {
    const card = contentIndexCard({ id: 2, slug: 'guide', title: 'Guide' }, 'pages')

    expect(card?.tags).toBeUndefined()
  })
})

describe('contentIndexTrack', () => {
  const album = (over: Record<string, unknown> = {}) => ({
    id: 1,
    artist: 'Nightingale',
    artistUrl: 'https://example.com/artist',
    artwork: cfImage(),
    ...over,
  })

  it('maps a song doc to a playable Track (stored duration, tags as id/label facets)', () => {
    const track = contentIndexTrack({
      id: 10,
      title: 'Raga',
      url: 'https://cdn/audio.mp3',
      duration: 212,
      album: album(),
      tags: [
        { id: 1, slug: 'strings', title: 'Strings' },
        42,
        { id: 2, slug: 'vocal', title: 'Vocal' },
      ],
    })

    expect(track).toEqual({
      url: 'https://cdn/audio.mp3',
      title: 'Raga',
      credit: 'Nightingale',
      creditURL: 'https://example.com/artist',
      thumbnailURL: 'https://imagedelivery.net/acct/img/',
      duration: 212,
      tags: [
        { id: 'strings', label: 'Strings' },
        { id: 'vocal', label: 'Vocal' },
      ],
    })
  })

  it('falls back to 0 for a song SahajCloud stores no length for', () => {
    // `0` is what Playlist reads as "unknown" and prints nothing for.
    // SahajCloud stores null for a song whose audio it could not measure.
    const song = { id: 10, title: 'Raga', url: 'https://cdn/audio.mp3' }

    expect(contentIndexTrack({ ...song, duration: null })?.duration).toBe(0)
  })

  it('labels a song tag from its SahajCloud title, falling back to the slug', () => {
    // The label used to be title-cased from the slug, which only ever
    // produced English. An untitled tag now shows its slug instead.
    const track = contentIndexTrack({
      id: 10,
      title: 'Raga',
      url: 'https://cdn/audio.mp3',
      tags: [
        { id: 1, slug: 'wind-instruments', title: 'Instruments à vent' },
        { id: 2, slug: 'vocal' },
      ],
    })

    expect(track?.tags).toEqual([
      { id: 'wind-instruments', label: 'Instruments à vent' },
      { id: 'vocal', label: 'vocal' },
    ])
  })

  it('returns null for a song with no playable url', () => {
    expect(contentIndexTrack({ id: 10, title: 'Raga', album: album() })).toBeNull()
  })

  it('degrades gracefully when the album is a bare id (no credit/artwork)', () => {
    const track = contentIndexTrack({ id: 10, title: 'Raga', url: 'https://cdn/a.mp3', album: 5 })

    expect(track).toMatchObject({ credit: '', creditURL: '', thumbnailURL: '', tags: [] })
  })

  it("falls back to the song's own thumbnailURL when the album has no artwork", () => {
    const track = contentIndexTrack({
      id: 10,
      title: 'Raga',
      url: 'https://cdn/a.mp3',
      album: { id: 1, artist: 'Nightingale', artwork: 99 }, // artwork unpopulated (bare id)
      thumbnailURL: 'https://cdn/song-thumb.jpg',
    })

    expect(track?.thumbnailURL).toBe('https://cdn/song-thumb.jpg')
  })
})

describe('meditationChoice', () => {
  const choice = (over: Record<string, unknown> = {}) => ({
    id: 25,
    type: 'duration',
    title: '5 min',
    url: 'https://assets/choice-25.svg',
    color: '#FFD591',
    timings: ['morning', 'evening'],
    morningMeditation: 105,
    ...over,
  })

  it('maps a choice, reading each slot off its own field', () => {
    expect(meditationChoice(choice({ eveningMeditation: 44 }))).toEqual({
      id: 25,
      kind: 'duration',
      title: '5 min',
      iconUrl: 'https://assets/choice-25.svg',
      color: '#FFD591',
      slots: { morning: 105, evening: 44 },
    })
  })

  it('omits a slot the choice claims but has not filled', () => {
    // `timings` names evening; `eveningMeditation` is absent. The slot is left
    // out rather than rendered as a tile linking nowhere — the caller reports it.
    const mapped = meditationChoice(choice())

    expect(mapped?.slots).toEqual({ morning: 105 })
    expect(claimedSlots(choice())).toEqual(['morning', 'evening'])
  })

  it('drops a goal choice, and one with no id or title', () => {
    expect(meditationChoice(choice({ type: 'goal' }))).toBeNull()
    expect(meditationChoice(choice({ title: '' }))).toBeNull()
    expect(meditationChoice(choice({ id: undefined }))).toBeNull()
  })

  it('leaves an absent icon and colour null rather than empty strings', () => {
    const mapped = meditationChoice(choice({ url: null, color: undefined }))

    expect(mapped).toMatchObject({ iconUrl: null, color: null })
  })

  it('dedupes the meditation ids across choices and slots', () => {
    const a = meditationChoice(choice({ id: 25, eveningMeditation: 44 }))
    const b = meditationChoice(choice({ id: 26, morningMeditation: 44 }))

    expect(choiceMeditationIds([a!, b!])).toEqual([105, 44])
  })
})

describe('textColorToSurface', () => {
  it('inverts textColor and falls back when absent', () => {
    // The inversion is fixed. Only the fallback for absent values varies per caller.
    expect(textColorToSurface('dark', 'light')).toBe('light')
    expect(textColorToSurface('light', 'dark')).toBe('dark')
    expect(textColorToSurface('dark', 'dark')).toBe('light') // explicit value wins over fallback
    expect(textColorToSurface(undefined, 'light')).toBe('light')
    expect(textColorToSurface(null, 'dark')).toBe('dark')
  })
})

describe('splashSurface', () => {
  it('inverts textColor → background surface, defaulting to dark', () => {
    // textColor describes the text. surface describes the background. They invert.
    expect(splashSurface('dark')).toBe('light')
    expect(splashSurface('light')).toBe('dark')
    // Absent or null becomes dark (the splash's historical hardcoded treatment).
    expect(splashSurface(undefined)).toBe('dark')
    expect(splashSurface(null)).toBe('dark')
  })
})

describe('getLeadSplash', () => {
  const splashBlock = (textColor?: 'dark' | 'light', title?: string) => ({
    type: 'block',
    fields: {
      blockType: 'splash',
      ...(textColor ? { textColor } : {}),
      ...(title === undefined ? {} : { title }),
    },
  })

  it('returns the derived surface when content leads with a splash block', () => {
    expect(getLeadSplash(leadContent(splashBlock()))).toEqual({ surface: 'dark', hasTitle: false })
    expect(getLeadSplash(leadContent(splashBlock('dark')))).toEqual({
      surface: 'light',
      hasTitle: false,
    })
    expect(getLeadSplash(leadContent(splashBlock('light')))).toEqual({
      surface: 'dark',
      hasTitle: false,
    })
  })

  it('reports whether the splash draws a heading of its own', () => {
    // `Splash` renders its `<h1>` only for a non-empty title, so a blank one
    // is the same as none: `PageTemplate` owes the page a heading either way.
    expect(getLeadSplash(leadContent(splashBlock(undefined, 'Discover it')))?.hasTitle).toBe(true)
    expect(getLeadSplash(leadContent(splashBlock(undefined, '   ')))?.hasTitle).toBe(false)
    expect(getLeadSplash(leadContent(splashBlock(undefined, '')))?.hasTitle).toBe(false)
  })

  it('returns null when the first block is not a splash', () => {
    expect(getLeadSplash(leadContent({ type: 'block', fields: { blockType: 'quote' } }))).toBeNull()
  })

  it('returns null when the first child is not a block, or content is empty', () => {
    expect(getLeadSplash(leadContent({ type: 'paragraph' }))).toBeNull()
    expect(getLeadSplash(leadContent())).toBeNull()
    expect(getLeadSplash(undefined as unknown as Page['content'])).toBeNull()
  })
})

describe('leadSplashFromRouteData', () => {
  const splashPage = (textColor?: 'dark' | 'light') => ({
    content: leadContent({
      type: 'block',
      fields: { blockType: 'splash', ...(textColor ? { textColor } : {}) },
    }),
  })

  it('reads page content on content routes ([slug])', () => {
    expect(leadSplashFromRouteData({ page: splashPage('dark') })).toEqual({
      surface: 'light',
      hasTitle: false,
    })
  })

  it('returns null without a lead splash or data', () => {
    expect(leadSplashFromRouteData(undefined)).toBeNull()
    expect(leadSplashFromRouteData({})).toBeNull()
  })
})
