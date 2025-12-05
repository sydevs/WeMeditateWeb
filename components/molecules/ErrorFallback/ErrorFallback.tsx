/**
 * ErrorFallback - Error boundary fallback UI
 *
 * This molecule is used with Sentry.ErrorBoundary to display a user-friendly
 * error message when an unexpected React render error occurs.
 *
 * Features:
 * - Detects error type (network, server, client, unknown)
 * - Shows contextual error messages
 * - Optional status page link for server errors
 * - Retry button with page reload
 *
 * Built with existing atoms: Icon, Heading, Button
 *
 * @example
 * <ErrorFallback
 *   error={error}
 *   showDetails={import.meta.env.DEV}
 *   statusPageUrl={import.meta.env.PUBLIC__STATUS_PAGE_URL}
 * />
 */

import { ExclamationCircleIcon, WifiIcon, ServerIcon } from '@heroicons/react/24/outline'
import { Icon, Heading, Button } from '../../atoms'
import { detectErrorType, ErrorType, getUserFriendlyErrorMessage } from '../../../server/error-utils'

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

  /**
   * Optional URL to external status page
   * Shown for server errors to provide updates
   */
  statusPageUrl?: string
}

export function ErrorFallback({
  error,
  resetError = () => window.location.reload(),
  showDetails = false,
  statusPageUrl,
}: ErrorFallbackProps) {
  const errorType = detectErrorType(error)
  const userMessage = getUserFriendlyErrorMessage(error, statusPageUrl)

  // Choose icon based on error type
  const getErrorIcon = () => {
    switch (errorType) {
      case ErrorType.NETWORK:
        return WifiIcon
      case ErrorType.SERVER:
        return ServerIcon
      default:
        return ExclamationCircleIcon
    }
  }

  // Get error title based on type
  const getErrorTitle = () => {
    switch (errorType) {
      case ErrorType.NETWORK:
        return 'Connection Issue'
      case ErrorType.SERVER:
        return 'Service Temporarily Unavailable'
      case ErrorType.CLIENT:
        return 'Content Not Found'
      default:
        return 'Oops! Something went wrong'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      {/* Error Icon */}
      <Icon
        icon={getErrorIcon()}
        size="2xl"
        color="secondary"
        className="mb-6"
        aria-label="Error"
      />

      {/* Error Title */}
      <Heading level="h3" className="mb-2">
        {getErrorTitle()}
      </Heading>

      {/* Error Description with HTML support for status page link */}
      <div
        className="text-base sm:text-lg font-light text-gray-700 mb-6 max-w-md"
        dangerouslySetInnerHTML={{ __html: userMessage }}
      />

      {/* Technical Details (collapsible, optional) */}
      {showDetails && (
        <details className="mb-6 max-w-md text-left w-full">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 mb-2 text-center">
            Technical Details
          </summary>
          <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono break-words">
            <p className="mb-2">
              <strong>Error Type:</strong> {errorType}
            </p>
            <p>
              <strong>Error Message:</strong> {error.message}
            </p>
          </div>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={resetError} variant="secondary" size="md">
          Try Again
        </Button>
        <Button href="/" variant="outline" size="md">
          Back to Home
        </Button>
      </div>
    </div>
  )
}
