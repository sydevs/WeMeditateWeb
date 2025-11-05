import { useState, useEffect, useRef } from 'react'
import { useSearchBoxCore, useSearchSession } from '@mapbox/search-js-react'
import type {
  SearchBoxSuggestion,
  SearchBoxFeatureSuggestion,
  SearchBoxRetrieveResponse,
} from '@mapbox/search-js-core'
import { Input, Dropdown, Spinner } from '../../atoms'
import { NearbyOption } from './NearbyOption'

/**
 * Selected location data
 */
export interface SelectedLocation {
  name: string
  coordinates: { lat: number; lng: number }
}

/**
 * Props for LocationSearch component
 */
export interface LocationSearchProps {
  /**
   * Callback fired when a location is selected
   */
  onLocationSelect: (location: SelectedLocation) => void

  /**
   * Mapbox access token
   * @default import.meta.env.PUBLIC__MAPBOX_ACCESS_TOKEN
   */
  accessToken?: string

  /**
   * Placeholder text for the input
   * @default 'Search for a location...'
   */
  placeholder?: string

  /**
   * Initial value for the input
   */
  defaultValue?: string

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Proximity coordinates for biasing search results
   * If provided, results closer to this location will be prioritized
   */
  proximity?: { lng: number; lat: number }
}

/**
 * LocationSearch component for searching locations using Mapbox Search Box API.
 *
 * Features:
 * - Mapbox Search Box API integration (session-based pricing)
 * - Searches addresses, cities, regions, and POIs
 * - Geolocation "Nearby" option
 * - Read-only mode after selection with "Change" button
 * - Loading, error, and empty states
 * - Keyboard accessible
 *
 * @example
 * <LocationSearch
 *   onLocationSelect={(location) => {
 *     console.log(location.name, location.coordinates)
 *   }}
 *   placeholder="Enter your city..."
 * />
 */
export function LocationSearch({
  onLocationSelect,
  accessToken = import.meta.env.PUBLIC__MAPBOX_ACCESS_TOKEN,
  placeholder = 'Search for a location...',
  defaultValue = '',
  className = '',
  proximity,
}: LocationSearchProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [inputValue, setInputValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<SearchBoxSuggestion[]>([])
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [error, setError] = useState<string>('')

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  console.log("access token", accessToken)

  // Initialize Mapbox Search Box Core
  const searchBoxCore = useSearchBoxCore({
    accessToken: accessToken || '',
  })

  // Use session management for cost optimization
  const searchSession = useSearchSession(searchBoxCore)

  // Check if API is ready
  const isReady = !!accessToken && !!searchBoxCore

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setError('')

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Don't search if input is empty
    if (!value.trim()) {
      setSuggestions([])
      return
    }

    // Debounce the search
    debounceTimerRef.current = setTimeout(async () => {
      if (!searchBoxCore) return

      setIsLoadingSuggestions(true)
      setError('')

      try {
        const options: any = {
          sessionToken: searchSession.sessionToken,
        }

        // Add proximity if provided
        if (proximity) {
          options.proximity = [proximity.lng, proximity.lat]
        }

        const response = await searchBoxCore.suggest(value, options)

        setSuggestions(response.suggestions)
      } catch (err) {
        console.error('Error fetching suggestions:', err)
        setError('Failed to fetch location suggestions')
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 300) // 300ms debounce
  }

  // Handle input focus
  const handleInputFocus = () => {
    setIsDropdownOpen(true)
  }

  // Handle suggestion selection
  const handleSelect = async (suggestion: SearchBoxSuggestion) => {
    setIsLoadingCoordinates(true)
    setError('')

    try {
      if (!searchBoxCore) {
        throw new Error('Search Box Core not initialized')
      }

      // Retrieve full feature details including coordinates
      const response: SearchBoxRetrieveResponse = await searchBoxCore.retrieve(suggestion, {
        sessionToken: searchSession.sessionToken,
      })

      const feature: SearchBoxFeatureSuggestion = response.features[0]

      if (!feature || !feature.geometry || !feature.geometry.coordinates) {
        throw new Error('No coordinates found for this location')
      }

      // GeoJSON coordinates are [lng, lat]
      const [lng, lat] = feature.geometry.coordinates

      const location: SelectedLocation = {
        name: feature.properties.name || suggestion.name,
        coordinates: { lat, lng },
      }

      setSelectedLocation(location)
      setInputValue(location.name)
      setSuggestions([])
      setIsDropdownOpen(false)
      onLocationSelect(location)
    } catch (err) {
      setError('Failed to retrieve location coordinates')
      console.error('Error retrieving coordinates:', err)
    } finally {
      setIsLoadingCoordinates(false)
    }
  }

  // Handle "Change" button click (clear selection)
  const handleChange = () => {
    setSelectedLocation(null)
    setInputValue('')
    setError('')
    setSuggestions([])
    setIsDropdownOpen(true)
    // Session will continue to be reused (Mapbox handles session management automatically)
  }

  // Handle nearby location selection
  const handleNearbySelect = (location: SelectedLocation) => {
    setSelectedLocation(location)
    setInputValue(location.name)
    setIsDropdownOpen(false)
    onLocationSelect(location)
  }

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Show dropdown when ready and input is focused
  const shouldShowDropdown = isDropdownOpen && isReady

  // Render read-only mode if location is selected
  if (selectedLocation) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Input
          value={selectedLocation.name}
          readOnly
          disabled
          className="flex-1"
          aria-label="Selected location"
        />
        <button
          onClick={handleChange}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors"
          type="button"
          aria-label="Change location"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <Dropdown
      isOpen={shouldShowDropdown}
      onOpenChange={setIsDropdownOpen}
      openOnFocus={true}
      closeOnBlur={true}
      fullWidth={true}
      trigger={
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={!isReady}
          aria-label="Search for a location"
          aria-autocomplete="list"
          aria-controls="location-search-listbox"
          aria-expanded={shouldShowDropdown}
          className={className}
        />
      }
    >
      <div id="location-search-listbox" role="listbox" className="max-h-80 overflow-y-auto">
        {/* Nearby Option - Always first */}
        <NearbyOption onLocationSelect={handleNearbySelect} size="lg" />

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Loading Coordinates State */}
        {isLoadingCoordinates && (
          <div className="px-5 py-4 text-center text-gray-500">
            <Spinner size="sm" color="currentColor" className="mx-auto mb-2" />
            <div className="text-sm">Getting coordinates...</div>
          </div>
        )}

        {/* API Error */}
        {error && (
          <div className="px-5 py-4 text-sm text-error bg-error-light" role="alert">
            {error}
          </div>
        )}

        {/* Loading Suggestions */}
        {isLoadingSuggestions ? (
          <div className="px-5 py-4 text-center text-gray-500">
            <Spinner size="sm" color="currentColor" className="mx-auto mb-2" />
            <div className="text-sm">Searching...</div>
          </div>
        ) : !inputValue ? (
          <div className="px-5 py-4 text-sm text-gray-500 text-center">
            Type to search for a location
          </div>
        ) : suggestions.length === 0 && !error ? (
          <div className="px-5 py-4 text-sm text-gray-500 text-center">No results found</div>
        ) : null}

        {/* Suggestions List */}
        {!isLoadingCoordinates &&
          !isLoadingSuggestions &&
          suggestions.map((suggestion) => (
            <button
              key={suggestion.mapbox_id}
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-5 py-3.5 hover:bg-gray-100 transition-colors"
              type="button"
              role="option"
              aria-selected={false}
            >
              <div className="font-medium text-gray-900">{suggestion.name}</div>
              {suggestion.place_formatted && (
                <div className="text-sm text-gray-600 mt-0.5">{suggestion.place_formatted}</div>
              )}
            </button>
          ))}
      </div>
    </Dropdown>
  )
}
