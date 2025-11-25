import type { Story, StoryDefault } from '@ladle/react'
import { ErrorFallback } from './ErrorFallback'
import { StoryWrapper, StorySection } from '../../ladle'
import * as Sentry from '@sentry/react'

export default {
  title: 'Molecules / Feedback',
} satisfies StoryDefault

/**
 * ErrorFallback molecule for displaying error states with retry functionality.
 * Used with Sentry.ErrorBoundary for graceful error handling.
 */
export const Default: Story = () => {
  // Mock error for demonstration
  const mockError = new Error('Cannot read property "data" of undefined')
  const mockResetError = () => console.log('Error boundary reset')

  return (
    <StoryWrapper>
      <StorySection title="Basic">
        <p className="text-sm text-gray-600 mb-4">
          Fully configured ErrorFallback with error, resetError, and showDetails
        </p>
        <div className="border border-gray-200 rounded-lg">
          <ErrorFallback
            error={mockError}
            resetError={mockResetError}
            showDetails={true}
          />
        </div>
      </StorySection>

      <StorySection title="Examples" inContext={true}>
        <p className="text-sm text-gray-600 mb-4">
          Real-world usage wrapped in Sentry.ErrorBoundary
        </p>
        <div className="border border-gray-200 rounded-lg p-4">
          <Sentry.ErrorBoundary
            fallback={({ error, resetError }) => (
              <ErrorFallback
                error={error as Error}
                resetError={resetError}
                showDetails={true}
              />
            )}
          >
            <ThrowErrorButton />
          </Sentry.ErrorBoundary>
        </div>
      </StorySection>

      <div />
    </StoryWrapper>
  )
}

Default.storyName = 'Error Fallback'

/**
 * Helper component that throws an error when clicked
 */
function ThrowErrorButton() {
  const [shouldThrow, setShouldThrow] = React.useState(false)

  if (shouldThrow) {
    throw new Error('Test error thrown from component')
  }

  return (
    <div className="text-center p-8">
      <p className="mb-4 text-gray-600">Click the button to trigger an error:</p>
      <button
        onClick={() => setShouldThrow(true)}
        className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Throw Error
      </button>
    </div>
  )
}

// Import React for useState
import React from 'react'
