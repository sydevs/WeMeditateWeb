import { describe, it, expect } from 'vitest'
import {
  contentIndexCard,
  contentIndexTrack,
  galleryImages,
  getLeadSplash,
  leadSplashFromRouteData,
  isExternalUrl,
  populatedImage,
  showcaseItems,
  splashTheme,
  subtleSystemItems,
  textColorToTheme,
  type ShowcaseItem,
} from './cms-blocks'
import type { Page } from '../server/cms-types'

/** Build a `pages.content` shape whose first child is `firstBlock` (or none). */
const leadContent = (firstBlock?: Record<string, unknown>) =>
  ({ root: { children: firstBlock ? [firstBlock] : [] } }) as unknown as Page['content']

/** A populated Cloudflare image (1600×900 ≈ 16:9 → `video`). */
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
  it('maps CMS field names to SVG node ids, dropping unpublished refs', () => {
    const items = subtleSystemItems({
      left: page(61, 'left-channel', 'Left Channel', 'The left side') as never,
      mooladhara: page(52, 'mooladhara-chakra', 'Mooladhara') as never,
      void: page(55, 'void-chakra', 'Void') as never,
      kundalini: 99, // bare id → dropped
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
    )

    expect(card?.tags).toEqual([
      { id: 'wisdom', label: 'Wisdom' },
      { id: 'technique', label: 'Technique' },
    ])
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

  it('maps a song doc to a playable Track (duration 0, tags as songTag slugs)', () => {
    const track = contentIndexTrack({
      id: 10,
      title: 'Raga',
      url: 'https://cdn/audio.mp3',
      album: album(),
      tags: [{ id: 1, slug: 'strings' }, 42, { id: 2, slug: 'vocal' }],
    })

    expect(track).toEqual({
      url: 'https://cdn/audio.mp3',
      title: 'Raga',
      credit: 'Nightingale',
      creditURL: 'https://example.com/artist',
      thumbnailURL: 'https://imagedelivery.net/acct/img/',
      duration: 0,
      tags: ['strings', 'vocal'],
    })
  })

  it('returns null for a song with no playable url', () => {
    expect(contentIndexTrack({ id: 10, title: 'Raga', album: album() })).toBeNull()
  })

  it('degrades gracefully when the album is a bare id (no credit/artwork)', () => {
    const track = contentIndexTrack({ id: 10, title: 'Raga', url: 'https://cdn/a.mp3', album: 5 })

    expect(track).toMatchObject({ credit: '', creditURL: '', thumbnailURL: '', tags: [] })
  })
})

describe('isExternalUrl', () => {
  it('detects absolute http(s) urls only', () => {
    expect(isExternalUrl('https://example.com')).toBe(true)
    expect(isExternalUrl('http://example.com')).toBe(true)
    expect(isExternalUrl('/about')).toBe(false)
    expect(isExternalUrl('#anchor')).toBe(false)
  })
})

describe('textColorToTheme', () => {
  it('inverts textColor and falls back when absent', () => {
    // The inversion is fixed; only the fallback for absent values varies per caller.
    expect(textColorToTheme('dark', 'light')).toBe('light')
    expect(textColorToTheme('light', 'dark')).toBe('dark')
    expect(textColorToTheme('dark', 'dark')).toBe('light') // explicit value wins over fallback
    expect(textColorToTheme(undefined, 'light')).toBe('light')
    expect(textColorToTheme(null, 'dark')).toBe('dark')
  })
})

describe('splashTheme', () => {
  it('inverts textColor → background theme, defaulting to dark', () => {
    // textColor describes the *text*; theme describes the *background* (they invert).
    expect(splashTheme('dark')).toBe('light')
    expect(splashTheme('light')).toBe('dark')
    // Absent/null → dark (the splash's historical hardcoded treatment).
    expect(splashTheme(undefined)).toBe('dark')
    expect(splashTheme(null)).toBe('dark')
  })
})

describe('getLeadSplash', () => {
  const splashBlock = (textColor?: 'dark' | 'light') => ({
    type: 'block',
    fields: { blockType: 'splash', ...(textColor ? { textColor } : {}) },
  })

  it('returns the derived theme when content leads with a splash block', () => {
    expect(getLeadSplash(leadContent(splashBlock()))).toEqual({ theme: 'dark' })
    expect(getLeadSplash(leadContent(splashBlock('dark')))).toEqual({ theme: 'light' })
    expect(getLeadSplash(leadContent(splashBlock('light')))).toEqual({ theme: 'dark' })
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
    expect(leadSplashFromRouteData({ page: splashPage('dark') })).toEqual({ theme: 'light' })
  })

  it('reads initialData content on a pages preview', () => {
    expect(leadSplashFromRouteData({ collection: 'pages', initialData: splashPage() })).toEqual({
      theme: 'dark',
    })
  })

  it('ignores initialData for non-page previews (meditations/lectures)', () => {
    expect(
      leadSplashFromRouteData({ collection: 'meditations', initialData: splashPage() }),
    ).toBeNull()
  })

  it('returns null without a lead splash or data', () => {
    expect(leadSplashFromRouteData(undefined)).toBeNull()
    expect(leadSplashFromRouteData({})).toBeNull()
  })
})
