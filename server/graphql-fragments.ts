/**
 * Reusable GraphQL query fragments for PayloadCMS
 *
 * These fragments eliminate code repetition and provide consistent
 * field selection across all GraphQL queries.
 */

// ============================================================================
// Base Fragments
// ============================================================================

/**
 * Reusable query fragment for MediaImage sizes
 */
export const mediaSizesFragment = `
  thumbnail {
    url
    width
    height
    mimeType
    filename
  }
  card {
    url
    width
    height
    mimeType
    filename
  }
  tablet {
    url
    width
    height
    mimeType
    filename
  }
`

/**
 * Reusable query fragment for full Media data
 */
export const mediaImageFragment = `
  fragment MediaImageFragment on Media {
    id
    url
    thumbnailURL
    alt
    credit
    filename
    mimeType
    width
    height
    focalX
    focalY
    sizes {
      ${mediaSizesFragment}
    }
  }
`

/**
 * Reusable query fragment for tag data (works for PageTag, MeditationTag, MusicTag)
 */
export const tagFragment = `
  fragment TagFragment on PageTag {
    id
    name
    title
  }
`

/**
 * Reusable query fragment for page reference (id, title, slug)
 */
export const pageReferenceFragment = `
  fragment PageReferenceFragment on Page {
    id
    title
    slug
  }
`

/**
 * Reusable query fragment for full author data
 */
export const authorFragment = `
  fragment AuthorFragment on Author {
    id
    name
    title
    description
    countryCode
    yearsMeditating
    image {
      ...MediaImageFragment
    }
  }
`

/**
 * Reusable query fragment for page meta
 */
export const pageMetaFragment = `
  fragment PageMetaFragment on Page_Meta {
    title
    description
    image {
      ...MediaImageFragment
    }
  }
`

// ============================================================================
// Composite Fragments
// ============================================================================

/**
 * Reusable query fragment for full page data
 */
export const fullPageFragment = `
  fragment FullPageFragment on Page {
    id
    title
    content
    meta {
      ...PageMetaFragment
    }
    slug
    publishAt
    author {
      ...AuthorFragment
    }
    tags {
      ...TagFragment
    }
    _status
  }
`

/**
 * Reusable query fragment for full meditation data
 */
export const fullMeditationFragment = `
  fragment FullMeditationFragment on Meditation {
    id
    label
    locale
    musicTag {
      ...TagFragment
    }
    fileMetadata
    publishAt
    title
    slug
    thumbnail {
      ...MediaImageFragment
    }
    tags {
      ...TagFragment
    }
    frames
    url
    thumbnailURL
    filename
    mimeType
  }
`

/**
 * Reusable query fragment for full music data
 */
export const fullMusicFragment = `
  fragment FullMusicFragment on Music {
    id
    title
    slug
    tags {
      ...TagFragment
    }
    credit
    fileMetadata
    url
    filename
    mimeType
  }
`

// ============================================================================
// List Item Fragments (Minimal Data)
// ============================================================================

/**
 * Reusable query fragment for minimal page list item (id, title, thumbnail)
 */
export const pageListItemFragment = `
  fragment PageListItemFragment on Page {
    id
    title
    meta {
      image {
        ...MediaImageFragment
      }
    }
  }
`

/**
 * Reusable query fragment for minimal meditation list item (id, title, thumbnail)
 */
export const meditationListItemFragment = `
  fragment MeditationListItemFragment on Meditation {
    id
    title
    thumbnail {
      ...MediaImageFragment
    }
  }
`

// ============================================================================
// Helper function to build queries with all necessary fragments
// ============================================================================

/**
 * Combines all dependent fragments in the correct order to avoid duplicates
 */
export function buildQueryWithFragments(fragmentsToInclude: string[]): string {
  const fragmentMap: Record<string, string> = {
    mediaImage: mediaImageFragment,
    tag: tagFragment,
    pageReference: pageReferenceFragment,
    author: authorFragment,
    pageMeta: pageMetaFragment,
    fullPage: fullPageFragment,
    fullMeditation: fullMeditationFragment,
    fullMusic: fullMusicFragment,
    pageListItem: pageListItemFragment,
    meditationListItem: meditationListItemFragment,
  }

  // Track which fragments we've already added to avoid duplicates
  const addedFragments = new Set<string>()
  const fragmentsInOrder: string[] = []

  // Helper to recursively add fragment dependencies
  const addFragmentWithDeps = (fragmentName: string) => {
    if (addedFragments.has(fragmentName)) return

    // Add base fragments first (they have no dependencies)
    const baseDeps: Record<string, string[]> = {
      fullPage: ['mediaImage', 'pageMeta', 'author', 'tag'],
      fullMeditation: ['mediaImage', 'tag'],
      fullMusic: ['tag'],
      pageListItem: ['mediaImage'],
      meditationListItem: ['mediaImage'],
      author: ['mediaImage'],
      pageMeta: ['mediaImage'],
    }

    // Add dependencies first
    if (baseDeps[fragmentName]) {
      baseDeps[fragmentName].forEach(dep => addFragmentWithDeps(dep))
    }

    // Then add the fragment itself
    if (fragmentMap[fragmentName]) {
      fragmentsInOrder.push(fragmentMap[fragmentName])
      addedFragments.add(fragmentName)
    }
  }

  // Add all requested fragments
  fragmentsToInclude.forEach(addFragmentWithDeps)

  return fragmentsInOrder.join('\n\n')
}
