import { useLocale } from '../../../hooks/usePageContext'
import { useT } from '../../../hooks/useT'
import { atlasEmbedSrc } from '../../../lib/atlas-embed'

export interface ClassDirectoryProps {
  /** Where the directory opens, e.g. `/gb/london` or `/1506`. */
  atlasRoute?: string | null
  /** Whether the map is drawn. */
  showMap?: boolean
  /** Open filtered to online classes. A visitor can still clear it. */
  onlineOnly?: boolean
}

/** `pt-BR` opens `pt`: the widget matches `langs` by exact code. */
const primarySubtag = (locale: string) => locale.split('-', 1)[0] as string

/**
 * The Sahaj Atlas class directory, placed on an ordinary content page.
 *
 * The widget adopts the `<sahaj-atlas>` element the server rendered and takes
 * every setting off the loader's query string, so this component is the markup
 * and `atlasEmbedSrc` is the configuration.
 *
 * Three things it deliberately does not do:
 *
 * - ⚠ **It writes nothing to the `<head>`.** `seoRoute` builds the canonical
 *   from `urlPathname` alone, so a `?atlas=` the widget adds as a visitor
 *   browses is never indexed apart. Never wire `atlasSeo` in: it is for a host
 *   owning its route, and emits the atlas's own canonical at `/map`.
 * - **It sets no language of its own.** The directory follows the page it sits
 *   on. The widget matches `langs` by exact code, so this sends the locale's
 *   primary subtag — `pt-BR` opens `pt`.
 * - ⚠ **It does not suppress the widget's own language cog**, which writes
 *   `?locale=` and outranks this. That is the point: a visitor's switch travels
 *   in a link they copy, while the page around it stays in its own language.
 */
export function ClassDirectory({
  atlasRoute,
  showMap = true,
  onlineOnly = false,
}: ClassDirectoryProps) {
  const t = useT()
  const locale = useLocale()
  const embedKey = import.meta.env.PUBLIC__SAHAJ_ATLAS_KEY

  return (
    <div className="w-full">
      {/* ⚠ `height`, never `min-height`. A `min-height` box has a non-zero
          rect, so containment engages — but the widget's own `height: 100%`
          then resolves against an `auto` parent as zero, and it renders
          uncontained. `pages/map/+Page.tsx` owns the long form of this.
          A map-less embed has no viewport to fill, so it takes a fixed box
          above the widget's own 360x420 floor, below which it degrades to a
          card that opens the full interface. */}
      {/* ⚠ **The element is empty until the widget adopts it.** `/map` renders
          its own server-side content inside one; there is none to render here,
          so a visitor without JavaScript, or one the loader cannot reach, gets
          an empty box. `components/AGENTS.md` carries that hole in its table.
          The label is the one thing that can be given now, and `role` is what
          makes it real: a custom element carries no implicit role, and a name
          on a generic element is dropped. axe does not flag that, so the
          passing a11y gate is no evidence either. */}
      <sahaj-atlas
        aria-label={t('map.a11y.classes_heading')}
        className={`block overflow-y-auto ${showMap ? 'h-[80vh]' : 'h-[560px]'}`}
        role="region"
      />

      {/* `type="module"` is required: the loader is an ES module. Without a
          key the page is still a complete document; it just does not upgrade. */}
      {embedKey && (
        <script
          src={atlasEmbedSrc({
            key: embedKey,
            atlasRoute,
            map: showMap,
            langs: primarySubtag(locale),
            format: onlineOnly ? 'online' : undefined,
          })}
          type="module"
        />
      )}
    </div>
  )
}
