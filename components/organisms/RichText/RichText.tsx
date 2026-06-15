import type { ComponentProps, ReactNode } from 'react'
import {
  RichText as LexicalRichText,
  defaultJSXConverters,
} from '@payloadcms/richtext-lexical/react'
import type { JSXConverters } from '@payloadcms/richtext-lexical/react'
import { Image, Link } from '../../atoms'
import { cmsHref, type RelationValue } from '../../../lib/cms-routes'
import { isPopulated } from '../../../lib/cms-relationships'
import { nearestAspectRatio } from '../../../lib/cloudflare-images'
import { getNodeText, relationshipLabel, slugify, uploadFigureClass } from './lexical-helpers'

/** The serialized-editor-state shape the underlying converter expects. */
type LexicalEditorState = ComponentProps<typeof LexicalRichText>['data']

/** Populated upload/image document fields the upload converter reads. */
interface PopulatedImage {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

/** Sizes hint: article body images are at most the prose column width. */
const ARTICLE_IMAGE_SIZES = '(max-width: 768px) 100vw, 768px'

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

  // Headings get a slugified anchor id so a table of contents can link to them.
  heading: ({ node, nodesToJSX }) => {
    const Tag =
      typeof node.tag === 'string' && /^h[2-6]$/.test(node.tag)
        ? (node.tag as 'h2' | 'h3' | 'h4' | 'h5' | 'h6')
        : 'h2'
    const id = slugify(getNodeText(node.children))

    return <Tag id={id || undefined}>{nodesToJSX({ nodes: node.children })}</Tag>
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

    return (
      <figure className={uploadFigureClass(fields?.align)}>
        <Image
          alt={fields?.alt ?? image.alt ?? ''}
          aspectRatio={nearestAspectRatio(image.width, image.height)}
          height={image.height ?? undefined}
          rounded="rounded"
          sizes={ARTICLE_IMAGE_SIZES}
          src={image.url}
          width={image.width ?? undefined}
        />
        {caption ? <figcaption className="mt-2 text-sm text-gray-500">{caption}</figcaption> : null}
      </figure>
    )
  },

  // Generic fallback for any node without a converter — most importantly the
  // custom Page blocks implemented in a later ticket. Renders nothing so an
  // unimplemented block degrades gracefully instead of crashing the page.
  unknown: () => null,
}

export interface RichTextProps {
  /** PayloadCMS Lexical serialized editor state (e.g. `page.content`). */
  content?: { root?: unknown } | null
  /** Override the wrapper class (defaults to Tailwind Typography `prose`). */
  className?: string
}

/**
 * Renders PayloadCMS Lexical rich-text content as React.
 *
 * Wraps `@payloadcms/richtext-lexical/react`'s converter (imported only via the
 * `/react` subpath, which is render-only and Workers-safe) with app-specific
 * overrides for headings, links, relationships and uploads.
 */
export function RichText({ content, className }: RichTextProps) {
  if (!content || !content.root) {
    return null
  }

  return (
    <LexicalRichText
      className={className ?? 'prose prose-lg max-w-none'}
      converters={CONVERTERS}
      data={content as unknown as LexicalEditorState}
    />
  )
}
