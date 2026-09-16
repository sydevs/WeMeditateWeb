import './fonts.css'
import './style.css'
import './tailwind.css'
import * as Sentry from '@sentry/react'
import { ErrorFallback } from '../components/molecules'
import { useLivePreviewLinkGuard } from '../lib/live-preview/navigation'
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
 * - the live-preview link guard (see `lib/live-preview/navigation.ts`) —
 *   preview is no longer a route, so it has to attach somewhere every page
 *   passes through, including the bare embed routes the meditation frame
 *   editor points at. It renders nothing and attaches no listener
 *   off-preview
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
  // Behaviour, not markup: a hook rather than a component that returns `null`.
  // No banner goes with it — the panel sits inside the CMS admin, whose own
  // chrome already says Live Preview, and a fixed bar would overlap the site
  // header and eat the top of a 375x667 meditation embed.
  useLivePreviewLinkGuard()

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
