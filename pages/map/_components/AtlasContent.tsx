/**
 * The server-rendered body of an atlas page.
 *
 * This markup is what a crawler, a social scraper and a no-JS visitor read. A
 * visitor with JavaScript sees it only until the widget mounts, which replaces
 * it — so it is written for the reader who never gets the upgrade: real
 * headings, real links, real text, no interactivity implied that isn't there.
 *
 * **Nothing here is HTML from the CMS.** Descriptions arrive as
 * `content.paragraphs`, plain text, one entry per block — upstream converts
 * Lexical to text precisely so no consumer has to sanitize it. Render them as
 * text; never as `dangerouslySetInnerHTML`.
 */

import type {
  AtlasSeoBreadcrumb,
  AtlasSeoEventCard,
  AtlasSeoEventContent,
  AtlasSeoRegionContent,
  AtlasSeoResponse,
} from '../../../server/atlas-types'
import { MAP_PREFIX } from '../../../lib/atlas-route'

/**
 * Where a region or class link should point.
 *
 * The **canonical wins** when there is one. Ownership is per-subtree, so a
 * region's canonical can legitimately live on another client's domain, and
 * linking anywhere else would build a link graph pointing at URLs we ourselves
 * declare non-canonical. Falling back to our own `/map` path keeps a region
 * with no publishable owner reachable rather than rendering dead text.
 */
export function atlasHref(link: { route: string | null; url: string | null }): string | null {
  if (link.url) {
    return link.url
  }

  return link.route ? `${MAP_PREFIX}${link.route}` : null
}

/** Region ancestry, root first. The final rung is the current page, so it is not a link. */
function Breadcrumbs({ trail }: { trail: AtlasSeoBreadcrumb[] }) {
  if (trail.length < 2) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {trail.map((rung, index) => {
          const href = atlasHref(rung)
          const isCurrent = index === trail.length - 1

          return (
            <li key={`${rung.route ?? rung.name}-${index}`} className="flex items-center gap-x-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {isCurrent || !href ? (
                <span aria-current={isCurrent ? 'page' : undefined}>{rung.name}</span>
              ) : (
                <a className="hover:text-teal-600" href={href}>
                  {rung.name}
                </a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** One class in a region's listing. */
function EventCard({ card }: { card: AtlasSeoEventCard }) {
  const href = atlasHref(card)

  return (
    <li className="border-t border-gray-200 py-4">
      <h2 className="text-base font-medium text-gray-800 sm:text-lg">
        {href ? (
          <a className="hover:text-teal-600" href={href}>
            {card.title}
          </a>
        ) : (
          card.title
        )}
      </h2>
      {card.schedule && <p className="mt-1 text-sm text-gray-600">{card.schedule}</p>}
      {/* Empty for an online class, which says so instead. */}
      {card.online ? (
        <p className="mt-1 text-sm text-gray-600">Online</p>
      ) : (
        card.address && <p className="mt-1 text-sm text-gray-600">{card.address}</p>
      )}
    </li>
  )
}

/** A region page: where it is, and the classes beneath it. */
function RegionContent({
  content,
  breadcrumbs,
}: {
  content: AtlasSeoRegionContent
  breadcrumbs: AtlasSeoBreadcrumb[]
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs trail={breadcrumbs} />

      <h1 className="text-2xl font-semibold text-gray-800 sm:text-3xl">{content.name}</h1>
      {content.subtitle && <p className="mt-2 text-gray-600">{content.subtitle}</p>}

      {content.events.length > 0 ? (
        <section className="mt-8">
          <h2 className="sr-only">Meditation classes</h2>
          <ul className="list-none">
            {content.events.map((card) => (
              <EventCard key={card.id} card={card} />
            ))}
          </ul>
          {/* The listing is capped upstream; `eventCount` is the true total, so
              a partial page never reads as a complete one. */}
          {content.eventCount > content.events.length && (
            <p className="mt-4 text-sm text-gray-600">
              Showing {content.events.length} of {content.eventCount} classes.
            </p>
          )}
        </section>
      ) : (
        <p className="mt-8 text-gray-600">No meditation classes are listed here yet.</p>
      )}
    </div>
  )
}

/** A class page: when and where it meets, and what it says about itself. */
function EventContent({
  content,
  breadcrumbs,
}: {
  content: AtlasSeoEventContent
  breadcrumbs: AtlasSeoBreadcrumb[]
}) {
  const lead = content.images[0]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs trail={breadcrumbs} />

      <h1 className="text-2xl font-semibold text-gray-800 sm:text-3xl">{content.title}</h1>

      <dl className="mt-4 flex flex-col gap-2 text-gray-700">
        {content.schedule.oneLine && (
          <div>
            <dt className="sr-only">When</dt>
            <dd>{content.schedule.oneLine}</dd>
          </div>
        )}
        {content.address?.oneLine && (
          <div>
            <dt className="sr-only">Where</dt>
            <dd>{content.address.oneLine}</dd>
          </div>
        )}
        {content.languages.length > 0 && (
          <div>
            <dt className="sr-only">Languages</dt>
            <dd className="text-sm text-gray-600">{content.languages.join(', ')}</dd>
          </div>
        )}
      </dl>

      {lead && (
        <img
          alt={lead.alt ?? ''}
          className="mt-6 w-full max-w-full rounded"
          loading="lazy"
          src={lead.url}
        />
      )}

      {/* Plain text from the CMS, rendered as text. See the module comment. */}
      {content.paragraphs.map((paragraph, index) => (
        <p key={index} className="mt-4 text-gray-700">
          {paragraph}
        </p>
      ))}

      {(content.onlineUrl || content.website) && (
        <p className="mt-6">
          <a
            className="text-teal-600 hover:text-teal-700"
            href={content.onlineUrl ?? content.website ?? '#'}
            rel="noopener noreferrer"
          >
            {content.onlineUrl ? 'Join online' : 'Visit the website'}
          </a>
        </p>
      )}
    </div>
  )
}

/**
 * Dispatch on the answer's `type`, which is what the discriminated union is for:
 * narrow once, and the content shape for that variant follows.
 */
export function AtlasContent({ seo }: { seo: AtlasSeoResponse }) {
  return seo.type === 'region' ? (
    <RegionContent breadcrumbs={seo.breadcrumbs} content={seo.content} />
  ) : (
    <EventContent breadcrumbs={seo.breadcrumbs} content={seo.content} />
  )
}
