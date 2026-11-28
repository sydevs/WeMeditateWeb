/**
 * Builds the legacy redirect map from three committed snapshots: the old
 * site's URL inventory, the old site's translated path words, and the pages
 * and meditations the new site serves. Pure and deterministic; `generate.ts`
 * does the file I/O.
 */

import {
  foldSegment,
  LAUNCH_LOCALES,
  lookupIn,
  MEDITATION_ROUTE_WORDS,
  OLD_LOCALES,
  ROLE_WORDS,
  SECTION_OF,
  type ExactType,
  type LegacyRedirectMap,
} from '../../lib/legacy-redirects/core'

export interface InventoryRow {
  id: number
  locale: string
  slug: string
  name: string | null
  state?: number
  published?: boolean
  published_at: string | null
  role?: number
  article_type?: number
  category_id?: number | null
  has_video?: boolean
}

export interface HistoryRow {
  slug: string
  sluggable_id: number
  sluggable_type: string
  locale: string | null
}

export interface Inventory {
  exportedOn: string
  articles: InventoryRow[]
  staticPages: InventoryRow[]
  meditations: InventoryRow[]
  treatments: InventoryRow[]
  subtleSystemNodes: InventoryRow[]
  categories: InventoryRow[]
  streams: InventoryRow[]
  promoPages: InventoryRow[]
  slugHistory: HistoryRow[]
}

export interface LegacyRoutes {
  availableLocales: string[]
  publishedLocales: string[]
  routes: Record<string, Record<string, string>>
}

export interface NewSite {
  fetchedOn: string
  pages: {
    id: number
    slug: string
    title: string | null
    published: string[]
    translated: string[]
  }[]
  meditations: { id: number; label: string; title: string | null; locale: string }[]
}

type MatchHow = 'slug' | 'history' | 'title' | 'other-locale slug' | 'curated'

/**
 * Slug moves decided upstream but not yet served, applied over the fetched
 * snapshot so `pnpm redirects:fetch-new-site` cannot revert one. A snapshot
 * carrying neither spelling means the page moved again, which throws.
 *
 * shortcut: the map leads the rename by a deploy, so drop an entry once
 * `new-site.json` carries its `to`.
 */
const PENDING_SLUG_MOVES: readonly { id: number; from: string; to: string }[] = [
  // sydevs/WeMeditateWeb#272: /meditate-now stops answering.
  { id: 10, from: 'meditate-now', to: 'meditations' },
]

/** The new-site snapshot with every decided slug move applied. */
export function withPendingSlugMoves(snapshot: NewSite): NewSite {
  const moves = new Map(PENDING_SLUG_MOVES.map((move) => [move.id, move]))

  return {
    ...snapshot,
    pages: snapshot.pages.map((page) => {
      const move = moves.get(page.id)

      if (!move) return page
      if (page.slug !== move.from && page.slug !== move.to)
        throw new Error(`pending slug move ${move.id}: snapshot has "${page.slug}"`)

      return { ...page, slug: move.to }
    }),
  }
}

/**
 * Judgement matches the owner approved where no slug, history or title
 * agrees. Keyed `<record kind>:<old id>`, valued by the new page's slug; each
 * applies in every language the old record exists in.
 */
const CURATED_MATCHES: Record<string, string> = {
  'treatment:1': 'footsoaking',
  'treatment:2': 'ice-pack',
  'treatment:3': 'candle-treatment',
  'static:2': 'about-meditation',
}

export type Match =
  | { kind: 'match'; target: number; how: MatchHow }
  | { kind: 'ambiguous'; how: MatchHow; candidates: number[] }
  | { kind: 'none' }

export interface OldRecord {
  type: ExactType | 'static'
  id: number
  rows: InventoryRow[]
  history: Map<string, string[]>
  match: Match
}

export type UrlClass =
  | 'live'
  | 'exact'
  | 'english-untranslated'
  | 'english-unsupported-locale'
  | 'section'
  | 'fixed-page'
  | 'fixed-section'
  | 'fixed-home'

export interface OldUrl {
  path: string
  type: ExactType | 'fixed'
  locale: string
  target: string | null
  class: UrlClass
  served: boolean
  record?: string
}

export interface BuildResult {
  map: LegacyRedirectMap
  urls: OldUrl[]
  records: OldRecord[]
  roleResolution: Record<string, { target: number; how: string }>
  conflicts: string[]
  violations: string[]
  recordsWithoutEnglish: OldRecord[]
}

/** Static page role numbers, to the section key the old site's yml names them by. */
const STATIC_ROLES: Record<number, string> = {
  0: 'home',
  1: 'about',
  2: 'contact',
  3: 'shri_mataji',
  4: 'subtle_system',
  5: 'sahaja_yoga',
  7: 'privacy',
  10: 'articles',
  11: 'techniques',
  12: 'music',
  13: 'meditations',
  14: 'classes',
  15: 'streams',
}

/** The new page a section lands on when no record of its own matches. */
const SECTION_PAGE_SLUG: Record<string, string> = {
  articles: 'inspiration',
  inspiration: 'inspiration',
  meditations: 'meditations',
  techniques: 'techniques',
  subtle_system: 'chakras-channels',
  streams: 'live-meditations',
}

const HISTORY_TYPE: Record<string, ExactType> = {
  Article: 'article',
  Meditation: 'meditation',
  PromoPage: 'promo',
  Stream: 'stream',
  SubtleSystemNode: 'subtle',
  Treatment: 'treatment',
}

/** Locales a record's `rows` are per-locale translations of, rather than one row. */
const SINGLE_LOCALE: ReadonlySet<string> = new Set(['stream', 'promo'])

/** Launch locales in the new site's spelling, other than English. */
const LAUNCH_NEW_LOCALES = ['ru', 'it', 'es', 'fr', 'de', 'pt-BR', 'cs', 'uk', 'bg']

export function normalizeTitle(title: string | null | undefined): string {
  return (title ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function pushTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key)

  if (list) list.push(value)
  else map.set(key, [value])
}

export function buildRedirectMap(
  inventory: Inventory,
  legacy: LegacyRoutes,
  snapshot: NewSite,
): BuildResult {
  const site = withPendingSlugMoves(snapshot)
  const pagesBySlug = new Map(site.pages.map((page) => [foldSegment(page.slug), page]))
  const pagesById = new Map(site.pages.map((page) => [page.id, page]))
  const pagesByTitle = new Map<string, number[]>()

  for (const page of site.pages) {
    const title = normalizeTitle(page.title)

    if (title) pushTo(pagesByTitle, title, page.id)
  }

  const meditationsByLabel = new Map<string, number[]>()

  for (const meditation of site.meditations) {
    for (const text of new Set([meditation.label, meditation.title ?? ''])) {
      const key = normalizeTitle(text)

      if (key) pushTo(meditationsByLabel, key, meditation.id)
    }
  }

  const history = new Map<string, string[]>()

  for (const row of inventory.slugHistory) {
    const type = HISTORY_TYPE[row.sluggable_type]

    if (type) pushTo(history, `${type}:${row.sluggable_id}:${row.locale ?? ''}`, row.slug)
  }

  const served = (row: InventoryRow): boolean =>
    row.published !== undefined
      ? row.published === true && (row.published_at ?? '9999') <= inventory.exportedOn
      : row.state === 3 && (row.published_at ?? '9999') <= inventory.exportedOn

  const findTarget = (type: OldRecord['type'], slugs: string[], names: string[]) => {
    const equal = (candidates: string[]): number[] => {
      const found = new Set<number>()

      for (const slug of candidates) {
        const key = foldSegment(slug)

        if (type === 'meditation') {
          for (const id of meditationsByLabel.get(normalizeTitle(slug)) ?? []) found.add(id)
        } else {
          const page = pagesBySlug.get(key)

          if (page) found.add(page.id)
        }
      }

      return [...found]
    }

    return { equal, titles: names }
  }

  const matchRecord = (
    type: OldRecord['type'],
    rows: InventoryRow[],
    hist: Map<string, string[]>,
  ): Match => {
    const single = SINGLE_LOCALE.has(type)
    const english = single ? rows[0] : rows.find((row) => row.locale === 'en')
    const verdict = (ids: number[], how: MatchHow): Match | null =>
      ids.length === 1
        ? { kind: 'match', target: ids[0], how }
        : ids.length > 1
          ? { kind: 'ambiguous', how, candidates: ids.sort((a, b) => a - b) }
          : null

    if (!english) {
      const slugs = rows.flatMap((row) => [row.slug, ...(hist.get(row.locale) ?? [])])

      return (
        verdict(findTarget(type, slugs, []).equal(slugs), 'other-locale slug') ?? { kind: 'none' }
      )
    }

    const localeHistory = hist.get(single ? english.locale : 'en') ?? []
    const { equal } = findTarget(type, [], [])

    const bySlug = verdict(equal([english.slug]), 'slug')

    if (bySlug) return bySlug

    const byHistory = verdict(equal(localeHistory), 'history')

    if (byHistory) return byHistory

    const title = normalizeTitle(english.name)
    const titleIds =
      type === 'meditation'
        ? (meditationsByLabel.get(title) ?? [])
        : (pagesByTitle.get(title) ?? [])

    return (title ? verdict([...new Set(titleIds)], 'title') : null) ?? { kind: 'none' }
  }

  const tables: [OldRecord['type'], InventoryRow[]][] = [
    ['article', inventory.articles],
    ['category', inventory.categories],
    ['meditation', inventory.meditations],
    ['treatment', inventory.treatments],
    ['subtle', inventory.subtleSystemNodes],
    ['stream', inventory.streams],
    ['promo', inventory.promoPages],
    ['static', inventory.staticPages],
  ]

  const curatedMatch = (type: OldRecord['type'], id: number): Match | null => {
    const slug = CURATED_MATCHES[`${type}:${id}`]

    if (!slug) return null

    const page = pagesBySlug.get(slug)

    if (!page)
      throw new Error(`curated match ${type}:${id}: page ${slug} is missing from new-site.json`)

    return { kind: 'match', target: page.id, how: 'curated' }
  }

  const records: OldRecord[] = []

  for (const [type, table] of tables) {
    const byId = new Map<number, InventoryRow[]>()

    for (const row of table) pushTo(byId, row.id, row)

    for (const [id, rows] of byId) {
      const recordHistory = new Map<string, string[]>()

      for (const row of rows) {
        const slugs = history.get(`${type}:${id}:${row.locale}`) ?? []

        recordHistory.set(row.locale, slugs)
      }

      records.push({
        type,
        id,
        rows,
        history: recordHistory,
        match: curatedMatch(type, id) ?? matchRecord(type, rows, recordHistory),
      })
    }
  }

  const recordsWithoutEnglish = records.filter(
    (record) =>
      !SINGLE_LOCALE.has(record.type) &&
      record.type !== 'category' &&
      record.type !== 'static' &&
      !record.rows.some((row) => row.locale === 'en'),
  )

  // Sections and fixed pages -------------------------------------------------

  const homePage = site.pages.find((page) => page.slug === '')

  if (!homePage) throw new Error('new-site snapshot has no home page')

  const roleResolution: Record<string, { target: number; how: string }> = {}
  const staticByRole = new Map(
    records
      .filter((record) => record.type === 'static')
      .map((record) => [record.rows[0].role, record]),
  )

  for (const [number, key] of Object.entries(STATIC_ROLES)) {
    if (key === 'home') {
      roleResolution.home = { target: homePage.id, how: 'home page' }
      continue
    }

    const record = staticByRole.get(Number(number))

    if (record?.match.kind === 'match') {
      roleResolution[key] = {
        target: record.match.target,
        how: `static page ${record.id}, ${record.match.how}`,
      }
      continue
    }

    const section = SECTION_PAGE_SLUG[key] && pagesBySlug.get(SECTION_PAGE_SLUG[key])

    roleResolution[key] = section
      ? { target: section.id, how: `no page matches; section page ${SECTION_PAGE_SLUG[key]}` }
      : { target: homePage.id, how: 'no page matches; home' }
  }

  roleResolution.inspiration = { ...roleResolution.articles }

  for (const required of Object.values(SECTION_PAGE_SLUG)) {
    if (!pagesBySlug.has(required))
      throw new Error(`section page ${required} is missing from new-site.json`)
  }

  // Exact slugs --------------------------------------------------------------

  type Entry = { value: number; current: boolean; record: string }

  const exact = new Map<string, Entry>()
  const dropped = new Set<string>()
  const conflicts: string[] = []
  const entryRecord = new Map<string, OldRecord>()

  const addEntry = (
    type: ExactType,
    locale: string,
    slug: string,
    current: boolean,
    record: OldRecord,
  ) => {
    const folded = foldSegment(slug)
    const key = `${type}\u0000${locale}\u0000${folded}`
    const value = record.match.kind === 'match' ? record.match.target : -1
    const label = `${record.type} ${record.id}`
    const existing = exact.get(key)

    if (dropped.has(key)) return

    if (!existing) {
      exact.set(key, { value, current, record: label })
      entryRecord.set(key, record)

      return
    }

    if (existing.record === label || existing.value === value) {
      if (current && !existing.current) exact.set(key, { value, current, record: label })

      return
    }

    if (current && !existing.current) {
      exact.set(key, { value, current, record: label })
      entryRecord.set(key, record)

      return
    }

    if (!current && existing.current) return

    exact.delete(key)
    dropped.add(key)
    conflicts.push(
      `${locale}/${type}/${folded}: ${existing.record} (${existing.value}) and ${label} (${value}) disagree; no redirect`,
    )
  }

  for (const record of records) {
    if (record.type === 'static') continue

    for (const row of record.rows) {
      const types: ExactType[] = [record.type]

      if (record.type === 'article' && row.article_type === 2) types.push('event')

      for (const type of types) {
        for (const slug of record.history.get(row.locale) ?? [])
          addEntry(type, row.locale, slug, false, record)
        addEntry(type, row.locale, row.slug, true, record)
      }
    }
  }

  // The map ------------------------------------------------------------------

  const words: Record<string, Record<string, string>> = {}
  const wordKeys = new Set<string>([...ROLE_WORDS, ...MEDITATION_ROUTE_WORDS])
  const englishRoutes = legacy.routes.en

  words.en = {}

  for (const key of Object.keys(englishRoutes)) {
    if (wordKeys.has(key)) words.en[foldSegment(englishRoutes[key])] = key
  }

  Object.assign(words.en, { streams: 'streams', home: 'home', random: 'random' })

  for (const [locale, routes] of Object.entries(legacy.routes)) {
    if (locale === 'en') continue

    const mine: Record<string, string> = {}

    for (const key of Object.keys(routes)) {
      if (!wordKeys.has(key)) continue

      const word = foldSegment(routes[key])

      if (word === foldSegment(englishRoutes[key] ?? '')) continue

      if (mine[word] && mine[word] !== key)
        conflicts.push(`${locale}: word "${word}" names both ${mine[word]} and ${key}`)
      mine[word] = key
    }

    if (Object.keys(mine).length > 0) words[locale] = mine
  }

  const referenced = new Set<number>()
  const roles: Record<string, number> = {}

  for (const key of ROLE_WORDS) {
    roles[key] = roleResolution[key].target
    referenced.add(roles[key])
  }

  const exactOut = {} as LegacyRedirectMap['exact']

  for (const type of Object.keys(SECTION_OF) as ExactType[]) exactOut[type] = {}

  for (const [key, entry] of [...exact].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const [type, locale, slug] = key.split('\u0000') as [ExactType, string, string]

    exactOut[type][locale] ??= {}
    exactOut[type][locale][slug] = entry.value
    if (type !== 'meditation' && entry.value > 0) referenced.add(entry.value)
  }

  const pages: LegacyRedirectMap['pages'] = {}

  for (const id of [...referenced].sort((a, b) => a - b)) {
    const page = pagesById.get(id)

    if (!page) throw new Error(`page ${id} missing`)

    pages[String(id)] = [
      page.slug,
      LAUNCH_NEW_LOCALES.filter((l) => page.translated.includes(l)).join(' '),
    ]
  }

  const map: LegacyRedirectMap = { pages, roles, words, exact: exactOut }

  // The old URLs, each with the target it must get ---------------------------

  const wordOf = (locale: string, key: string): string =>
    legacy.routes[locale]?.[key] ?? legacy.routes.en[key]

  const prefix = (locale: string): string => (locale === 'en' ? '' : `/${locale}`)

  const expectedHref = (
    pageId: number,
    oldLocale: string,
  ): { href: string; localized: boolean } => {
    const page = pagesById.get(pageId)!
    const visitor = LAUNCH_LOCALES[oldLocale] ?? 'en'
    const localized = visitor !== 'en' && page.translated.includes(visitor)
    const base = localized ? `/${visitor}` : ''

    return { href: page.slug === '' ? base || '/' : `${base}/${page.slug}`, localized }
  }

  const urls: OldUrl[] = []

  const pathsFor = (type: ExactType, locale: string, slug: string): string[] => {
    const p = prefix(locale)

    switch (type) {
      case 'article':
        return [`${p}/${wordOf(locale, 'articles')}/${slug}`]
      case 'category':
        return [
          `${p}/${wordOf(locale, 'inspiration')}/${slug}`,
          `${p}/${wordOf(locale, 'articles')}/category/${slug}`,
        ]
      case 'meditation':
        return [`${p}/${wordOf(locale, 'meditations')}/${slug}`]
      case 'treatment':
        return [`${p}/${wordOf(locale, 'techniques')}/${slug}`]
      case 'subtle':
        return [`${p}/${wordOf(locale, 'subtle_system')}/${slug}`]
      case 'stream':
        return [`${p}/${wordOf(locale, 'streams')}/${slug}`]
      default:
        return [`${p}/${slug}`]
    }
  }

  for (const [key, entry] of exact) {
    const [type, locale, slug] = key.split('\u0000') as [ExactType, string, string]
    const record = entryRecord.get(key)!
    const row = record.rows.find((r) => r.locale === locale || SINGLE_LOCALE.has(record.type))!
    const visitor = LAUNCH_LOCALES[locale] ?? 'en'
    let target: string
    let urlClass: UrlClass

    if (type === 'meditation' && entry.value > 0) {
      target = `/meditations/${entry.value}`
      urlClass = locale === 'en' ? 'exact' : 'english-unsupported-locale'
    } else if (entry.value > 0) {
      const { href, localized } = expectedHref(entry.value, locale)

      target = href
      urlClass =
        locale === 'en' || localized
          ? 'exact'
          : LAUNCH_LOCALES[locale]
            ? 'english-untranslated'
            : 'english-unsupported-locale'
    } else {
      target = expectedHref(roleResolution[SECTION_OF[type]].target, locale).href
      urlClass = 'section'
    }

    void visitor

    for (const path of pathsFor(type, locale, slug)) {
      urls.push({
        path,
        type,
        locale,
        target: target === path ? null : target,
        class: target === path ? 'live' : urlClass,
        served:
          served(row) &&
          legacy.publishedLocales.includes(locale) &&
          !(type === 'category' && path.includes('/category/')),
        record: entry.record,
      })
    }
  }

  const fixed = (path: string, locale: string, role: string, extra?: Partial<OldUrl>) => {
    const { how } = roleResolution[role]
    const { href } = expectedHref(roleResolution[role].target, locale)

    urls.push({
      path,
      type: 'fixed',
      locale,
      target: href === path ? null : href,
      class:
        href === path
          ? 'live'
          : how.startsWith('static')
            ? 'fixed-page'
            : how.startsWith('home') || how.endsWith('home')
              ? 'fixed-home'
              : 'fixed-section',
      served: legacy.publishedLocales.includes(locale),
      record: role,
      ...extra,
    })
  }

  for (const locale of [...OLD_LOCALES].sort()) {
    const p = prefix(locale)

    if (locale === 'en') fixed('/en', 'en', 'home')
    else fixed(p, locale, 'home')

    for (const role of [...ROLE_WORDS].filter((r) => r !== 'home')) {
      fixed(`${p}/${wordOf(locale, role)}`, locale, role)
    }

    for (const sub of MEDITATION_ROUTE_WORDS) {
      fixed(
        `${p}/${wordOf(locale, 'meditations')}/${wordOf(locale, sub) ?? sub}`,
        locale,
        'meditations',
      )
    }

    urls.push({
      path: `${p}/sitemap.xml.gz`,
      type: 'fixed',
      locale,
      target: '/sitemap.xml',
      class: 'fixed-page',
      served: legacy.publishedLocales.includes(locale),
      record: 'sitemap',
    })

    if (locale !== 'en') {
      urls.push({
        path: `${p}/map`,
        type: 'fixed',
        locale,
        target: '/map',
        class: 'fixed-page',
        served: legacy.publishedLocales.includes(locale),
        record: 'map',
      })
    }
  }

  fixed('/surrey', 'en', 'streams', { served: true })

  // Rails tried fixed routes, then promo pages, then events, for the same path.
  const rank = (url: OldUrl): number =>
    url.type === 'fixed' ? 0 : url.type === 'promo' ? 1 : url.type === 'event' ? 2 : 3
  const byPath = new Map<string, OldUrl>()

  for (const url of urls) {
    const existing = byPath.get(url.path)

    if (!existing || rank(url) < rank(existing)) byPath.set(url.path, url)
  }

  urls.length = 0
  urls.push(...byPath.values())

  // Check the lookup against what each address must get -----------------------

  const violations: string[] = []
  const encode = (path: string): string => path.split('/').map(encodeURIComponent).join('/')

  for (const url of urls) {
    const got = lookupIn(map, encode(url.path))

    if (got !== url.target)
      violations.push(`${url.path}: expected ${url.target}, lookup gave ${got}`)

    if (url.target !== null && lookupIn(map, url.target) !== null) {
      violations.push(
        `${url.path}: target ${url.target} is itself redirected to ${lookupIn(map, url.target)}`,
      )
    }
  }

  return { map, urls, records, roleResolution, conflicts, violations, recordsWithoutEnglish }
}
