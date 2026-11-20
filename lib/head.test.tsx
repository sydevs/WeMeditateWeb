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
