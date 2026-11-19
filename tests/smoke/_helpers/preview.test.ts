/**
 * Unit coverage for the smoke helpers that parse a preview response.
 *
 * This file is deliberately not a `*.smoke.test.ts`: it touches no network
 * and runs in the normal `pnpm test:run` lane, so a helper that stops
 * detecting error pages fails before CI reaches a deployed preview.
 */
import { describe, it, expect } from 'vitest'
import { ERROR_MARKERS, linkAttrs, renderedHtml } from './preview'

/** A healthy page: real content, plus the translations payload Vike embeds. */
const payloadPage = `<!DOCTYPE html><html><head><title>Home Page</title></head><body>
<h1>Meditate for Better Mental Health</h1>
<script id="vike_pageContext" type="application/json">{"translations":{"errors":{"general":{"server_title":"${ERROR_MARKERS[0]}","not_found_title":"${ERROR_MARKERS[1]}"}}}}</script>
</body></html>`

describe('renderedHtml', () => {
  it('drops the embedded pageContext payload that carries every error title', () => {
    const rendered = renderedHtml(payloadPage)

    for (const marker of ERROR_MARKERS) {
      expect(rendered, `"${marker}" is payload text here, not rendered text`).not.toContain(marker)
    }
    expect(rendered, 'real page content survives').toContain('Meditate for Better Mental Health')
  })

  it('keeps an error title the document actually renders', () => {
    const errorPage = `<html><body><h1>${ERROR_MARKERS[1]}</h1><script>var x = 1</script></body></html>`

    expect(renderedHtml(errorPage)).toContain(ERROR_MARKERS[1])
  })

  it('drops every script, not only the first', () => {
    const two = '<script>a</script><p>keep</p><script type="module">b</script>'

    expect(renderedHtml(two)).toBe('<p>keep</p>')
  })
})

describe('ERROR_MARKERS', () => {
  it('is a non-empty set of non-empty strings', () => {
    // A marker list that resolved to key paths or empty strings would make
    // every "no error page" assertion pass on a completely broken preview.
    expect(ERROR_MARKERS.length).toBeGreaterThan(0)

    for (const marker of ERROR_MARKERS) {
      expect(marker.length, 'a marker must be real copy').toBeGreaterThan(0)
      expect(marker, 'a marker must not be an unresolved key path').not.toMatch(/^errors\./)
    }
  })
})

describe('linkAttrs', () => {
  // The two spellings this repo has served: the React head wrote `href`
  // first and closed the tag, Unhead writes `rel` first and leaves it bare.
  const head = `<head>
<link href="https://x.test/a" rel="canonical"/>
<link rel="alternate" hreflang="x-default" href="https://x.test/a">
<link rel="alternate" type="application/json+oembed" href="https://x.test/oembed">
<link rel="stylesheet" href="/a.css">
</head>`

  it('reads a tag whichever order its attributes come in', () => {
    expect(linkAttrs(head, 'canonical').map((link) => link.href)).toEqual(['https://x.test/a'])
  })

  it('keeps every attribute, so a cluster member is identifiable', () => {
    const cluster = linkAttrs(head, 'alternate').filter((link) => link.hreflang)

    expect(cluster).toEqual([{ rel: 'alternate', hreflang: 'x-default', href: 'https://x.test/a' }])
  })

  it('answers nothing for a rel the page does not carry', () => {
    // `not.toContain` passes on an empty list, so a spec asserting an absence
    // needs this to be the real answer rather than a parse failure.
    expect(linkAttrs(head, 'preconnect')).toEqual([])
  })
})
