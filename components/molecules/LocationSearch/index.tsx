import React, { type ReactNode } from 'react'
import { ClientOnly } from 'vike-react/ClientOnly'
import type { LocationSearchProps } from './LocationSearch'

const LocationSearchLazy = React.lazy(() =>
  import('./LocationSearch').then((mod) => ({ default: mod.LocationSearch })),
)

// Client-only wrapper to avoid SSR issues with @mapbox/search-js-react.
// The Mapbox library requires browser APIs (document, window) that are not available during SSR.
export function LocationSearch({
  fallback = null,
  ...props
}: LocationSearchProps & {
  /**
   * What renders until the search can: on the server, for a visitor without
   * JavaScript, and while the chunk loads. An address field with nothing
   * behind it is a dead end, so a page adopting this owes one.
   */
  fallback?: ReactNode
}) {
  return (
    <ClientOnly fallback={fallback}>
      <LocationSearchLazy {...props} />
    </ClientOnly>
  )
}

export type { LocationSearchProps, SelectedLocation } from './LocationSearch'
