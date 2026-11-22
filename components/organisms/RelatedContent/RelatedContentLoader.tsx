'use client'

import { useEffect, useState } from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import type { ResolvedCardItem } from '@/lib/content/blocks'
import type { Locale } from '@/types/sahajcloud'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { RelatedContent } from './RelatedContent'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/lib/i18n/i18n'

/**
 * Which same-origin JSON route to load (see server/routes/api/):
 * `related-meditations` for a lecture anchor, `related-lectures` for a
 * meditation anchor.
 */
export type RelatedContentKind = 'related-meditations' | 'related-lectures'

/**
 * The heading and the spinner's screen-reader label, per feed.
 *
 * Both used to be props, which let a caller pass a heading and a loading
 * label describing different feeds — nothing checked they agreed. They are
 * fully determined by `kind`, so the component owns them. The keys stay
 * literal, so `TranslationKey` and the key guard still see them.
 *
 * The loading label is not derived from the heading: lowercasing "Related
 * meditations" into "Loading related meditations" composes a sentence only
 * English composes that way.
 */
export const RELATED_CONTENT_KEYS = {
  'related-meditations': {
    title: 'lecture.general.related_meditations',
    loading: 'lecture.a11y.related_meditations_loading',
  },
  'related-lectures': {
    title: 'meditation.general.related_lectures',
    loading: 'meditation.a11y.related_lectures_loading',
  },
} as const satisfies Record<RelatedContentKind, { title: TranslationKey; loading: TranslationKey }>

export interface RelatedContentLoaderProps {
  kind: RelatedContentKind
  /** The anchor document id (the lecture/meditation the page is about). */
  anchorId: string | number
  className?: string
}

/**
 * Client-side loader for the related-content section.
 *
 * The related endpoints are slow (about 5 to 12 seconds, edge-cached), so
 * fetching them in a Vike `data()` hook would block SSR and trip the
 * slow-hook warning. Instead the player page renders immediately, and this
 * loader fetches the already-mapped cards from `/api/:kind/:anchorId` after
 * mount.
 *
 * While the fetch is in flight, `items === null`, it shows the heading and
 * a spinner, so the wait stays visible. It then swaps in the carousel, or
 * renders nothing if the result is empty, for example for a non-English
 * locale. SSR and the first client render both show the loading state, so
 * there is no hydration mismatch.
 */
export function RelatedContentLoader({ kind, anchorId, className }: RelatedContentLoaderProps) {
  const { locale } = usePageContext()

  // Vike swaps one player page for the next under the same `<main>`, so React
  // reuses this instance across a client navigation and the loaded state would
  // outlive the anchor it belongs to. Keying on the request remounts instead,
  // which is what puts the spinner back in the same paint as the new page —
  // an Effect resetting it would paint the previous page's cards first.
  return (
    <RelatedContentFeed
      key={`${kind}-${anchorId}-${locale}`}
      {...{ anchorId, className, kind, locale }}
    />
  )
}

function RelatedContentFeed({
  anchorId,
  className,
  kind,
  locale,
}: RelatedContentLoaderProps & { locale: Locale }) {
  const t = useT()
  const title = t(RELATED_CONTENT_KEYS[kind].title)
  // null → loading (fetch in flight). [] → loaded but empty. [...] → loaded.
  const [items, setItems] = useState<ResolvedCardItem[] | null>(null)

  useEffect(() => {
    let cancelled = false

    const url = `/api/${kind}/${encodeURIComponent(String(anchorId))}?locale=${encodeURIComponent(locale)}`

    fetch(url)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: ResolvedCardItem[] }) => {
        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : [])
        }
      })
      .catch(() => {
        // Related content is supplementary — a failed load just omits the section.
        if (!cancelled) {
          setItems([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [kind, anchorId, locale])

  if (items === null) {
    return (
      <section aria-busy className={`mt-10 sm:mt-12 ${className ?? ''}`}>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h2>
        <div className="flex justify-center py-8">
          <Spinner label={t(RELATED_CONTENT_KEYS[kind].loading)} size="lg" />
        </div>
      </section>
    )
  }

  return <RelatedContent className={className} items={items} title={title} />
}
