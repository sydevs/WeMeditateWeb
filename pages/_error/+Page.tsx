/**
 * Error page - Displayed for 404 and 500 errors.
 *
 * Rendered when:
 * - Page not found (404)
 * - Server error during data fetching (500)
 * - CMS unreachable after retries
 */

import { usePageContext } from 'vike-react/usePageContext'
import { ErrorFallback } from '../../components/molecules'
import { ErrorType } from '../../server/error-utils'

export default function Page() {
  const { is404, abortReason } = usePageContext()
  const statusPageUrl = import.meta.env.PUBLIC__STATUS_PAGE_URL

  const errorType = is404 ? ErrorType.CLIENT : ErrorType.UNKNOWN
  const message = is404
    ? "The page you're looking for doesn't exist."
    : typeof abortReason === 'string'
      ? abortReason
      : 'An unexpected error occurred.'

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <ErrorFallback
        error={new Error(message)}
        errorType={errorType}
        resetError={() => window.location.reload()}
        showDetails={import.meta.env.DEV}
        statusPageUrl={statusPageUrl}
      />
    </div>
  )
}
