/**
 * ErrorFallback - Error boundary fallback UI
 *
 * Used by Sentry.ErrorBoundary and the +Page.tsx error route to display a
 * contextual, user-friendly error message.
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
import {
  detectErrorType,
  ErrorType,
  getUserFriendlyErrorMessage,
  isSafeHttpUrl,
} from '../../../server/error-utils'

export interface ErrorFallbackProps {
  /** The Error object that was thrown */
  error: Error

  /** Override automatic error classification. Useful when the caller knows the error category (e.g. a 404 route) and doesn't want to rely on message-based detection. */
  errorType?: ErrorType

  /** Function to reset the error boundary and retry. Defaults to reloading the page. */
  resetError?: () => void

  /** Show technical error details (recommended for DEV only) */
  showDetails?: boolean

  /** Optional URL to external status page, shown for server errors. Must be an http(s) URL — other schemes are ignored. */
  statusPageUrl?: string
}

const ICON_BY_TYPE = {
  [ErrorType.NETWORK]: WifiIcon,
  [ErrorType.SERVER]: ServerIcon,
  [ErrorType.CLIENT]: ExclamationCircleIcon,
  [ErrorType.UNKNOWN]: ExclamationCircleIcon,
}

const TITLE_BY_TYPE = {
  [ErrorType.NETWORK]: 'Connection Issue',
  [ErrorType.SERVER]: 'Service Temporarily Unavailable',
  [ErrorType.CLIENT]: 'Content Not Found',
  [ErrorType.UNKNOWN]: 'Oops! Something went wrong',
}

export function ErrorFallback({
  error,
  errorType,
  resetError = () => window.location.reload(),
  showDetails = false,
  statusPageUrl,
}: ErrorFallbackProps) {
  const resolvedType = errorType ?? detectErrorType(error)
  const userMessage = getUserFriendlyErrorMessage(error)
  const showStatusLink = resolvedType === ErrorType.SERVER && !!statusPageUrl && isSafeHttpUrl(statusPageUrl)

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <Icon
        icon={ICON_BY_TYPE[resolvedType]}
        size="2xl"
        color="secondary"
        className="mb-6"
        aria-label="Error"
      />

      <Heading level="h3" className="mb-2">
        {TITLE_BY_TYPE[resolvedType]}
      </Heading>

      <p className="text-base sm:text-lg font-light text-gray-700 mb-2 max-w-md">
        {userMessage}
      </p>

      {showStatusLink && (
        <p className="text-base sm:text-lg font-light text-gray-700 mb-6 max-w-md">
          Check our{' '}
          <a
            href={statusPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:text-teal-700 underline"
          >
            status page
          </a>{' '}
          for updates.
        </p>
      )}
      {!showStatusLink && <div className="mb-4" />}

      {showDetails && (
        <details className="mb-6 max-w-md text-left w-full">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 mb-2 text-center">
            Technical Details
          </summary>
          <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono break-words">
            <p className="mb-2">
              <strong>Error Type:</strong> {resolvedType}
            </p>
            <p>
              <strong>Error Message:</strong> {error.message}
            </p>
          </div>
        </details>
      )}

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
