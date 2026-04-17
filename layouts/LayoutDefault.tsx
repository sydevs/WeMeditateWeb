import "./fonts.css";
import "./style.css";
import "./tailwind.css";
import { ErrorFallback } from "../components/molecules";
import { Header } from "../components/organisms/Header";
import { Footer } from "../components/organisms/Footer";
import { useData } from "vike-react/useData";
import { usePageContext } from "vike-react/usePageContext";
import type { WebConfig } from "../server/cms-types";
import * as Sentry from "@sentry/react";

/**
 * Validates that all required settings are properly configured
 * @throws {Error} If any required settings are missing or invalid
 */
function assertSettingsConfigured(settings: WebConfig | undefined): asserts settings is WebConfig {
  if (!settings) {
    throw new Error('WebConfig not configured')
  }

  if (!settings.homePage || !settings.homePage.title || !settings.homePage.slug) {
    throw new Error('homePage not properly configured in settings')
  }
  if (!settings.featuredPages || settings.featuredPages.length === 0) {
    throw new Error('featuredPages not configured in settings')
  }
}

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  const data = useData<{ settings?: WebConfig }>()
  const { locale } = usePageContext()
  const settings = data?.settings

  // If settings unavailable (e.g., during error page rendering when CMS is down),
  // render minimal layout without header/footer
  if (!settings) {
    return <>{children}</>
  }

  // Assert that all required settings are configured
  assertSettingsConfigured(settings)

  // Build navigation items from featured pages
  const navItems = settings.featuredPages.map((page) => ({
    label: page.title,
    href: '/' + page.slug,
  }))

  // Build footer hero links from featured pages
  const footerHeroLinks = settings.featuredPages.map((page) => ({
    text: page.title,
    href: '/' + page.slug,
  }))

  // Build footer sections from page groups
  const footerSections: { title: string; links: { text: string; href: string }[] }[] = []

  if (settings.knowledgePages.length > 0) {
    footerSections.push({
      title: settings.knowledgePages[0].title,
      links: settings.knowledgePages.map((page) => ({
        text: page.title,
        href: '/' + page.slug,
      })),
    })
  }

  if (settings.infoPages.length > 0) {
    footerSections.push({
      title: 'Info',
      links: settings.infoPages.map((page) => ({
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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <Header
          logoHref="/"
          actionLinkText={settings.classPages[0]?.title}
          actionLinkHref={settings.classPages[0] ? '/' + settings.classPages[0].slug : '/'}
          navItems={navItems}
        />
      </div>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Sentry.ErrorBoundary
            fallback={({ error, resetError }) => (
              <ErrorFallback
                error={error as Error}
                resetError={resetError}
                showDetails={import.meta.env.DEV}
              />
            )}
            onError={(error, componentStack, eventId) => {
              console.error('[ErrorBoundary] Caught error:', { error, eventId });
            }}
          >
            {children}
          </Sentry.ErrorBoundary>
        </div>
      </main>

      <Footer
        heroLinks={footerHeroLinks}
        sections={footerSections}
        socialLinks={socialLinks}
        currentLanguage={locale as any}
        languages={languages}
        copyrightText={`© WeMeditate, ${new Date().getFullYear()}`}
        locale={locale}
      />
    </div>
  );
}
