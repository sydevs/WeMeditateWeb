/**
 * Unit coverage for the smoke helpers that parse a preview response.
 *
 * This file is deliberately not a `*.smoke.test.ts`: it touches no network
 * and runs in the normal `pnpm test:run` lane, so a helper that stops
 * detecting error pages fails before CI reaches a deployed preview.
 */
import { describe, it, expect } from 'vitest'
import { ERROR_MARKERS, renderedHtml } from './preview'

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
