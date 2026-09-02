import { Header } from '../components/organisms/Header'
import { useData } from 'vike-react/useData'
import type { WebConfig } from '../server/cms-types'
import { useSiteNav } from './useSiteNav'
import { MAIN_CONTENT_ID } from '../lib/route-announcer'

/**
 * LayoutMap — chrome for the atlas at `/map`.
 *
 * The atlas owns the viewport, so this differs from LayoutChrome in three ways,
 * all of them consequences of that:
 *
 * - **The condensed header only.** The tall banner is chrome the page has no
 *   room to give away, and the condensed nav already carries the logo and the
 *   "classes near me" link.
 * - **No footer.** The page does not scroll, so a footer below the fold would be
 *   unreachable rather than merely unused.
 * - **No content padding.** The map is meant to meet the chrome edge to edge;
 *   LayoutChrome's `max-w-7xl mx-auto px-6 py-8` would frame it in whitespace.
 *
 * `h-dvh` + `flex-1 min-h-0` gives `<main>` a definite height, which is what lets
 * the atlas element resolve `h-full` and opt into the widget's contained map
 * mode. `dvh` rather than `vh` so a mobile browser's collapsing toolbar doesn't
 * leave the map overflowing.
 *
 * The nav itself comes from `useSiteNav`, shared with LayoutChrome.
 */
export default function LayoutMap({ children }: { children: React.ReactNode }) {
  const data = useData<{ settings?: WebConfig }>()
  const settings = data?.settings

  // Same degradation as LayoutChrome: a CMS-down render must not take the page
  // down with it. The atlas is client-rendered and works without our nav.
  if (!settings) {
    return <>{children}</>
  }

  return <MapChrome settings={settings}>{children}</MapChrome>
}

/**
 * Split from the export so `useSiteNav` is never called conditionally — the
 * settings guard above returns before any hook would run.
 */
function MapChrome({ settings, children }: { settings: WebConfig; children: React.ReactNode }) {
  const { navItems, actionLinkHref, actionLinkText } = useSiteNav(settings)

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header
        condensed
        actionLinkHref={actionLinkHref}
        actionLinkText={actionLinkText}
        logoHref="/"
        navItems={navItems}
      />

      {/* `tabIndex={-1}`: programmatically focusable, but not in the tab order.
          See `lib/route-announcer.ts`. */}
      <main className="min-h-0 flex-1" id={MAIN_CONTENT_ID} tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
