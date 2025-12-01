import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { Meditation, WeMeditateWebSettings } from '../../../server/graphql-types'
import { getMeditationById, getWeMeditateWebSettings } from '../../../server/graphql-client'

export interface MeditationEmbedPageData {
  meditation: Meditation
  settings: WeMeditateWebSettings
  locale: string
  id: string
}

/**
 * Fetch meditation data for embed route
 * This route is designed for embedding in iframes
 */
export async function data(pageContext: PageContextServer): Promise<MeditationEmbedPageData> {
  const {
    cloudflare,
    locale,
    routeParams: { id },
  } = pageContext

  // Access Cloudflare KV namespace for caching
  const kv = cloudflare?.env?.WEMEDITATE_CACHE

  const apiKey = import.meta.env.PAYLOAD_API_KEY
  const endpoint = import.meta.env.PUBLIC__SAHAJCLOUD_URL + '/api/graphql'

  // Fetch global settings (cached 24 hours)
  const settings = await getWeMeditateWebSettings({
    apiKey,
    endpoint,
    kv,
  })

  // Fetch meditation by ID (cached 1 hour)
  const meditation = await getMeditationById({
    id,
    locale,
    apiKey,
    endpoint,
    kv,
  })

  if (!meditation) {
    // Meditation not found - throw 404
    throw render(404, `Meditation with ID "${id}" not found.`)
  }

  return {
    meditation,
    settings,
    locale,
    id,
  }
}
