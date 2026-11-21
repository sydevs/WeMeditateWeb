import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement, ReactNode } from 'react'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { blockConverters } from './blockConverters'
import { MusicLibrary, type MusicFilter } from '../MusicLibrary'
import type { Track } from '../../molecules'
import { anchorFor, classFor, classesWith } from '../../../tests/_helpers/markup'

// vike-react's ClientOnly reads pageContext, which throws outside a Vike app.
// Its fallback is what the server sends, which is what these assert.
vi.mock('vike-react/ClientOnly', () => ({
  ClientOnly: ({ fallback }: { fallback?: ReactNode }) => fallback ?? null,
}))

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

  it('wisdomStyle (side layout) → OrnateTextBox (ornate ground, no sidetext)', () => {
    const html = renderTextbox({ imagePosition: 'left', wisdomStyle: true, title: 'Wisdom' })

    expect(html).toContain('#6b5340') // warm ornate gradient ground
    expect(html).not.toContain('[writing-mode:vertical-rl]') // the block carries no label
    expect(html).not.toContain('lg:bg-white') // not the plain ContentTextBox
  })

  it('threads imagePosition into the ornate treatment as the image side', () => {
    const html = renderTextbox({ imagePosition: 'right', wisdomStyle: true, title: 'Wisdom' })

    expect(html).toContain('#6b5340') // still the ornate branch
    // The image side is the grid's column pair, which mirrors with `align`.
    expect(classFor(html, 'lg:pr-24').split(' ')).toContain('lg:grid-cols-[1fr_44%]')
    expect(classFor(html, 'lg:pr-24').split(' ')).not.toContain('lg:grid-cols-[44%_1fr]')
  })

  it('overlay takes precedence over wisdomStyle (no ornate ground)', () => {
    const html = renderTextbox({ imagePosition: 'overlay', wisdomStyle: true, title: 'Wisdom' })

    expect(html).not.toContain('#6b5340')
  })

  it('renders nothing when the image is an unpopulated (bare-id) relationship', () => {
    expect(textbox({ node: { fields: { image: 123, title: 'Orphan' } } })).toBeNull()
  })
})

describe('textbox block converter — paragraph breaks', () => {
  // One treatment for every style an editor can pick (#286).
  const STYLES = [
    ['the white box', { imagePosition: 'left' }],
    ['the ornate box', { imagePosition: 'left', wisdomStyle: true }],
    ['the overlay', { imagePosition: 'overlay' }],
  ] as const

  it.each(STYLES)('%s renders each paragraph of the text as its own <p>', (_, style) => {
    for (const text of [
      'First paragraph.\n\nSecond paragraph.',
      'First paragraph.\nSecond paragraph.',
    ]) {
      const html = renderTextbox({ ...style, title: 'Hi', text })

      expect(html).toContain('First paragraph.</p>')
      expect(html).toContain('>Second paragraph.</p>')
    }
  })

  it.each(STYLES)('%s renders single-paragraph text in one <p>', (_, style) => {
    const html = renderTextbox({ ...style, title: 'Hi', text: 'Only one paragraph here.' })

    expect(html).toContain('>Only one paragraph here.</p>')
  })
})

// Every block defined for `pages.content` upstream. Adding a block in SahajCloud
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
          // The label is the SongTag's SahajCloud `title`, localized, not the
          // slug title-cased.
          tags: [{ id: 'vocals', label: 'Vocals' }],
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

// The splash converter reads its position in the tree too. `childIndex: i` and
// `parent: data.root` are what `convertLexicalNodesToJSX` really dispatches.
type SplashConverter = (args: {
  childIndex: number
  node: { fields: Record<string, unknown> }
  parent?: { type: string }
}) => ReactElement | null

const splash = blockConverters.splash as unknown as SplashConverter

/** `IMG` is a populated upload ref, which is all `populatedImage` requires. */
function renderSplash(childIndex: number, parentType = 'root'): string {
  return renderToStaticMarkup(
    splash({
      childIndex,
      node: { fields: { blockType: 'splash', images: [IMG], title: 'Inner Peace' } },
      parent: { type: parentType },
    }),
  )
}

describe('splash block converter — LCP priority', () => {
  it('paints the background as an <img>, never a CSS background', () => {
    const html = renderSplash(0)

    expect(html).toContain(`src="${IMG.url}"`)
    expect(html).not.toContain('background-image')
  })

  it('the lead splash loads eagerly at high priority', () => {
    const html = renderSplash(0)

    expect(html).toContain('loading="eager"')
    // React serializes the DOM property, so the attribute keeps its capital P.
    expect(html).toContain('fetchPriority="high"')
  })

  it('the lead splash gets React’s hoisted image preload', () => {
    const html = renderSplash(0)

    expect(html).toContain('rel="preload"')
    expect(html).toContain('as="image"')
  })

  it('a splash below the lead block stays lazy and unprioritised', () => {
    const html = renderSplash(1)

    expect(html).toContain('loading="lazy"')
    expect(html).not.toContain('fetchPriority')
    expect(html).not.toContain('rel="preload"')
  })

  it('a first-child splash nested under a non-root parent is not the lead', () => {
    const html = renderSplash(0, 'block')

    expect(html).toContain('loading="lazy"')
    expect(html).not.toContain('fetchPriority')
  })
})

describe('splash block converter — loader', () => {
  it('covers the lead splash with the loader', () => {
    expect(classesWith(renderSplash(0), 'animate-splash-loader-exit')).toHaveLength(1)
  })

  it('leaves every other splash uncovered', () => {
    expect(renderSplash(1)).toContain('Inner Peace')
    expect(classesWith(renderSplash(1), 'animate-splash-loader-exit')).toEqual([])
    expect(classesWith(renderSplash(0, 'block'), 'animate-splash-loader-exit')).toEqual([])
  })
})

describe('splash block converter — map-search', () => {
  /** A block switched to map-search keeps the fields SahajCloud now hides. */
  const mapSearch = (fields: Record<string, unknown>) =>
    renderToStaticMarkup(
      splash({
        childIndex: 0,
        node: {
          fields: {
            blockType: 'splash',
            layout: 'map-search',
            images: [IMG],
            title: 'Stale title',
            subtitle: 'Stale subtitle',
            actionURL: '/stale',
            ...fields,
          },
        },
        parent: { type: 'root' },
      }),
    )

  it('sends a visitor without JavaScript to the class map, in the editor’s words', () => {
    const html = mapSearch({ actionText: 'Find a class near you' })
    const link = anchorFor(html, '/map')

    expect(link).not.toBe('')
    expect(html.slice(html.indexOf(link))).toContain('Find a class near you')
  })

  it('draws none of the fields SahajCloud hides for the layout', () => {
    const html = mapSearch({ actionText: 'Find a class near you' })

    expect(html).toContain('Find a class near you')
    expect(html).not.toContain('Stale title')
    expect(html).not.toContain('<h1')
    expect(html).not.toContain('Stale subtitle')
    expect(anchorFor(html, '/stale')).toBe('')
  })

  it('offers no link it has no words for', () => {
    const html = mapSearch({ actionText: '  ' })

    expect(html).toContain(`src="${IMG.url}"`)
    expect(anchorFor(html, '/map')).toBe('')
  })

  it('leaves the default layout’s hero as it was', () => {
    const html = mapSearch({ layout: 'default', actionText: 'Begin' })

    expect(html).toContain('Stale title')
    expect(anchorFor(html, '/stale')).not.toBe('')
    expect(anchorFor(html, '/map')).toBe('')
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
