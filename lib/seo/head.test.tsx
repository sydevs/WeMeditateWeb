import { readFile } from 'node:fs/promises'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { isSafeJsonLd, NoIndexHead } from './head'
import { seoDocument } from './head-settings'

describe('isSafeJsonLd', () => {
  it('accepts a properly escaped document', () => {
    expect(isSafeJsonLd('{"name":"\\u003c/script\\u003e"}')).toBe(true)
  })

  it.each([
    ['</script>', '{"a":"</script>"}'],
    ['</SCRIPT> in any case', '{"a":"</SCRIPT >"}'],
    ['a comment opener', '{"a":"<!--"}'],
    ['an empty string', ''],
    ['nothing at all', undefined],
  ])('refuses %s', (_label, value) => {
    expect(isSafeJsonLd(value)).toBe(false)
  })
})

describe('seoDocument', () => {
  it('answers null for a route that built none', () => {
    // Every embed route and the error page. They publish no URL claim, and
    // the head settings then fall back to the site's own name.
    expect(seoDocument(undefined)).toBeNull()
    expect(seoDocument({})).toBeNull()
  })
})

describe('NoIndexHead', () => {
  it('refuses the embed routes, which robots.txt must keep fetchable', () => {
    expect(renderToStaticMarkup(<NoIndexHead />)).toBe('<meta content="noindex" name="robots"/>')
  })
})

/**
 * Neither block the `class-directory` feature added may reach for the head.
 *
 * `atlasSeo` is for a host that owns its route: it publishes the atlas's own
 * canonical at `/map`, which is wrong for a page that merely carries the
 * widget. `useConfig` is vike-react's own head setting, and a content route
 * publishes through `+data.ts` instead (`lib/seo/content-seo.ts`).
 */
describe('the class-directory blocks', () => {
  it('import no head helper', async () => {
    const blocks = [
      '../../components/organisms/ClassDirectory/ClassDirectory.tsx',
      '../../components/molecules/LiveSession/LiveSession.tsx',
    ]

    for (const block of blocks) {
      const source = await readFile(new URL(block, import.meta.url), 'utf8')
      const imports = source.match(/^import .*$/gm)?.join('\n') ?? ''

      expect(imports.length).toBeGreaterThan(0)
      expect(imports).not.toMatch(/atlas\/seo|useConfig/)
    }
  })
})
