import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Sentry from '@sentry/react'
import { droppedImages, reportDroppedImages } from './dropped-images'
import { forgetReportedWarnings } from './error-utils'

// `warnOnce` reports through `@sentry/react` (see error-utils.ts).
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))

const image = (id: number) => ({
  id,
  url: `https://imagedelivery.net/acct/img-${id}/public`,
  alt: 'Alt',
  width: 800,
  height: 600,
})

const upload = (value: unknown) => ({ type: 'upload', relationTo: 'images', value, version: 1 })

const gallery = (items: unknown[]) => ({
  type: 'block',
  fields: { blockType: 'image-gallery', id: 'g', items },
  version: 2,
})

const content = (...children: unknown[]) => ({ root: { type: 'root', children } })

describe('droppedImages', () => {
  it('names each upload and gallery item the converters would drop', () => {
    const found = droppedImages(
      content(
        upload(377),
        // What the live /sushumna read returns for its deleted image at depth 3.
        upload(null),
        upload(image(1)),
        { type: 'paragraph', children: [upload({ id: 9, url: null })] },
        gallery([image(2), 41, image(3)]),
      ),
    )

    expect(found).toEqual([
      { node: 'upload', id: 377 },
      { node: 'upload', id: null },
      { node: 'upload', id: 9 },
      { node: 'image-gallery', id: 41 },
    ])
  })

  it('finds nothing in a page whose images all resolve, or in no content at all', () => {
    expect(droppedImages(content(upload(image(1)), gallery([image(2), image(3)])))).toEqual([])
    expect(droppedImages(null)).toEqual([])
    expect(droppedImages({})).toEqual([])
  })

  it('leaves an upload from another collection to its own renderer', () => {
    expect(droppedImages(content({ ...upload(5), relationTo: 'songs' }))).toEqual([])
  })
})

describe('reportDroppedImages', () => {
  beforeEach(() => {
    forgetReportedWarnings()
    vi.mocked(Sentry.captureMessage).mockClear()
    vi.restoreAllMocks()
  })

  it('sends one event per distinct gap, not one per render', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const page = { slug: 'sushumna', content: content(upload(9101)) }

    reportDroppedImages(page, 'en')
    reportDroppedImages(page, 'en')

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
    expect(vi.mocked(Sentry.captureMessage).mock.calls[0][1]).toMatchObject({
      level: 'warning',
      extra: { slug: 'sushumna', dropped: [{ node: 'upload', id: 9101 }], locale: 'en' },
    })
  })

  it('reports the same gap once in each locale that carries it', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Live /sushumna: both locales point at deleted image 377, which every
    // depth-3 read returns as `null`, so the refs alone cannot tell them apart.
    const page = { slug: 'sushumna-locales', content: content(upload(null)) }

    reportDroppedImages(page, 'en')
    reportDroppedImages(page, 'pt-br')
    reportDroppedImages(page, 'pt-br')

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
    expect(vi.mocked(Sentry.captureMessage).mock.calls[1][1]).toMatchObject({
      extra: { slug: 'sushumna-locales', locale: 'pt-br' },
    })
  })

  it('still warns on every render, so the request log keeps the full record', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const page = { slug: 'gallery', content: content(gallery([image(1), 9102])) }

    reportDroppedImages(page, 'en')
    reportDroppedImages(page, 'en')

    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('reports a gap it has not seen before', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    reportDroppedImages({ slug: 'a', content: content(upload(9103)) }, 'en')
    reportDroppedImages({ slug: 'a', content: content(upload(9104)) }, 'en')

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
  })

  it('stays silent for a page that drops nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    reportDroppedImages({ slug: 'b', content: content(upload(image(1))) }, 'en')

    expect(warn).not.toHaveBeenCalled()
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })
})
