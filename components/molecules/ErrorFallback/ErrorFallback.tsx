/**
 * ErrorFallback is the error boundary fallback UI.
 *
 * Sentry.ErrorBoundary and the +Page.tsx error route use it to display a
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
import { detectErrorType, ErrorType, isSafeHttpUrl } from '../../../server/error-utils'
import { errorMessageKey, errorTitleKey } from '../../../lib/error-keys'
import { useT } from '../../../hooks/useT'

export interface ErrorFallbackProps {
  /** The Error object that was thrown */
  error: Error

  /** Override automatic error classification. Use it when the caller knows the error category, for example a 404 route, and does not want to rely on message-based detection. */
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

export function ErrorFallback({
  error,
  errorType,
  resetError = () => window.location.reload(),
  showDetails = false,
  statusPageUrl,
}: ErrorFallbackProps) {
  const t = useT()
  const resolvedType = errorType ?? detectErrorType(error)
  // Both the title and the body come from the same resolved category, so a
  // 404 can no longer show the UNKNOWN body under "Content Not Found".
  const userMessage = t(errorMessageKey(resolvedType))
  const showStatusLink = resolvedType === ErrorType.SERVER && !!statusPageUrl && isSafeHttpUrl(statusPageUrl)

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <Icon
        icon={ICON_BY_TYPE[resolvedType]}
        size="2xl"
        color="secondary"
        className="mb-6"
        aria-label={t('errors.a11y.error_icon')}
      />

      <Heading level="h3" className="mb-2">
        {t(errorTitleKey(resolvedType))}
      </Heading>

      <p
        className={`text-base sm:text-lg font-light text-gray-700 max-w-md ${
          showStatusLink ? 'mb-2' : 'mb-6'
        }`}
      >
        {userMessage}
      </p>

      {showStatusLink && (
        <p className="text-base sm:text-lg font-light text-gray-700 mb-6 max-w-md">
          {t.rich('errors.general.status_page_hint', {
            link: (
              <a
                key="status-page"
                href={statusPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-700 underline"
              >
                {t('errors.general.status_page_link')}
              </a>
            ),
          })}
        </p>
      )}

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
          {t('errors.general.try_again')}
        </Button>
        <Button href="/" variant="outline" size="md">
          {t('errors.general.back_to_home')}
        </Button>
      </div>
    </div>
  )
}
