/**
 * Smoke specs for the meditation routes, against the deployed Cloudflare
 * preview.
 *
 * Targets a real meditation id. This is discovered from the production
 * CMS when the SAHAJCLOUD_API_KEY secret is set, otherwise crawled from
 * the homepage links. Skips cleanly when no id is discoverable (for
 * example, a forked PR without the secret and no meditation linked from
 * home), instead of failing.
 *
 * Note: this only verifies that the server renders the page. Audio and
 * video playback are client-side, and out of scope for fetch smoke (see
 * issue comments on #26).
 */
import { describe, it } from 'vitest'
import {
  fetchPage,
  expectRenders,
  expectChrome,
  expectNoChrome,
  internalLinks,
  discoverFromCms,
} from '../_helpers/preview'

async function discoverMeditationId(): Promise<string | null> {
  const cms = await discoverFromCms()

  if (cms?.meditationId) return cms.meditationId

  const home = await fetchPage('/')

  for (const link of internalLinks(home.html)) {
    const id = link.match(/^\/meditations\/([^/]+)$/)?.[1]

    if (id) return id
  }

  return null
}

describe('preview meditations', () => {
  it('renders the full meditation page (with chrome) and the bare embed', async (ctx) => {
    const id = await discoverMeditationId()

    ctx.skip(
      !id,
      'no discoverable meditation; set the SAHAJCLOUD_API_KEY secret for deterministic discovery',
    )

    const full = await fetchPage(`/meditations/${id}`)

    expectRenders(full, `/meditations/${id}`)
    expectChrome(full, `/meditations/${id}`)

    const embed = await fetchPage(`/meditations/${id}/embed`)

    expectRenders(embed, `/meditations/${id}/embed`)
    expectNoChrome(embed, `/meditations/${id}/embed`)
  })
})
