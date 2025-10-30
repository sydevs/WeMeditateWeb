import { GraphQLClient } from 'graphql-request'
import type {
  Locale,
  Page,
  Meditation,
  Music,
  PageListItem,
  MeditationListItem,
  WeMeditateWebSettings,
} from './graphql-types'
import {
  buildQueryWithFragments,
} from './graphql-fragments'

/**
 * Creates a new GraphQL client instance for PayloadCMS.
 *
 * IMPORTANT: Always create a new client instance per request when using Cloudflare Workers.
 * This ensures proper I/O context isolation required by the Workers runtime.
 *
 * @param options - Configuration for the client
 * @param options.apiKey - PayloadCMS API key for authentication (required)
 * @param options.headers - Additional custom headers to include in requests
 * @param options.endpoint - GraphQL endpoint URL (defaults to env or localhost)
 * @returns A configured GraphQLClient instance
 *
 * @example
 * ```typescript
 * // In a +data.ts file with API key authentication
 * export async function data(pageContext) {
 *   const client = createGraphQLClient({
 *     apiKey: process.env.PAYLOAD_API_KEY!,
 *   })
 *
 *   const query = gql`
 *     query {
 *       Posts {
 *         docs {
 *           id
 *           title
 *           content
 *         }
 *       }
 *     }
 *   `
 *
 *   const result = await client.request(query)
 *   return result
 * }
 * ```
 */
export function createGraphQLClient(options: {
  apiKey: string
  headers?: Record<string, string>
  endpoint?: string
}) {
  const endpoint = options.endpoint ||
                   process.env.GRAPHQL_ENDPOINT ||
                   'http://localhost:3000/api/graphql'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add PayloadCMS API Key authentication
  // Format: "clients API-Key {your-api-key}"
  headers.Authorization = `clients API-Key ${options.apiKey}`

  return new GraphQLClient(endpoint, { headers })
}

/**
 * Type-safe helper for GraphQL client
 */
export type GraphQLClientType = ReturnType<typeof createGraphQLClient>

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Retrieves a specific page by slug and locale.
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.slug - The page slug to search for
 * @param options.locale - The locale to retrieve the page in
 * @param options.endpoint - Optional GraphQL endpoint URL
 * @returns The page data or null if not found
 *
 * @example
 * ```typescript
 * export async function data(pageContext) {
 *   const page = await getPageBySlug({
 *     apiKey: process.env.PAYLOAD_API_KEY!,
 *     slug: 'home',
 *     locale: 'en',
 *   })
 *
 *   if (!page) {
 *     throw new Error('Page not found')
 *   }
 *
 *   return { page }
 * }
 * ```
 */
export async function getPageBySlug(options: {
  apiKey: string
  slug: string
  locale: Locale
  endpoint?: string
}): Promise<Page | null> {
  const client = createGraphQLClient({
    apiKey: options.apiKey,
    endpoint: options.endpoint,
  })

  const fragments = buildQueryWithFragments(['fullPage'])

  const query = `
    ${fragments}

    query GetPageBySlug($slug: String!, $locale: LocaleInputType) {
      Pages(where: { slug: { equals: $slug } }, locale: $locale, limit: 1) {
        docs {
          ...FullPageFragment
        }
      }
    }
  `

  const variables = {
    slug: options.slug,
    locale: options.locale,
  }

  const result = await client.request<{ Pages: { docs: Page[] } }>(query, variables)
  return result.Pages?.docs?.[0] ?? null
}

/**
 * Retrieves the WeMeditateWebSettings configuration.
 *
 * This is a singleton global configuration that contains references to important
 * pages throughout the site (home page, featured pages, chakra pages, etc.).
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.endpoint - Optional GraphQL endpoint URL
 * @returns The web settings configuration
 *
 * @example
 * ```typescript
 * export async function data() {
 *   const settings = await getWeMeditateWebSettings({
 *     apiKey: process.env.PAYLOAD_API_KEY!,
 *   })
 *
 *   return {
 *     homePage: settings.homePage,
 *     featuredPages: settings.featuredPages,
 *   }
 * }
 * ```
 */
export async function getWeMeditateWebSettings(options: {
  apiKey: string
  endpoint?: string
}): Promise<WeMeditateWebSettings> {
  const client = createGraphQLClient({
    apiKey: options.apiKey,
    endpoint: options.endpoint,
  })

  const fragments = buildQueryWithFragments(['pageReference', 'tag'])

  const query = `
    ${fragments}

    query GetWeMeditateWebSettings {
      WeMeditateWebSetting {
        homePage {
          ...PageReferenceFragment
        }
        featuredPages {
          ...PageReferenceFragment
        }
        footerPages {
          ...PageReferenceFragment
        }
        musicPage {
          ...PageReferenceFragment
        }
        musicPageTags {
          ...PageReferenceFragment
        }
        subtleSystemPage {
          ...PageReferenceFragment
        }
        left {
          ...PageReferenceFragment
        }
        right {
          ...PageReferenceFragment
        }
        center {
          ...PageReferenceFragment
        }
        mooladhara {
          ...PageReferenceFragment
        }
        kundalini {
          ...PageReferenceFragment
        }
        swadhistan {
          ...PageReferenceFragment
        }
        nabhi {
          ...PageReferenceFragment
        }
        void {
          ...PageReferenceFragment
        }
        anahat {
          ...PageReferenceFragment
        }
        vishuddhi {
          ...PageReferenceFragment
        }
        agnya {
          ...PageReferenceFragment
        }
        sahasrara {
          ...PageReferenceFragment
        }
        techniquesPage {
          ...PageReferenceFragment
        }
        techniquePageTag {
          ...TagFragment
        }
        inspirationPage {
          ...PageReferenceFragment
        }
        inspirationPageTags {
          ...PageReferenceFragment
        }
        classesPage {
          ...PageReferenceFragment
        }
        liveMeditationsPage {
          ...PageReferenceFragment
        }
      }
    }
  `

  const result = await client.request<{ WeMeditateWebSetting: WeMeditateWebSettings }>(query)

  if (!result.WeMeditateWebSetting) {
    throw new Error('WeMeditateWebSettings not found')
  }

  return result.WeMeditateWebSetting
}

/**
 * Retrieves a specific page by ID.
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.id - The page ID to retrieve
 * @param options.locale - The locale to retrieve the page in
 * @param options.endpoint - Optional GraphQL endpoint URL
 * @returns The page data or null if not found
 *
 * @example
 * ```typescript
 * const page = await getPageById({
 *   apiKey: process.env.PAYLOAD_API_KEY!,
 *   id: '68fe4aba450d28b73070d8e5',
 *   locale: 'en',
 * })
 * ```
 */
export async function getPageById(options: {
  apiKey: string
  id: string
  locale: Locale
  endpoint?: string
}): Promise<Page | null> {
  const client = createGraphQLClient({
    apiKey: options.apiKey,
    endpoint: options.endpoint,
  })

  const fragments = buildQueryWithFragments(['fullPage'])

  const query = `
    ${fragments}

    query GetPageById($id: String!, $locale: LocaleInputType) {
      Page(id: $id, locale: $locale) {
        ...FullPageFragment
      }
    }
  `

  const variables = {
    id: options.id,
    locale: options.locale,
  }

  try {
    const result = await client.request<{ Page: Page }>(query, variables)
    return result.Page ?? null
  } catch (error) {
    // Page not found or other error
    return null
  }
}

/**
 * Retrieves a specific meditation by ID.
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.id - The meditation ID to retrieve
 * @param options.locale - The locale to retrieve the meditation in
 * @param options.endpoint - Optional GraphQL endpoint URL
 * @returns The meditation data or null if not found
 *
 * @example
 * ```typescript
 * const meditation = await getMeditationById({
 *   apiKey: process.env.PAYLOAD_API_KEY!,
 *   id: '68fe4aba450d28b73070d8e5',
 *   locale: 'en',
 * })
 * ```
 */
export async function getMeditationById(options: {
  apiKey: string
  id: string
  locale: Locale
  endpoint?: string
}): Promise<Meditation | null> {
  const client = createGraphQLClient({
    apiKey: options.apiKey,
    endpoint: options.endpoint,
  })

  const fragments = buildQueryWithFragments(['fullMeditation'])

  const query = `
    ${fragments}

    query GetMeditationById($id: String!, $locale: LocaleInputType) {
      Meditation(id: $id, locale: $locale) {
        ...FullMeditationFragment
      }
    }
  `

  const variables = {
    id: options.id,
    locale: options.locale,
  }

  try {
    const result = await client.request<{ Meditation: Meditation }>(query, variables)
    return result.Meditation ?? null
  } catch (error) {
    // Meditation not found or other error
    return null
  }
}

/**
 * Retrieves a list of pages filtered by tags (minimal data: id, title, thumbnail).
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.tagIds - Array of tag IDs to filter by
 * @param options.locale - The locale to retrieve pages in
 * @param options.limit - Maximum number of pages to return (default: 100)
 * @param options.endpoint - Optional GraphQL endpoint URL
 * @returns Array of page list items
 *
 * @example
 * ```typescript
 * const pages = await getPagesByTags({
 *   apiKey: process.env.PAYLOAD_API_KEY!,
 *   tagIds: ['tag1', 'tag2'],
 *   locale: 'en',
 *   limit: 20,
 * })
 * ```
 */
export async function getPagesByTags(options: {
  apiKey: string
  tagIds: string[]
  locale: Locale
  limit?: number
  endpoint?: string
}): Promise<PageListItem[]> {
  const client = createGraphQLClient({
    apiKey: options.apiKey,
    endpoint: options.endpoint,
  })

  const fragments = buildQueryWithFragments(['pageListItem'])

  const query = `
    ${fragments}

    query GetPagesByTags($tagIds: [String!]!, $locale: LocaleInputType, $limit: Int) {
      Pages(where: { tags: { in: $tagIds } }, locale: $locale, limit: $limit) {
        docs {
          ...PageListItemFragment
        }
      }
    }
  `

  const variables = {
    tagIds: options.tagIds,
    locale: options.locale,
    limit: options.limit || 100,
  }

  const result = await client.request<{ Pages: { docs: PageListItem[] } }>(query, variables)
  return result.Pages?.docs ?? []
}

/**
 * Retrieves a list of meditations filtered by tags (minimal data: id, title, thumbnail).
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.tagIds - Array of tag IDs to filter by
 * @param options.locale - The locale to retrieve meditations in
 * @param options.limit - Maximum number of meditations to return (default: 100)
 * @param options.endpoint - Optional GraphQL endpoint URL
 * @returns Array of meditation list items
 *
 * @example
 * ```typescript
 * const meditations = await getMeditationsByTags({
 *   apiKey: process.env.PAYLOAD_API_KEY!,
 *   tagIds: ['tag1', 'tag2'],
 *   locale: 'en',
 *   limit: 20,
 * })
 * ```
 */
export async function getMeditationsByTags(options: {
  apiKey: string
  tagIds: string[]
  locale: Locale
  limit?: number
  endpoint?: string
}): Promise<MeditationListItem[]> {
  const client = createGraphQLClient({
    apiKey: options.apiKey,
    endpoint: options.endpoint,
  })

  const fragments = buildQueryWithFragments(['meditationListItem'])

  const query = `
    ${fragments}

    query GetMeditationsByTags($tagIds: [String!]!, $locale: LocaleInputType, $limit: Int) {
      Meditations(where: { tags: { in: $tagIds } }, locale: $locale, limit: $limit) {
        docs {
          ...MeditationListItemFragment
        }
      }
    }
  `

  const variables = {
    tagIds: options.tagIds,
    locale: options.locale,
    limit: options.limit || 100,
  }

  const result = await client.request<{ Meditations: { docs: MeditationListItem[] } }>(query, variables)
  return result.Meditations?.docs ?? []
}

/**
 * Retrieves a list of music filtered by tags (full music data).
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.tagIds - Array of tag IDs to filter by
 * @param options.locale - The locale to retrieve music in
 * @param options.limit - Maximum number of music items to return (default: 100)
 * @param options.endpoint - Optional GraphQL endpoint URL
 * @returns Array of music items
 *
 * @example
 * ```typescript
 * const music = await getMusicByTags({
 *   apiKey: process.env.PAYLOAD_API_KEY!,
 *   tagIds: ['tag1', 'tag2'],
 *   locale: 'en',
 *   limit: 20,
 * })
 * ```
 */
export async function getMusicByTags(options: {
  apiKey: string
  tagIds: string[]
  locale: Locale
  limit?: number
  endpoint?: string
}): Promise<Music[]> {
  const client = createGraphQLClient({
    apiKey: options.apiKey,
    endpoint: options.endpoint,
  })

  const fragments = buildQueryWithFragments(['fullMusic'])

  const query = `
    ${fragments}

    query GetMusicByTags($tagIds: [String!]!, $locale: LocaleInputType, $limit: Int) {
      allMusic(where: { tags: { in: $tagIds } }, locale: $locale, limit: $limit) {
        docs {
          ...FullMusicFragment
        }
      }
    }
  `

  const variables = {
    tagIds: options.tagIds,
    locale: options.locale,
    limit: options.limit || 100,
  }

  const result = await client.request<{ allMusic: { docs: Music[] } }>(query, variables)
  return result.allMusic?.docs ?? []
}
