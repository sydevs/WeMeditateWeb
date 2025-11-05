import { useState } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { Spinner } from '../../atoms'

/**
 * Geolocation state
 */
type GeolocationState = 'idle' | 'loading' | 'error'

/**
 * Props for NearbyOption subcomponent
 */
interface NearbyOptionProps {
  /** Callback fired when location is successfully retrieved */
  onLocationSelect: (location: {
    name: string
    coordinates: { lat: number; lng: number }
  }) => void
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * NearbyOption subcomponent for LocationSearch.
 *
 * Displays a "Nearby" option with MapPin icon that requests the user's
 * current location from the browser's Geolocation API.
 */
export function NearbyOption({ onLocationSelect, size = 'md' }: NearbyOptionProps) {
  const [geolocationState, setGeolocationState] = useState<GeolocationState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const sizeStyles = {
    sm: 'px-4 py-2.5 text-sm',
    md: 'px-5 py-3.5 text-sm',
    lg: 'px-6 py-4 text-base',
  }

  const handleNearbyClick = () => {
    if (!navigator.geolocation) {
      setGeolocationState('error')
      setErrorMessage('Geolocation is not supported by your browser')
      return
    }

    setGeolocationState('loading')
    setErrorMessage('')

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        setGeolocationState('idle')
        onLocationSelect({
          name: 'Current Location',
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        })
      },
      // Error callback
      (error) => {
        setGeolocationState('error')

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMessage('Location access denied')
            break
          case error.POSITION_UNAVAILABLE:
            setErrorMessage('Location unavailable')
            break
          case error.TIMEOUT:
            setErrorMessage('Location request timed out')
            break
          default:
            setErrorMessage('Unable to retrieve location')
        }
      }
    )
  }

  return (
    <button
      onClick={handleNearbyClick}
      disabled={geolocationState === 'loading'}
      className={`w-full text-left flex items-center gap-2 font-medium text-gray-700 hover:bg-gray-100 transition-colors ${sizeStyles[size]} ${
        geolocationState === 'error' ? 'bg-error-light' : ''
      }`}
      type="button"
    >
      {geolocationState === 'loading' ? (
        <>
          <Spinner size="xs" color="currentColor" />
          <span>Getting location...</span>
        </>
      ) : (
        <>
          <MapPinIcon className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <div>Nearby</div>
            {geolocationState === 'error' && errorMessage && (
              <div className="text-xs text-error mt-0.5">{errorMessage}</div>
            )}
          </div>
        </>
      )}
    </button>
  )
}
