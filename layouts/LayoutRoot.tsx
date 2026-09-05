import './fonts.css'
import './style.css'
import './tailwind.css'
import * as Sentry from '@sentry/react'
import { ErrorFallback } from '../components/molecules'
import { ROUTE_ANNOUNCER_ID } from '../lib/route-announcer'

/**
 * LayoutRoot — the global layout for every route.
 *
 * It owns the things that must apply to every page, including bare embed
 * routes:
 * - the global stylesheets (fonts, base styles, Tailwind)
 * - the Sentry error boundary
 * - the route announcer (see `lib/route-announcer.ts`) — placed here, not in
 *   LayoutChrome, so an embed route, which opts into no chrome, still
 *   announces
 *
 * This layout renders the announcer once. It persists across client-side
 * navigations. A live region announces only content inserted into a region
 * the screen reader is already observing, so one created at the same
 * moment as its text says nothing.
 *
 * It renders no site chrome. A route that wants the Header, Footer, and nav
 * opts in by also setting `Layout: LayoutChrome` in its `+config.ts`. Vike
 * nests the two layouts, because the `Layout` setting is cumulative. Embed
 * routes set nothing extra, and stay bare by construction. Chrome is never
 * tied to whether `settings` was fetched.
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
      <div
        aria-atomic="true"
        aria-live="polite"
        className="sr-only"
        id={ROUTE_ANNOUNCER_ID}
        role="status"
      />
    </Sentry.ErrorBoundary>
  )
}
