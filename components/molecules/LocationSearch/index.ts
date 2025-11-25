import { clientOnly } from 'vike-react/clientOnly'

// Export as client-only component to avoid SSR issues with @mapbox/search-js-react
// The Mapbox library requires browser APIs (document, window) that aren't available during SSR
export const LocationSearch = clientOnly(async () =>
  (await import('./LocationSearch')).LocationSearch
)

export type { LocationSearchProps, SelectedLocation } from './LocationSearch'
