import './fonts.css'
import './style.css'
import './tailwind.css'
import * as Sentry from '@sentry/react'
import { ErrorFallback } from '../components/molecules'

/**
 * LayoutRoot — the global layout applied to every route.
 *
 * It owns the things that must apply to ALL pages, including bare embed routes:
 * - the global stylesheets (fonts, base styles, Tailwind)
 * - the Sentry error boundary
 *
 * It renders no site chrome. Routes that want the Header/Footer/nav opt in by
 * also setting `Layout: LayoutChrome` in their `+config.ts`; Vike nests the two
 * (the `Layout` setting is cumulative). Embed routes set nothing extra and stay
 * bare by construction — chrome is never coupled to whether `settings` was
 * fetched.
 */
export default function LayoutRoot({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback
          error={error as Error}
          resetError={resetError}
          showDetails={import.meta.env.DEV}
        />
      )}
      onError={(error, componentStack, eventId) => {
        console.error('[ErrorBoundary] Caught error:', { error, eventId })
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
