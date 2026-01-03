/**
 * Error page - Displayed for 404 and 500 errors
 *
 * This page is rendered when:
 * - Page not found (404)
 * - Server error during data fetching (500)
 * - CMS unreachable after retries
 *
 * Features:
 * - Uses ErrorFallback component for consistent error UI
 * - Vertically centered on full viewport
 * - Uses minimal LayoutError (no data dependencies)
 * - Optional status page link for server errors
 */

import { usePageContext } from 'vike-react/usePageContext'
import { ErrorFallback } from '../../components/molecules'

export default function Page() {
  const { is404, abortReason } = usePageContext()
  const statusPageUrl = import.meta.env.PUBLIC__STATUS_PAGE_URL

  // Create appropriate error object based on error type
  const error = is404
    ? // 404 error - client error type
      Object.assign(new Error('The page you are looking for does not exist.'), {
        response: { status: 404 },
      })
    : // 500 error - network/server error type
      new Error(
        typeof abortReason === 'string'
          ? abortReason
          : 'Network connection lost.'
      )

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <ErrorFallback
        error={error}
        resetError={() => window.location.reload()}
        showDetails={import.meta.env.DEV}
        statusPageUrl={statusPageUrl}
      />
    </div>
  )
}
