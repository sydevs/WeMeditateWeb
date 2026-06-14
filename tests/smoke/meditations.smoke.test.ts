/**
 * Smoke specs for the meditation routes against the deployed Cloudflare preview.
 *
 * Targets a real meditation id — discovered from the production CMS when the
 * SAHAJCLOUD_API_KEY secret is set, otherwise crawled from the homepage links.
 * Skips cleanly when no id is discoverable (e.g. forked PR without the secret
 * and no meditation linked from home) rather than failing.
 *
 * Note: this only verifies the server *renders* the page. Audio/video playback
 * is client-side and out of scope for fetch smoke (see issue comments on #26).
 */
import { describe, it } from 'vitest'
import { fetchPage, expectRenders, internalLinks, discoverFromCms } from './_helpers/preview'

async function discoverMeditationId(): Promise<string | null> {
  const cms = await discoverFromCms()

  if (cms?.meditationId) return cms.meditationId

  const home = await fetchPage('/')

  for (const link of internalLinks(home.html)) {
    const id = link.match(/^\/(?:meditations|m)\/([^/]+)$/)?.[1]

    if (id) return id
  }

  return null
}

describe('preview meditations', () => {
  it('renders the full meditation page and the minimal embed', async (ctx) => {
    const id = await discoverMeditationId()

    ctx.skip(
      !id,
      'no discoverable meditation; set the SAHAJCLOUD_API_KEY secret for deterministic discovery',
    )

    const full = await fetchPage(`/meditations/${id}`)

    expectRenders(full, `/meditations/${id}`)

    const embed = await fetchPage(`/m/${id}`)

    expectRenders(embed, `/m/${id}`)
  })
})
