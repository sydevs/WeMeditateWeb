import { describe, it, expect } from 'vitest'
import {
  contentIndexCard,
  galleryImages,
  isExternalUrl,
  populatedImage,
  showcaseItems,
  subtleSystemItems,
  type ShowcaseItem,
} from './cms-blocks'

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

  it('drops unroutable (lectures/app-cards), bare-id, and thumbnail-less refs', () => {
    const items: ShowcaseItem[] = [
      { relationTo: 'lectures', value: { id: 3, title: 'Lecture', thumbnail: cfImage() } as never },
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

  it('returns null when the doc has no id', () => {
    expect(contentIndexCard({ title: 'x' }, 'pages')).toBeNull()
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
