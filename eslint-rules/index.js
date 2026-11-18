/**
 * The repo's own ESLint rules — a flat-config plugin, no package.
 *
 * Each rule here owns its id, and that is the whole reason the directory
 * exists. `no-restricted-syntax` is a single id shared with the untranslated-
 * copy selectors in `eslint.config.js`: a second block covering the same files
 * would replace those selectors instead of adding to them, and an
 * `eslint-disable no-restricted-syntax` region — the spelling AGENTS.md tells
 * an author to write for a site that cannot be translated yet — turns off every
 * selector in reach with it. `local/img-loading` is scoped and silenced on its
 * own (#152).
 *
 * Plain JS, because `eslint.config.js` loads this before any transpile.
 * `index.d.ts` beside it is what lets `index.test.ts` import it under
 * `tsc --noEmit`.
 */

/**
 * Does the tag spell `name` itself?
 *
 * ⚠ An attribute arriving through `{...props}` contributes no name, so a tag
 * whose spread carries the `src` is passed rather than reported: reporting it
 * would ask an author to annotate correct code.
 */
const spells = (node, name) =>
  node.attributes.some(
    (attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === name,
  )

/** The tag's own name, or `null` for a member expression such as `<Foo.Bar>`. */
const tagName = (node) => (node.name.type === 'JSXIdentifier' ? node.name.name : null)

/**
 * React 19 hoists a `<link rel="preload" as="image">` for every `<img>`
 * carrying a `src` **or a `srcSet`** unless it is `loading="lazy"`,
 * `fetchPriority="low"`, a `data:` URI, or inside a `<picture>` or
 * `<noscript>`. Both halves are measured against `react-dom@19.3.1`: a `srcSet`
 * with no `src` preloads too, which is the shape `VideoPlayer`'s fallback is
 * one attribute away from. So an author who omits the attribute preloads the
 * image whether or not the page wants it — the regression #142, #145 and #150
 * each fixed one site at a time, with nothing stopping the next one. The
 * `Image` atom decides this from its `priority` prop; a hand-rolled `<img>` has
 * nothing deciding it.
 *
 * An explicit `loading`, whatever its value, and no exemption list. Every raw
 * `<img>` here is either below the fold or a route's LCP image, so a list of
 * the eager ones would have to be edited whenever a hero moves, and a stale
 * entry asserts nothing. `loading="eager"` at the call site says the same thing
 * beside the code it describes.
 *
 * ⚠ It reads presence, not value, so `loading={loading}` handed `undefined`
 * passes here and preloads anyway — measured, and the trap `image-aspect-ratio`
 * below records for `sizes` as #206, where the answer was a type requirement
 * rather than a source rule.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const imgLoading = {
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (tagName(node) !== 'img') return
        if (!spells(node, 'src') && !spells(node, 'srcSet')) return
        if (spells(node, 'loading')) return

        context.report({ node: node.name, messageId: 'unsaid' })
      },
    }
  },
  meta: {
    docs: {
      description: 'require an explicit `loading` on a hand-rolled <img> React would preload',
    },
    messages: {
      unsaid:
        'This <img> preloads: name loading="lazy", or loading="eager" when the page wants the preload.',
    },
    schema: [],
    type: 'problem',
  },
}

/**
 * An `<Image>` with no `aspectRatio` resolves no Cloudflare variant, so the box
 * gets the full-size original. Fourteen call sites were missing it, a `sizes`,
 * or both (#146).
 *
 * `sizes` is a requirement of `ImageProps` instead, because a source rule reads
 * a prop's presence: a caller forwarding `sizes={sizes}` and handed `undefined`
 * passes it, and that was #206 exactly. The ratio stays a rule — it is optional
 * by design, for an `<Image>` whose src is not Cloudflare's, so no type can
 * demand it.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const imageAspectRatio = {
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (tagName(node) !== 'Image') return
        if (spells(node, 'aspectRatio')) return

        context.report({ node: node.name, messageId: 'unnamed' })
      },
    }
  },
  meta: {
    docs: { description: 'require an aspectRatio on every <Image>' },
    messages: {
      unnamed:
        '<Image> without aspectRatio serves the full-size original: name the ratio its box draws.',
    },
    schema: [],
    type: 'problem',
  },
}

export const rules = {
  'image-aspect-ratio': imageAspectRatio,
  'img-loading': imgLoading,
}
