import { Header } from '../components/organisms/Header'
import { Footer } from '../components/organisms/Footer'
import { useData } from 'vike-react/useData'
import { usePageContext } from 'vike-react/usePageContext'
import type { WebConfig, Page } from '../server/cms-types'
import { leadSplashFromRouteData } from '../lib/cms-blocks'
import { useSiteNav } from './useSiteNav'
import { activeFeaturedSlug } from '../lib/featured-nav'
import { MAIN_CONTENT_ID } from '../lib/route-announcer'
import { localeEndonym } from '../lib/locale-names'
import { useT } from '../hooks/useT'

/**
 * LayoutChrome — the full site chrome (Header, nav, Footer) around page content.
 *
 * Opt-in: only routes that set `Layout: LayoutChrome` in their `+config.ts` get
 * chrome. It nests inside the global LayoutRoot, which owns the CSS and the
 * Sentry error boundary. Embed routes omit it entirely and render bare.
 */
export default function LayoutChrome({ children }: { children: React.ReactNode }) {
  const data = useData<{
    settings?: WebConfig
    page?: Page
    collection?: string
    initialData?: Page
  }>()
  const { locale, urlPathname } = usePageContext()
  const t = useT()
  const settings = data?.settings

  // When the page leads with a Splash, overlay the header on it: transparent,
  // themed to match, flush with the top. The Splash reserves `pt-60` for
  // exactly this. This works on content routes ([slug], `page`) and on the
  // live-preview route (/preview, `initialData`), so preview matches the
  // published layout. See leadSplashFromRouteData.
  const leadSplash = leadSplashFromRouteData(data)

  // CMS-down or error-page fallback. When settings are unavailable (the
  // _error page carries no data, or the CMS is unreachable), render the
  // content with no chrome, instead of crashing on missing nav config. This
  // is the only remaining use of the settings check. Vike config handles
  // layout selection itself.
  if (!settings) {
    return <>{children}</>
  }

  // Degrade gracefully when the CMS config is incomplete. A missing nav group
  // must never take the whole page down with a 500 (an assert used to throw
  // this outside the error boundary). Render whatever is available. The
  // data hooks still return a 404 for genuinely missing pages.
  const featuredPages = settings.featuredPages ?? []
  const knowledgePages = settings.knowledgePages ?? []
  const infoPages = settings.infoPages ?? []

  // Nav = the featured pages as plain links, plus a trailing link-less
  // "About Meditation" item that only opens the knowledge mega-menu.
  // LayoutMap shares this nav through useSiteNav, so the two cannot drift.
  //
  // Highlight the featured link for the current page. Both the highlight and
  // the title suppression (pages/[slug]/+Page.tsx) derive from
  // `activeFeaturedSlug`, so they cannot disagree. `data.page` is absent on
  // non-[slug] routes, so `activeSlug` is undefined there, and nothing
  // highlights.
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
      title: t('navigation.about_meditation'),
      links: knowledgePages.map((page) => ({
        text: page.title,
        href: '/' + page.slug,
      })),
    })
  }

  if (infoPages.length > 0) {
    footerSections.push({
      title: t('footer.info'),
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

  // The locales the CMS says this site offers, each linking to the current
  // page in that language rather than to its home page. `urlPathname` is
  // already stripped of the locale prefix by +onBeforeRoute, and `/index`
  // is its spelling of `/`. English is served bare, with no prefix.
  const pathWithoutLocale = urlPathname === '/index' ? '/' : urlPathname
  const languages = (settings.availableLocales ?? []).map((code) => ({
    code,
    label: localeEndonym(code),
    href: code === 'en' ? pathWithoutLocale : `/${code}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`,
  }))

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
          container. The content wrapper below captures its inline size into
          `--page-width` (`[--page-width:100cqi]`), so `full-bleed` blocks span
          this window-width box (excluding the scrollbar), regardless of any
          nested `@container` between them and here. The sticky nav lives
          outside <main>, so it keeps the `:root` viewport default.
          Note: no `overflow-x-clip` here. It would clip ContentTextBox's
          intentional desktop overlap (negative `-ml-32`/`-mr-32` margins).
          Blocks that bleed horizontally (OrnateTextBox) clip themselves
          instead. */}
      {/* `tabIndex={-1}` makes this element focusable by script, without
          adding it to the tab order. This is what lets the route announcer
          move focus here after a client-side navigation.
          See `lib/route-announcer.ts`. */}
      <main className="flex-1 @container" id={MAIN_CONTENT_ID} tabIndex={-1}>
        <div
          className={`max-w-7xl mx-auto px-6 [--page-width:100cqi] ${leadSplash ? 'pb-8' : 'py-8'}`}
        >
          {children}
        </div>
      </main>

      <Footer
        copyrightText={t('footer.copyright', { year: new Date().getFullYear() })}
        currentLanguage={locale}
        heroLinks={footerHeroLinks}
        languages={languages}
        locale={locale}
        sections={footerSections}
        socialLinks={socialLinks}
      />
    </div>
  )
}
