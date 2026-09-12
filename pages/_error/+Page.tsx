/**
 * Error page. Displays 404 and 500 errors.
 *
 * Renders when:
 * - Page not found (404)
 * - Server error during data fetching (500)
 * - CMS unreachable after retries
 */

import { usePageContext } from 'vike-react/usePageContext'
import { ErrorFallback } from '../../components/molecules'
import { ErrorType } from '../../server/error-utils'

export default function Page() {
  const { is404 } = usePageContext()
  const statusPageUrl = import.meta.env.PUBLIC__STATUS_PAGE_URL

  const errorType = is404 ? ErrorType.CLIENT : ErrorType.SERVER

  // ErrorFallback picks its own title and body from `errorType`, so the
  // `Error` here only carries developer detail for the DEV `showDetails`
  // panel. The abort reason a `render(404, '…')` supplies never reached a
  // visitor even before this — ErrorFallback discarded it — so it is not a
  // translated string. It stays a developer-facing message.
  const message = is404 ? 'Route aborted with 404' : 'Route aborted with a server error'

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
