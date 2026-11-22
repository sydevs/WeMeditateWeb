/**
 * The site's primary navigation, built from the SahajCloud config.
 *
 * Extracted from LayoutChrome so the map layout can render the same nav,
 * without duplicating its construction. Two copies would drift, and the nav
 * is the one piece of chrome every layout shares.
 */

import { useState } from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import type { WebConfig } from '@/types/sahajcloud'
import type { NavItem, SocialLink } from '@/components/organisms'
import type { LanguageOption } from '@/components/molecules/LanguageDropdown'
import { pageToArticle, pageToLink, pickFeaturedArticles } from './headerDropdown'
import { localeEndonym } from '@/lib/i18n/locale-names'
import { SOCIAL_PROFILES } from '@/lib/seo/site-identity'
import { useT } from '@/hooks/useT'

export interface SiteNav {
  navItems: NavItem[]
  /** The "classes near me" action link, when a class page is configured. */
  actionLinkHref: string
  actionLinkText: string | undefined
  /** The locales the site offers, each linking to the current page in that language. */
  languages: LanguageOption[]
  socialLinks: readonly SocialLink[]
}

/**
 * Build the nav items and header action link.
 *
 * This is a hook because the knowledge mega-menu shows two featured-article
 * thumbnails, picked at random once per mount (compute-once-and-reuse). The
 * panel stays closed during SSR, so the picks never enter the server HTML.
 * This is what makes the randomness hydration-safe.
 *
 * @param settings - The SahajCloud web config
 * @param activeSlug - Slug of the current page, to highlight its nav link
 */
export function useSiteNav(settings: WebConfig, activeSlug?: string): SiteNav {
  const featuredPages = settings.featuredPages ?? []
  const knowledgePages = settings.knowledgePages ?? []
  const classPages = settings.classPages ?? []
  const featuredArticles = settings.featuredArticles ?? []
  const { urlPathname } = usePageContext()
  const t = useT()

  const [articlePicks] = useState(() => pickFeaturedArticles(featuredArticles, knowledgePages))

  const navItems: NavItem[] = featuredPages.map((page) => ({
    label: page.title,
    href: '/' + page.slug,
    active: page.slug === activeSlug,
  }))

  if (knowledgePages.length > 0) {
    const knowledgeLabel = t('navigation.about_meditation')

    navItems.push({
      label: knowledgeLabel,
      dropdown: {
        title: knowledgeLabel,
        links: knowledgePages.map(pageToLink),
        featuredArticles: articlePicks.map(pageToArticle),
      },
    })
  }

  // Each option links to the current page rather than to its locale's home
  // page. `Link` spells each href through `lib/urls/urls.ts`, and so does the
  // hreflang cluster, so a language switch and the `<head>` cannot disagree
  // about where it leads.
  //
  // Which locales each one lists is a separate question, and they differ on
  // purpose. The cluster carries published ∩ offered (`advertisedLocales`),
  // because a crawler must never be told a translation exists. This list
  // carries every locale the site serves: on a `[slug]` page an entry with no
  // translation yet reaches the English page, through `pages/[slug]/+data.ts`'s
  // 302, and reaches the reader's own language the moment an editor publishes
  // it. Filtering here would hide the language switch instead. The 302 is that
  // route's alone; `/meditations/:id` and `/lectures/:id` are id-addressed, so
  // a switch there lands on the document either way.
  const languages = (settings.availableLocales ?? []).map((code) => ({
    code,
    label: localeEndonym(code),
    href: urlPathname,
  }))

  return {
    navItems,
    actionLinkHref: classPages[0] ? '/' + classPages[0].slug : '/',
    actionLinkText: classPages[0]?.title,
    languages,
    socialLinks: SOCIAL_PROFILES,
  }
}
