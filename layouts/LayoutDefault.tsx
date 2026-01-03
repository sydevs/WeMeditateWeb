import "./fonts.css";
import "./style.css";
import "./tailwind.css";
import { ErrorFallback } from "../components/molecules";
import { Header } from "../components/organisms/Header";
import { Footer } from "../components/organisms/Footer";
import { useData } from "vike-react/useData";
import { usePageContext } from "vike-react/usePageContext";
import type { WeMeditateWebSettings } from "../server/cms-types";
import * as Sentry from "@sentry/react";

/**
 * Validates that all required settings are properly configured
 * @throws {Error} If any required settings are missing or invalid
 */
function assertSettingsConfigured(settings: WeMeditateWebSettings | undefined): asserts settings is WeMeditateWebSettings {
  if (!settings) {
    throw new Error('WeMeditateWebSettings not configured')
  }

  if (!settings.homePage || !settings.homePage.title || !settings.homePage.slug) {
    throw new Error('homePage not properly configured in settings')
  }
  if (!settings.techniquesPage || !settings.techniquesPage.title || !settings.techniquesPage.slug) {
    throw new Error('techniquesPage not properly configured in settings')
  }
  if (!settings.musicPage || !settings.musicPage.title || !settings.musicPage.slug) {
    throw new Error('musicPage not properly configured in settings')
  }
  if (!settings.inspirationPage || !settings.inspirationPage.title || !settings.inspirationPage.slug) {
    throw new Error('inspirationPage not properly configured in settings')
  }
  if (!settings.classesPage || !settings.classesPage.title || !settings.classesPage.slug) {
    throw new Error('classesPage not properly configured in settings')
  }
  if (!settings.featuredPages || settings.featuredPages.length === 0) {
    throw new Error('featuredPages not configured in settings')
  }
  if (!settings.footerPages || settings.footerPages.length === 0) {
    throw new Error('footerPages not configured in settings')
  }
}

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  const data = useData<{ settings?: WeMeditateWebSettings }>()
  const { locale } = usePageContext()
  const settings = data?.settings

  // If settings unavailable (e.g., during error page rendering when CMS is down),
  // render minimal layout without header/footer
  if (!settings) {
    return <>{children}</>
  }

  // Assert that all required settings are configured
  assertSettingsConfigured(settings)

  // Build navigation items from settings
  const navItems = [
    { label: settings.homePage.title, href: '/' + settings.homePage.slug },
    { label: settings.techniquesPage.title, href: '/' + settings.techniquesPage.slug },
    { label: settings.musicPage.title, href: '/' + settings.musicPage.slug },
    { label: settings.inspirationPage.title, href: '/' + settings.inspirationPage.slug },
    { label: settings.classesPage.title, href: '/' + settings.classesPage.slug },
  ]

  // Build footer hero links from featured pages
  const footerHeroLinks = settings.featuredPages.map((page) => {
    if (!page.title || !page.slug) {
      throw new Error(`Featured page ${page.id} missing title or slug`)
    }
    return {
      text: page.title,
      href: '/' + page.slug,
    }
  })

  // Build footer sections from footer pages
  // Group footer pages into sections (for now, single section)
  const footerSections = [
    {
      title: 'Quick Links',
      links: settings.footerPages.map((page) => {
        if (!page.title || !page.slug) {
          throw new Error(`Footer page ${page.id} missing title or slug`)
        }
        return {
          text: page.title,
          href: '/' + page.slug,
        }
      }),
    },
  ]

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
          actionLinkText={settings.classesPage.title}
          actionLinkHref={'/' + settings.classesPage.slug}
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
