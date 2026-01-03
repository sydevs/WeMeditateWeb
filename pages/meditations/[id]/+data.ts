import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { Meditation, WeMeditateWebSettings } from '../../../server/cms-types'
import { getMeditationById, getWeMeditateWebSettings } from '../../../server/cms-client'

export interface MeditationPageData {
  meditation: Meditation
  settings: WeMeditateWebSettings
  locale: string
  id: string
}

/**
 * Fetch meditation data by ID for server-side rendering
 */
export async function data(pageContext: PageContextServer): Promise<MeditationPageData> {
  const {
    cloudflare,
    locale,
    routeParams: { id },
  } = pageContext

  // Access Cloudflare KV namespace for caching
  const kv = cloudflare?.env?.WEMEDITATE_CACHE

  const apiKey = import.meta.env.SAHAJCLOUD_API_KEY
  const baseURL = import.meta.env.PUBLIC__SAHAJCLOUD_URL

  // Fetch global settings (cached 24 hours)
  const settings = await getWeMeditateWebSettings({
    apiKey,
    baseURL,
    kv,
  })

  // Fetch meditation by ID (cached 1 hour)
  const meditation = await getMeditationById({
    id,
    locale,
    apiKey,
    baseURL,
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
