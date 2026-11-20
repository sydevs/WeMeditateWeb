#!/usr/bin/env tsx
/**
 * Re-exports `data/legacy-redirects/new-site.json`: the pages and meditations
 * SahajCloud production serves today, so the generator can run offline.
 *
 *   PUBLIC__SAHAJCLOUD_URL=https://cloud.sydevelopers.com \
 *   SAHAJCLOUD_API_KEY=… pnpm redirects:fetch-new-site
 *
 * Read-only. `locale=all` returns the per-locale `_status` of each page, which
 * is what says a page is published in a language. A page flagged published
 * in a language it has no title in is an untranslated shell that renders in
 * English, so `translated` is the subset the redirects treat as available. A
 * meditation has one language, its own, and is not translated.
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { stringifyOneRowPerLine } from './json'

const OUT = fileURLToPath(new URL('../../data/legacy-redirects/new-site.json', import.meta.url))

const baseURL = process.env.PUBLIC__SAHAJCLOUD_URL
const apiKey = process.env.SAHAJCLOUD_API_KEY

if (!baseURL || !apiKey) {
  console.error('set PUBLIC__SAHAJCLOUD_URL and SAHAJCLOUD_API_KEY')
  process.exit(1)
}

async function readAll<T>(collection: string, select: string[]): Promise<T[]> {
  const docs: T[] = []

  for (let page = 1; ; page++) {
    const params = new URLSearchParams({
      locale: 'all',
      limit: '100',
      depth: '0',
      page: String(page),
    })

    for (const key of select) params.set(`select[${key}]`, 'true')

    const response = await fetch(`${baseURL}/api/${collection}?${params}`, {
      headers: { Authorization: `clients API-Key ${apiKey}` },
    })

    if (!response.ok) throw new Error(`${collection}: ${response.status}`)

    const body = (await response.json()) as { docs: T[]; hasNextPage: boolean }

    docs.push(...body.docs)
    if (!body.hasNextPage) return docs
  }
}

interface PageDoc {
  id: number
  slug: string
  title?: Record<string, string>
  _status?: Record<string, string>
}

interface MeditationDoc {
  id: number
  label: string
  title?: string | null
  locale: string
  _status?: string
}

const pages = (await readAll<PageDoc>('pages', ['slug', 'title', '_status']))
  .map((page) => ({
    id: page.id,
    slug: page.slug,
    title: page.title?.en ?? null,
    published: Object.entries(page._status ?? {})
      .filter(([, status]) => status === 'published')
      .map(([locale]) => locale)
      .sort(),
    translated: Object.entries(page._status ?? {})
      .filter(([locale, status]) => status === 'published' && Boolean(page.title?.[locale]))
      .map(([locale]) => locale)
      .sort(),
  }))
  .sort((a, b) => a.id - b.id)

const meditations = (
  await readAll<MeditationDoc>('meditations', ['label', 'title', 'locale', '_status'])
)
  .filter((doc) => doc._status === 'published')
  .map((doc) => ({ id: doc.id, label: doc.label, title: doc.title ?? null, locale: doc.locale }))
  .sort((a, b) => a.id - b.id)

writeFileSync(
  OUT,
  stringifyOneRowPerLine({
    fetchedOn: new Date().toISOString().slice(0, 10),
    pages,
    meditations,
  }),
)
process.stdout.write(
  `${`wrote ${OUT}: ${pages.length} pages, ${meditations.length} meditations`}\n`,
)
