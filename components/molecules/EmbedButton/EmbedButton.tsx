import { CheckIcon, ClipboardIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import { usePageContext } from 'vike-react/usePageContext'
import { Button, Dropdown } from '../../atoms'
import { useClipboard } from '../../../hooks/useClipboard'

/** Fixed iframe geometry/permissions for the generated embed snippet. */
const IFRAME_WIDTH = 560
const IFRAME_HEIGHT = 315
const IFRAME_ALLOW = 'autoplay; fullscreen; encrypted-media; picture-in-picture'

/**
 * Build the ready-to-paste `<iframe>` snippet for an embed path.
 *
 * Locale-prefixes the path the same way `Link` does (non-`en` locales get a
 * `/{locale}` prefix; `en` stays bare), then prepends `origin` so the `src` is
 * absolute. Kept pure and origin-injectable so it is unit-testable and
 * deterministic in stories.
 */
export function buildEmbedSnippet(embedPath: string, locale: string, origin: string): string {
  const localePath =
    locale !== 'en' && embedPath.startsWith('/') ? `/${locale}${embedPath}` : embedPath

  return `<iframe src="${origin}${localePath}" width="${IFRAME_WIDTH}" height="${IFRAME_HEIGHT}" frameborder="0" allow="${IFRAME_ALLOW}" allowfullscreen></iframe>`
}

export interface EmbedButtonProps {
  /** Locale-agnostic embed path, e.g. `/m/123` (meditation) or `/l/456` (lecture). */
  embedPath: string
  /**
   * Locale for path prefixing. Falls back to the current page locale, then `en`
   * — mirroring `Link`.
   */
  locale?: string
  /** Content title, used to label the popover. */
  title?: string
  /**
   * Origin used to build the absolute `src`. Defaults to `window.location.origin`
   * (the component renders client-only). Override for stories/tests.
   */
  origin?: string
  className?: string
}

/**
 * "Embed" popover: shows a read-only, ready-to-paste `<iframe>` snippet pointing
 * at a content item's embed route, with a Copy action and transient "Copied!"
 * feedback.
 *
 * Depends on `window` and the Clipboard API, so it is rendered client-only via
 * the `index.tsx` barrel (`ClientOnly` + `React.lazy`) and produces nothing
 * during SSR.
 */
export function EmbedButton({
  embedPath,
  locale,
  title,
  origin,
  className = '',
}: EmbedButtonProps) {
  // Resolve locale prop → page context → 'en', tolerating environments (Ladle)
  // that have no page context — same approach as Link.
  let pageContext

  try {
    pageContext = usePageContext()
  } catch {
    pageContext = null
  }
  const resolvedLocale = (locale ?? pageContext?.locale) || 'en'

  const resolvedOrigin = origin ?? (typeof window !== 'undefined' ? window.location.origin : '')

  const snippet = buildEmbedSnippet(embedPath, resolvedLocale, resolvedOrigin)

  const { copy, copied } = useClipboard()

  return (
    <Dropdown
      align="right"
      className={className}
      size="lg"
      trigger={
        <Button
          icon={CodeBracketIcon}
          size="sm"
          // The Dropdown wrapper is the keyboard-focusable trigger (role=button,
          // aria-expanded); keep this inner button out of the tab order.
          tabIndex={-1}
          variant="ghost"
        >
          Embed
        </Button>
      }
    >
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium text-gray-700">
          {title ? `Embed “${title}”` : 'Embed this player'}
        </p>
        <textarea
          readOnly
          aria-label="Embed code"
          className="w-full resize-none border border-gray-200 bg-gray-50 p-2 font-mono text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          rows={3}
          value={snippet}
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button
          icon={copied ? CheckIcon : ClipboardIcon}
          size="sm"
          onClick={() => void copy(snippet)}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    </Dropdown>
  )
}
