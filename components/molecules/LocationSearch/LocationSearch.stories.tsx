import type { Story, StoryDefault } from '@ladle/react'
import { LocationSearch } from './LocationSearch'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Molecules / Forms',
} satisfies StoryDefault

/**
 * LocationSearch component for Mapbox Search Box API with geolocation support.
 */
export const Default: Story = () => {
  const handleLocationSelect = (location: {
    name: string
    coordinates: { lat: number; lng: number }
  }) => {
    console.log('Location selected:', location)
    alert(
      `Selected: ${location.name}\nCoordinates: ${location.coordinates.lat}, ${location.coordinates.lng}`
    )
  }

  // Debug: Check if access token is available
  const accessToken = import.meta.env.PUBLIC__MAPBOX_ACCESS_TOKEN
  const hasToken = !!accessToken

  console.log('Mapbox Access Token Status:', {
    isDefined: hasToken,
    length: accessToken?.length || 0,
    prefix: accessToken?.substring(0, 8) + '...' || 'N/A'
  })

  return (
    <StoryWrapper>
      <StorySection
        title="API Key Status"
        description="This component requires a Mapbox access token set in PUBLIC__MAPBOX_ACCESS_TOKEN environment variable."
      >
        <div className={`p-6 border text-sm ${
          hasToken
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {hasToken ? (
            <>
              <p className="font-medium text-green-900 mb-2">✓ Access Token Found</p>
              <p className="text-green-800">
                Token is loaded and component should be functional. Try typing in the search input below.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-red-900 mb-2">✗ Access Token Missing</p>
              <p className="text-red-800 mb-3">Follow these steps to enable the component:</p>
              <ol className="list-decimal list-inside space-y-1 text-red-800">
                <li>Get a Mapbox access token from Mapbox account dashboard</li>
                <li>Add to .env: PUBLIC__MAPBOX_ACCESS_TOKEN=your_token_here</li>
                <li>Restart Ladle (the Vite config needs to reload)</li>
              </ol>
              <p className="mt-3 text-red-700">
                <strong>Note:</strong> The input will be disabled until a valid token is provided.
              </p>
            </>
          )}
        </div>
      </StorySection>

      <StorySection title="Default">
        <div className="max-w-md">
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            placeholder="Enter your city or address..."
          />
        </div>
      </StorySection>

      <StorySection title="With Proximity Bias">
        <div className="max-w-md">
          <p className="text-sm text-gray-600 mb-3">
            Search results biased toward San Francisco (lng: -122.4194, lat: 37.7749)
          </p>
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            placeholder="Search near San Francisco..."
            proximity={{ lng: -122.4194, lat: 37.7749 }}
          />
        </div>
      </StorySection>

      <StorySection title="Examples" inContext={true}>
        <div className="flex flex-col gap-8">
          <StorySection title="In a Form" variant="subsection">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                alert('Form submitted!')
              }}
              className="max-w-lg space-y-4"
            >
              <div>
                <label
                  htmlFor="event-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Event Name
                </label>
                <input
                  id="event-name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 focus:border-teal-500 focus:outline-none"
                  placeholder="Enter event name..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Location
                </label>
                <LocationSearch
                  onLocationSelect={handleLocationSelect}
                  placeholder="Search for event location..."
                />
              </div>

              <div>
                <label
                  htmlFor="event-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Event Date
                </label>
                <input
                  id="event-date"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors"
              >
                Create Event
              </button>
            </form>
          </StorySection>

          <StorySection title="With Custom Width" variant="subsection">
            <div className="max-w-sm">
              <p className="text-sm text-gray-600 mb-2">Using max-w-sm container</p>
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                placeholder="Constrained width..."
              />
            </div>
          </StorySection>

          <StorySection title="Full Width" variant="subsection">
            <div>
              <p className="text-sm text-gray-600 mb-2">Using full width of container</p>
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                placeholder="Full width search..."
              />
            </div>
          </StorySection>
        </div>
      </StorySection>

      <div />
    </StoryWrapper>
  )
}

Default.storyName = 'Location Search'
