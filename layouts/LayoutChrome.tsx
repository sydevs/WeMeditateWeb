import { Header } from '../components/organisms/Header'
import { Footer } from '../components/organisms/Footer'
import { useData } from 'vike-react/useData'
import { usePageContext } from 'vike-react/usePageContext'
import type { WebConfig, Page } from '../server/cms-types'
import { leadSplashFromRouteData } from '../lib/cms-blocks'
import { useSiteNav } from './useSiteNav'
import { activeFeaturedSlug } from '../lib/featured-nav'

/**
 * LayoutChrome — the full site chrome (Header, nav, Footer) around page content.
 *
 * Opt-in: only routes that set `Layout: LayoutChrome` in their `+config.ts` get
 * chrome. It nests inside the global LayoutRoot (which owns CSS + the Sentry
 * error boundary). Embed routes omit it entirely and render bare.
 */
export default function LayoutChrome({ children }: { children: React.ReactNode }) {
  const data = useData<{
    settings?: WebConfig
    page?: Page
    collection?: string
    initialData?: Page
  }>()
  const { locale } = usePageContext()
  const settings = data?.settings

  // When the page leads with a Splash, overlay the header on it (transparent,
  // themed to match) and let the splash sit flush at the top. The Splash reserves
  // `pt-60` for exactly this. Works on both content routes ([slug], `page`) and the
  // live-preview route (/preview, `initialData`) so preview matches the published
  // layout — see leadSplashFromRouteData.
  const leadSplash = leadSplashFromRouteData(data)

  // CMS-down / error-page fallback: when settings are unavailable (the _error
  // page carries no data, or the CMS is unreachable) render the content with no
  // chrome rather than crashing on missing nav config. This is the ONLY remaining
  // use of the settings check — layout selection itself is handled by Vike config.
  if (!settings) {
    return <>{children}</>
  }

  // Degrade gracefully when the CMS config is incomplete. A missing nav group
  // must never take the whole page down with a 500 (this used to throw via an
  // assert that ran outside the error boundary). Render whatever is available;
  // genuinely-missing pages are still handled as 404s in the data hooks.
  const featuredPages = settings.featuredPages ?? []
  const knowledgePages = settings.knowledgePages ?? []
  const infoPages = settings.infoPages ?? []

  // Nav = the featured pages as plain links, plus a trailing link-less
  // "About Meditation" item that only opens the knowledge mega-menu. Shared with
  // LayoutMap via useSiteNav so the two can't drift.
  //
  // Highlight the featured link for the current page. Both the highlight and the
  // title suppression (pages/[slug]/+Page.tsx) derive from `activeFeaturedSlug`,
  // so they can't disagree. `data.page` is absent on non-[slug] routes, so
  // `activeSlug` is undefined there and nothing highlights.
  const { navItems, actionLinkHref, actionLinkText } = useSiteNav(
    settings,
    activeFeaturedSlug(data?.page?.slug, settings),
  )

  // Build footer hero links from featured pages
  const footerHeroLinks = featuredPages.map((page) => ({
    text: page.title,
    href: '/' + page.slug,
  }))

  // Build footer sections from page groups
  const footerSections: { title: string; links: { text: string; href: string }[] }[] = []

  if (knowledgePages.length > 0) {
    footerSections.push({
      title: knowledgePages[0].title,
      links: knowledgePages.map((page) => ({
        text: page.title,
        href: '/' + page.slug,
      })),
    })
  }

  if (infoPages.length > 0) {
    footerSections.push({
      title: 'Info',
      links: infoPages.map((page) => ({
        text: page.title,
        href: '/' + page.slug,
      })),
    })
  }

  // TODO: Configure social links from settings when available
  const socialLinks = [
    { platform: 'facebook' as const, href: 'https://facebook.com/wemeditate' },
    { platform: 'instagram' as const, href: 'https://instagram.com/wemeditate' },
    { platform: 'youtube' as const, href: 'https://youtube.com/wemeditate' },
  ]

  // TODO: Configure languages from settings when available
  // TODO: Update hrefs to switch to the current page in the selected language
  const languages = [
    { code: 'en' as const, label: 'English', flagCode: 'gb', href: '/' },
    { code: 'es' as const, label: 'Español', flagCode: 'es', href: '/es' },
    { code: 'de' as const, label: 'Deutsch', flagCode: 'de', href: '/de' },
    { code: 'it' as const, label: 'Italiano', flagCode: 'it', href: '/it' },
    { code: 'fr' as const, label: 'Français', flagCode: 'fr', href: '/fr' },
  ]

  const header = (
    <div className="max-w-7xl mx-auto px-6 w-full">
      <Header
        actionLinkHref={actionLinkHref}
        actionLinkText={actionLinkText}
        logoHref="/"
        navItems={navItems}
        theme={leadSplash?.theme}
      />
    </div>
  )

  return (
    <div className={`flex flex-col min-h-screen ${leadSplash ? 'relative' : ''}`}>
      {leadSplash ? (
        // Overlay the header transparently on the lead splash.
        <div className="absolute inset-x-0 top-0 z-30">{header}</div>
      ) : (
        header
      )}

      {/* `container-type: inline-size` (@container) makes this <main> the query
          container; the content wrapper below captures its inline size into
          `--page-width` (`[--page-width:100cqi]`) so `full-bleed` blocks span this
          window-width box (excluding the scrollbar) regardless of any nested
          `@container` between them and here. The sticky nav lives outside <main>,
          so it keeps the `:root` viewport default.
          NB: no `overflow-x-clip` here — it would clip ContentTextBox's intentional
          desktop overlap (negative `-ml-32`/`-mr-32` margins). Blocks that bleed
          horizontally (OrnateTextBox) clip themselves instead. */}
      <main className="flex-1 @container">
        <div
          className={`max-w-7xl mx-auto px-6 [--page-width:100cqi] ${leadSplash ? 'pb-8' : 'py-8'}`}
        >
          {children}
        </div>
      </main>

      <Footer
        copyrightText={`© WeMeditate, ${new Date().getFullYear()}`}
        currentLanguage={locale as any}
        heroLinks={footerHeroLinks}
        languages={languages}
        locale={locale}
        sections={footerSections}
        socialLinks={socialLinks}
      />
    </div>
  )
}
