/**
 * ErrorFallback - Error boundary fallback UI
 *
 * This molecule is used with Sentry.ErrorBoundary to display a user-friendly
 * error message when an unexpected React render error occurs.
 *
 * Built with existing atoms: Icon, Heading, Button
 *
 * @example
 * <ErrorFallback
 *   error={error}
 *   showDetails={import.meta.env.DEV}
 * />
 */

import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { Icon, Heading, Button } from '../../atoms'

export interface ErrorFallbackProps {
  /**
   * The Error object that was thrown
   */
  error: Error

  /**
   * Function to reset the error boundary and retry
   * Defaults to reloading the page
   */
  resetError?: () => void

  /**
   * Show technical error details (recommended for DEV only)
   */
  showDetails?: boolean
}

export function ErrorFallback({
  error,
  resetError = () => window.location.reload(),
  showDetails = false,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      {/* Error Icon */}
      <Icon
        icon={ExclamationCircleIcon}
        size="2xl"
        color="secondary"
        className="mb-6"
        aria-label="Error"
      />

      {/* Error Title */}
      <Heading level="h3" className="mb-2">
        Oops! Something went wrong
      </Heading>

      {/* Error Description */}
      <p className="text-base sm:text-lg font-light text-gray-700 mb-6 max-w-md">
        We're sorry for the inconvenience. Please try again or return to the home page.
      </p>

      {/* Technical Details (collapsible, optional) */}
      {showDetails && (
        <details className="mb-6 max-w-md text-left w-full">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 mb-2">
            Technical Details
          </summary>
          <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono break-words">
            <p>
              <strong>Error:</strong> {error.message}
            </p>
          </div>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={resetError} variant="primary" size="md">
          Try Again
        </Button>
        <Button href="/" variant="outline" size="md">
          Back to Home
        </Button>
      </div>
    </div>
  )
}
