import {
  cloneElement,
  Fragment,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'
import {
  RichText as LexicalRichText,
  defaultJSXConverters,
} from '@payloadcms/richtext-lexical/react'
import type { JSXConverter, JSXConverters } from '@payloadcms/richtext-lexical/react'
import { Blockquote, Container, Image, Link } from '../../atoms'
import { Alert } from '../../molecules/Alert'
import { LightboxProvider } from '../../molecules/Lightbox/LightboxProvider'
import { cmsHref, type RelationValue } from '../../../lib/cms-routes'
import { isPopulated } from '../../../lib/cms-relationships'
import { nearestAspectRatio } from '../../../lib/cloudflare-images'
import { getNodeText, relationshipLabel, slugify, uploadFigureClass } from './lexical-helpers'
import { blockConverters, type BlockConverters } from './blockConverters'

/** The serialized-editor-state shape the underlying converter expects. */
type LexicalEditorState = ComponentProps<typeof LexicalRichText>['data']

/** Populated upload/image document fields the upload converter reads. */
interface PopulatedImage {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

/** Sizes hint: article body images are at most the article column width. */
const ARTICLE_IMAGE_SIZES = '(max-width: 768px) 100vw, 768px'

/**
 * Article layout + base typography for the rendered content.
 *
 * Uses normal block flow (not flex) so blockquotes can `float` beside the body
 * text; vertical rhythm comes from margins (which collapse) rather than a flex
 * gap. Standard nodes — headings, paragraphs and lists — are styled with
 * child-combinator utilities scoped to direct children (`[&>h2]`, `[&>p]`, …) so
 * the styling never leaks into the self-styled custom blocks. The project
 * removed its `Text` atom as overengineered, so this standardises typography
 * with Tailwind directly rather than a wrapper.
 */
const ARTICLE_CLASS = [
  // Headings (h1 is downgraded to h2 by the converter to avoid colliding with the page title)
  '[&>h2]:text-3xl [&>h3]:text-2xl [&>h4]:text-xl [&>h5]:text-lg [&>h6]:text-base',
  '[&>h2]:font-semibold [&>h3]:font-semibold [&>h4]:font-semibold [&>h5]:font-semibold [&>h6]:font-semibold',
  '[&>h2]:text-gray-800 [&>h3]:text-gray-800 [&>h4]:text-gray-800 [&>h5]:text-gray-800 [&>h6]:text-gray-800',
  // Generous top margin so headings clearly introduce their section
  '[&>h2]:mt-12 [&>h3]:mt-10 [&>h4]:mt-8 [&>h5]:mt-6 [&>h6]:mt-6',
  // Body text
  '[&>p]:my-4 [&>p]:text-lg [&>p]:font-light [&>p]:leading-relaxed [&>p]:text-gray-700',
  // Lists
  '[&>ul]:my-4 [&>ol]:my-4 [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:pl-6 [&>ol]:pl-6',
  '[&>ul]:text-lg [&>ol]:text-lg [&>ul]:font-light [&>ol]:font-light [&>ul]:text-gray-700 [&>ol]:text-gray-700',
].join(' ')

/**
 * Render an upload image caption. SahajCloud captions may be plain strings or a
 * nested Lexical document; anything else degrades to nothing.
 */
function renderCaption(caption: unknown): ReactNode {
  if (!caption) {
    return null
  }
  if (typeof caption === 'string') {
    return caption
  }
  if (isPopulated(caption) && 'root' in caption) {
    // Captions rarely contain links/blocks, so the library defaults are enough.
    return <LexicalRichText disableContainer data={caption as unknown as LexicalEditorState} />
  }

  return null
}

/**
 * Converter overrides layered on top of the library defaults. Defaults handle
 * paragraphs, text formatting, lists, blockquotes and line breaks; we override
 * the nodes that need app-specific behavior (anchored headings, locale-aware
 * links, Cloudflare-optimized images) and add a generic fallback so unknown
 * custom blocks (implemented in a later ticket) never crash the page.
 *
 * Built once at module scope (rather than via a per-render factory) since the
 * overrides don't depend on render state.
 */
const CONVERTERS: JSXConverters = {
  ...defaultJSXConverters,

  // Custom Page blocks (textbox, quote, showcase, …), keyed by `blockType`.
  // Any block without an entry here falls through to the `unknown` converter.
  blocks: blockConverters,

  // Headings get a slugified anchor id so a table of contents can link to them.
  heading: ({ node, nodesToJSX }) => {
    const Tag =
      typeof node.tag === 'string' && /^h[2-6]$/.test(node.tag)
        ? (node.tag as 'h2' | 'h3' | 'h4' | 'h5' | 'h6')
        : 'h2'
    const id = slugify(getNodeText(node.children))

    return <Tag id={id || undefined}>{nodesToJSX({ nodes: node.children })}</Tag>
  },

  // Lexical blockquotes (distinct from the `quote` custom block → HeroQuote)
  // render through the Blockquote atom, which floats to match the node's
  // alignment. The atom takes plain text, so inline formatting inside a
  // blockquote is flattened (rare in practice).
  quote: ({ node }) => {
    const format = (node as { format?: string }).format
    const align = format === 'left' || format === 'start' ? 'left' : 'right'

    return <Blockquote align={align} text={getNodeText(node.children)} />
  },

  // Render links through the locale-aware Link atom. Internal links resolve via
  // the single source-of-truth route mapper; unresolvable refs degrade to plain
  // text rather than a dead /undefined link.
  link: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    const fields = node.fields

    if (fields?.linkType === 'internal' && fields.doc) {
      const href = cmsHref(fields.doc.relationTo ?? '', fields.doc.value as RelationValue)

      return href ? <Link href={href}>{children}</Link> : <>{children}</>
    }
    const url = fields?.url

    return url ? (
      <Link external={Boolean(fields?.newTab)} href={url}>
        {children}
      </Link>
    ) : (
      <>{children}</>
    )
  },

  // Autolinks are always external URLs auto-detected by the editor.
  autolink: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    const url = node.fields?.url

    return url ? (
      <Link external={Boolean(node.fields?.newTab)} href={url}>
        {children}
      </Link>
    ) : (
      <>{children}</>
    )
  },

  // Inline relationship nodes link to the referenced document via the mapper.
  relationship: ({ node }) => {
    const label = relationshipLabel(node.value)

    if (!label) {
      return null
    }
    const href = cmsHref(node.relationTo ?? '', node.value as RelationValue)

    return href ? <Link href={href}>{label}</Link> : <>{label}</>
  },

  // Upload images render through the Cloudflare-aware Image atom inside a
  // <figure>, honoring the CMS caption + alignment fields.
  upload: ({ node }) => {
    const value = node.value

    if (!isPopulated(value)) {
      return null
    }
    const image = value as PopulatedImage

    if (!image.url) {
      return null
    }
    const fields = node.fields as
      | { caption?: unknown; align?: string | null; alt?: string | null }
      | undefined
    const caption = renderCaption(fields?.caption)
    // `wide` images break out to the full content width: no rounding (they meet the
    // edges) and a full-width `sizes` hint so the browser fetches a large variant.
    const isWide = fields?.align === 'wide'

    return (
      <figure className={uploadFigureClass(fields?.align)}>
        <Image
          alt={fields?.alt ?? image.alt ?? ''}
          aspectRatio={nearestAspectRatio(image.width, image.height)}
          height={image.height ?? undefined}
          lightboxGroup={`upload-${image.url}`}
          rounded={isWide ? 'none' : 'rounded'}
          sizes={isWide ? '100vw' : ARTICLE_IMAGE_SIZES}
          src={image.url}
          width={image.width ?? undefined}
        />
        {caption ? <figcaption className="mt-2 text-sm text-gray-500">{caption}</figcaption> : null}
      </figure>
    )
  },

  // Generic fallback for any node without a converter — e.g. a future custom
  // Page block not yet in `blockConverters`. In development we surface what's
  // missing with an Alert; in production we render nothing so an unimplemented
  // block degrades gracefully instead of showing end users a warning box.
  unknown: ({ node }) => {
    if (!import.meta.env.DEV) {
      return null
    }
    const n = node as { type?: string; fields?: { blockType?: unknown } }
    const label =
      n.type === 'block' && typeof n.fields?.blockType === 'string'
        ? `block: ${n.fields.blockType}`
        : (n.type ?? 'unknown')

    return (
      <Alert title="Unimplemented RichText node" variant="warning">
        No converter for <code>{label}</code> — implement it or check the CMS content.
      </Alert>
    )
  },
}

/** The callable form of a block converter (its args carry the block `node`). */
type BlockConverterFn = Extract<JSXConverter, (args: never) => unknown>

/**
 * Wrap a converter so its rendered block gets a small "?" button in the
 * top-right corner; clicking it logs the complete node to the console. The white
 * drop-shadow keeps the marker legible over dark block imagery. Used only when
 * `debug` is enabled (built per-render, never in production unless opted in).
 */
function withDebugOverlay(label: string, render: BlockConverterFn): BlockConverterFn {
  // eslint-disable-next-line react/display-name -- a Lexical converter, not a React component
  return (args) => {
    const logNode = () => {
      // eslint-disable-next-line no-console -- the debug overlay's purpose is to log block data
      console.log(`[RichText] ${label} block`, args.node)
    }
    const button = (
      <button
        key="debug"
        aria-label={`Log ${label} block data`}
        className="absolute top-1 right-1 z-20 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-gray-800/70 text-xs font-bold text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.9)]"
        type="button"
        onClick={logNode}
      >
        ?
      </button>
    )
    const rendered = render(args)

    // A floated block (the aligned image <figure>) must stay in normal flow so
    // text wraps around it — inject the button into the element itself rather
    // than a wrapper that would contain the float.
    if (isValidElement(rendered) && rendered.type === 'figure') {
      const figure = rendered as ReactElement<{ className?: string; children?: ReactNode }>

      return cloneElement(figure, { className: `${figure.props.className ?? ''} relative` }, [
        <Fragment key="content">{figure.props.children}</Fragment>,
        button,
      ])
    }

    return (
      <div className="relative">
        {rendered}
        {button}
      </div>
    )
  }
}

/** Apply the debug overlay to every custom block converter. */
function withDebugBlocks(converters: BlockConverters): BlockConverters {
  const debugged: Record<string, BlockConverterFn> = {}

  for (const [blockType, converter] of Object.entries(converters)) {
    if (typeof converter !== 'function') {
      continue
    }
    debugged[blockType] = withDebugOverlay(blockType, converter as unknown as BlockConverterFn)
  }

  return debugged as unknown as BlockConverters
}

export interface RichTextProps {
  /** PayloadCMS Lexical serialized editor state (e.g. `page.content`). */
  content?: { root?: unknown } | null
  /** Override the wrapper class (defaults to {@link ARTICLE_CLASS}: flex `gap-3`
   * block spacing + base typography). */
  className?: string
  /**
   * Overlay each block with a top-right "?" that logs the block's node data to
   * the console on click. For development/inspection only.
   * @default false
   */
  debug?: boolean
}

/**
 * Renders PayloadCMS Lexical rich-text content as React.
 *
 * Wraps `@payloadcms/richtext-lexical/react`'s converter (imported only via the
 * `/react` subpath, which is render-only and Workers-safe) with app-specific
 * overrides for headings, links, relationships and uploads.
 */
export function RichText({ content, className, debug = false }: RichTextProps) {
  if (!content || !content.root) {
    return null
  }
  // The static CONVERTERS are reused as-is unless debug overlays are requested.
  // Debug also covers the upload (image) node, which isn't a custom block.
  const converters: JSXConverters = debug
    ? ({
        ...CONVERTERS,
        blocks: withDebugBlocks(blockConverters),
        upload: withDebugOverlay('image', CONVERTERS.upload as unknown as BlockConverterFn),
      } as JSXConverters)
    : CONVERTERS

  // One provider per document: every gallery/upload image below shares a single
  // client-only lightbox overlay (the provider renders no DOM until one opens).
  //
  // The Container constrains non-full-bleed content to a readable column
  // (max-w-4xl) with responsive gutters — owned here so it's consistent whether
  // RichText is rendered inside a page template or standalone (e.g. a story).
  // Full-bleed blocks (Splash, OrnateTextBox, SubtleSystem, ContentOverlay, wide
  // uploads) escape it via the `full-bleed` cqi break-out, which resolves against
  // the `@container` on <main> (the window) regardless of this Container.
  return (
    <LightboxProvider>
      <Container maxWidth="prose">
        <LexicalRichText
          className={className ?? ARTICLE_CLASS}
          converters={converters}
          data={content as unknown as LexicalEditorState}
        />
      </Container>
    </LightboxProvider>
  )
}
