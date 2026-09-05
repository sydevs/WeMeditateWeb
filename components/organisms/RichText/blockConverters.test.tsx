import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { blockConverters } from './blockConverters'
import { MusicLibrary, type MusicFilter } from '../MusicLibrary'
import type { Track } from '../../molecules'

// The converter only reads `node.fields`; the other JSXConverter args are
// unused, so narrow to the minimal callable shape this test exercises.
type TextboxConverter = (args: { node: { fields: Record<string, unknown> } }) => ReactElement | null

const textbox = blockConverters.textbox as unknown as TextboxConverter

const IMG = {
  url: 'https://picsum.photos/seed/x/900/1200',
  alt: 'Group class',
  width: 900,
  height: 1200,
}

/** Invoke the `textbox` converter with a minimal lexical node. */
function convertTextbox(fields: Record<string, unknown>) {
  return textbox({ node: { fields: { image: IMG, ...fields } } })
}

function renderTextbox(fields: Record<string, unknown>): string {
  return renderToStaticMarkup(convertTextbox(fields))
}

describe('textbox block converter — routing', () => {
  it('left/right → ContentTextBox (white box, not parchment or overlay)', () => {
    const html = renderTextbox({ imagePosition: 'left', title: 'Hi', subtitle: 'Sub' })

    expect(html).toContain('lg:bg-white')
    expect(html).not.toContain('bg-warm')
    expect(html).toContain('Sub') // subtitle threaded through
  })

  it('overlay → ContentOverlay, mapping textColor="light" to white text', () => {
    const html = renderTextbox({ imagePosition: 'overlay', textColor: 'light', title: 'Hi' })

    expect(html).toContain('text-white')
    expect(html).toContain('text-glow-dark')
    expect(html).not.toContain('bg-warm')
  })

  it('overlay with textColor="dark" renders dark text (no white)', () => {
    const html = renderTextbox({ imagePosition: 'overlay', textColor: 'dark', title: 'Hi' })

    expect(html).not.toContain('text-white')
  })

  it('threads the subtitle into the overlay', () => {
    const html = renderTextbox({
      imagePosition: 'overlay',
      title: 'Hi',
      subtitle: 'Collective meditation',
    })

    expect(html).toContain('Collective meditation')
  })

  it('wisdomStyle (side layout) → OrnateTextBox (ornate ground + sidetext)', () => {
    const html = renderTextbox({ imagePosition: 'left', wisdomStyle: true, title: 'Wisdom' })

    expect(html).toContain('#6b5340') // warm ornate gradient ground
    expect(html).toContain('Ancient Wisdom') // decorative sidetext
    expect(html).not.toContain('lg:bg-white') // not the plain ContentTextBox
  })

  it('overlay takes precedence over wisdomStyle (no ornate ground)', () => {
    const html = renderTextbox({ imagePosition: 'overlay', wisdomStyle: true, title: 'Wisdom' })

    expect(html).not.toContain('#6b5340')
  })

  it('renders nothing when the image is an unpopulated (bare-id) relationship', () => {
    expect(textbox({ node: { fields: { image: 123, title: 'Orphan' } } })).toBeNull()
  })
})

// Every block defined for `pages.content` upstream. Adding a block in the CMS
// without a converter here should fail this test rather than silently fall
// through to RichText's `unknown` fallback at runtime.
const KNOWN_BLOCK_TYPES = [
  'textbox',
  'quote',
  'button',
  'image-gallery',
  'layout',
  'table-of-contents',
  'showcase',
  'subtle-system',
  'splash',
  'content-index',
] as const

// The content-index converter reads `node.fields`; narrow to the callable shape.
type CIConverter = (args: { node: { fields: Record<string, unknown> } }) => ReactElement | null

const contentIndex = blockConverters['content-index'] as unknown as CIConverter

function convertCI(fields: Record<string, unknown>) {
  return contentIndex({ node: { fields: { blockType: 'content-index', ...fields } } })
}

const CARD = {
  id: 1,
  title: 'What Is Meditation?',
  href: '/what-is-meditation',
  thumbnailSrc: 'https://picsum.photos/seed/x/600/400',
}

describe('content-index block converter — dispatch', () => {
  it('pages → ContentIndex (filter pills + cards)', () => {
    const html = renderToStaticMarkup(
      convertCI({
        type: 'pages',
        resolvedItems: [{ ...CARD, tags: [{ id: 'wisdom', label: 'Wisdom' }] }],
      }),
    )

    expect(html).toContain('Filter content by tag')
    expect(html).toContain('>Wisdom<')
    expect(html).toContain('What Is Meditation?')
  })

  it('lectures → ContentIndex cards linking to /lectures/:id (no pills without facets)', () => {
    const html = renderToStaticMarkup(
      convertCI({
        type: 'lectures',
        resolvedItems: [{ ...CARD, id: 7, title: 'A Lecture', href: '/lectures/7' }],
      }),
    )

    expect(html).toContain('/lectures/7')
    expect(html).toContain('A Lecture')
    expect(html).not.toContain('Filter content by tag') // no facets → no pill row
  })

  it('meditations → ContentIndex with user-choice pills', () => {
    const html = renderToStaticMarkup(
      convertCI({
        type: 'meditations',
        resolvedItems: [
          {
            ...CARD,
            id: 5,
            title: 'Feel Calm',
            href: '/meditations/5',
            playButton: true,
            tags: [{ id: '25', label: '5 min' }],
          },
        ],
      }),
    )

    expect(html).toContain('Filter content by tag') // user-choices → filter pills
    expect(html).toContain('>5 min<')
    expect(html).toContain('/meditations/5')
  })

  it('songs → MusicLibrary with tracks + music-tag filters', () => {
    const el = convertCI({
      type: 'songs',
      resolvedTracks: [
        {
          url: 'https://cdn/a.mp3',
          title: 'Raga',
          credit: 'X',
          creditURL: '',
          thumbnailURL: '',
          duration: 0,
          tags: ['vocals'],
        },
      ],
    })

    // Inspect the element tree rather than rendering the whole MusicLibrary
    // and AudioPlayer subtree. This test only asserts the dispatch and filter derivation.
    const wrapper = el as ReactElement<{
      children: ReactElement<{ tracks: Track[]; filters: MusicFilter[] }>
    }>
    const library = wrapper.props.children

    expect(library.type).toBe(MusicLibrary)
    expect(library.props.tracks).toHaveLength(1)
    expect(library.props.filters.map((f) => ({ id: f.id, label: f.label }))).toEqual([
      { id: 'vocals', label: 'Vocals' },
    ])
    expect(library.props.filters[0].icon).toBe(MusicalNoteIcon)
  })

  it('renders nothing for empty / unresolved lists', () => {
    expect(convertCI({ type: 'pages', resolvedItems: [] })).toBeNull()
    expect(convertCI({ type: 'songs', resolvedTracks: [] })).toBeNull()
    expect(convertCI({ type: 'pages' })).toBeNull()
  })
})

describe('block coverage', () => {
  it.each(KNOWN_BLOCK_TYPES)('has a converter function for the %s block', (blockType) => {
    expect(typeof blockConverters[blockType]).toBe('function')
  })

  it('defines no converters beyond the known block types (spot stale keys)', () => {
    expect(Object.keys(blockConverters).sort()).toEqual([...KNOWN_BLOCK_TYPES].sort())
  })
})
