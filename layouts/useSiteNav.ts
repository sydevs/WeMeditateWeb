/**
 * The site's primary navigation, built from the CMS config.
 *
 * Extracted from LayoutChrome so the map layout can render the same nav without
 * duplicating its construction — two copies would drift, and the nav is the one
 * piece of chrome every layout shares.
 */

import { useState } from 'react'
import type { WebConfig } from '../server/cms-types'
import type { NavItem } from '../components/organisms'
import { pageToArticle, pageToLink, pickFeaturedArticles } from './headerDropdown'

export interface SiteNav {
  navItems: NavItem[]
  /** The "classes near me" action link, when a class page is configured. */
  actionLinkHref: string
  actionLinkText: string | undefined
}

/**
 * Build the nav items and header action link.
 *
 * A hook, because the knowledge mega-menu shows two featured-article thumbnails
 * picked at random **once per mount** (compute-once-and-reuse). The panel is
 * closed during SSR so the picks never enter the server HTML, which is what
 * makes the randomness hydration-safe.
 *
 * @param settings - The CMS web config
 * @param activeSlug - Slug of the current page, to highlight its nav link
 */
export function useSiteNav(settings: WebConfig, activeSlug?: string): SiteNav {
  const featuredPages = settings.featuredPages ?? []
  const knowledgePages = settings.knowledgePages ?? []
  const classPages = settings.classPages ?? []
  const featuredArticles = settings.featuredArticles ?? []

  const [articlePicks] = useState(() => pickFeaturedArticles(featuredArticles, knowledgePages))

  const navItems: NavItem[] = featuredPages.map((page) => ({
    label: page.title,
    href: '/' + page.slug,
    active: page.slug === activeSlug,
  }))

  if (knowledgePages.length > 0) {
    // TODO: Source this label from WmWebTranslations.navigation once that global
    // is configured in the CMS. Interim: the knowledge group's first page title,
    // matching how the footer labels the same group (localized either way).
    const knowledgeLabel = knowledgePages[0].title

    navItems.push({
      label: knowledgeLabel,
      dropdown: {
        title: knowledgeLabel,
        links: knowledgePages.map(pageToLink),
        featuredArticles: articlePicks.map(pageToArticle),
      },
    })
  }

  return {
    navItems,
    actionLinkHref: classPages[0] ? '/' + classPages[0].slug : '/',
    actionLinkText: classPages[0]?.title,
  }
}
