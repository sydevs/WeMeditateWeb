/**
 * The site's primary navigation, built from the SahajCloud config.
 *
 * Extracted from LayoutChrome so the map layout can render the same nav,
 * without duplicating its construction. Two copies would drift, and the nav
 * is the one piece of chrome every layout shares.
 */

import { useState } from 'react'
import type { WebConfig } from '../server/sahajcloud-types'
import type { NavItem } from '../components/organisms'
import { pageToArticle, pageToLink, pickFeaturedArticles } from './headerDropdown'
import { useT } from '../hooks/useT'

export interface SiteNav {
  navItems: NavItem[]
  /** The "classes near me" action link, when a class page is configured. */
  actionLinkHref: string
  actionLinkText: string | undefined
}

/**
 * Build the nav items and header action link.
 *
 * This is a hook because the knowledge mega-menu shows two featured-article
 * thumbnails, picked at random once per set of source lists. The
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
  const t = useT()

  // Vike keeps the layout mounted across a client-side navigation and hands it
  // fresh `settings` each time, so the picks follow what the lists hold, not
  // their identity: a locale switch retitles every page and re-rolls them.
  const sourceKey = JSON.stringify([featuredArticles, knowledgePages])
  const [picks, setPicks] = useState(() => ({
    sourceKey,
    pages: pickFeaturedArticles(featuredArticles, knowledgePages),
  }))

  if (picks.sourceKey !== sourceKey) {
    setPicks({ sourceKey, pages: pickFeaturedArticles(featuredArticles, knowledgePages) })
  }

  const articlePicks = picks.pages

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

  return {
    navItems,
    actionLinkHref: classPages[0] ? '/' + classPages[0].slug : '/',
    actionLinkText: classPages[0]?.title,
  }
}
