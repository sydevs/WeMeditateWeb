/**
 * Error page - Displayed for 404 and 500 errors
 *
 * This page is rendered when:
 * - Page not found (404)
 * - Server error during data fetching (500)
 * - CMS unreachable after retries
 *
 * Features:
 * - User-friendly error messages
 * - Navigation buttons (Try Again, Home)
 * - Optional status page link for server errors
 */

import { usePageContext } from "vike-react/usePageContext"
import { ExclamationCircleIcon, HomeIcon } from '@heroicons/react/24/outline'
import { Icon, Heading, Button } from '../../components/atoms'

export default function Page() {
  const { is404 } = usePageContext()
  const statusPageUrl = import.meta.env.PUBLIC__STATUS_PAGE_URL

  if (is404) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        {/* 404 Icon */}
        <Icon
          icon={HomeIcon}
          size="2xl"
          color="secondary"
          className="mb-6"
          aria-label="Not Found"
        />

        {/* 404 Title */}
        <Heading level="h1" className="mb-2">
          Page Not Found
        </Heading>

        {/* 404 Description */}
        <p className="text-base sm:text-lg font-light text-gray-700 mb-6 max-w-md">
          The page you're looking for doesn't exist. It may have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button href="/" variant="primary" size="md">
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  // Server error (500)
  const statusPageLink = statusPageUrl
    ? ` Check our <a href="${statusPageUrl}" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:text-teal-700 underline">status page</a> for updates.`
    : ''

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      {/* Server Error Icon */}
      <Icon
        icon={ExclamationCircleIcon}
        size="2xl"
        color="secondary"
        className="mb-6"
        aria-label="Error"
      />

      {/* Server Error Title */}
      <Heading level="h1" className="mb-2">
        Service Temporarily Unavailable
      </Heading>

      {/* Server Error Description */}
      <div
        className="text-base sm:text-lg font-light text-gray-700 mb-6 max-w-md"
        dangerouslySetInnerHTML={{
          __html: `We're experiencing technical difficulties. Please try again in a few moments.${statusPageLink}`
        }}
      />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => window.location.reload()} variant="secondary" size="md">
          Try Again
        </Button>
        <Button href="/" variant="outline" size="md">
          Back to Home
        </Button>
      </div>
    </div>
  )
}
