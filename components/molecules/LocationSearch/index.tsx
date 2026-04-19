import React from 'react'
import { ClientOnly } from 'vike-react/ClientOnly'
import type { LocationSearchProps } from './LocationSearch'

const LocationSearchLazy = React.lazy(() =>
  import('./LocationSearch').then((mod) => ({ default: mod.LocationSearch }))
)

// Client-only wrapper to avoid SSR issues with @mapbox/search-js-react
// The Mapbox library requires browser APIs (document, window) that aren't available during SSR
export function LocationSearch(props: LocationSearchProps) {
  return (
    <ClientOnly fallback={null}>
      <LocationSearchLazy {...props} />
    </ClientOnly>
  )
}

export type { LocationSearchProps, SelectedLocation } from './LocationSearch'
