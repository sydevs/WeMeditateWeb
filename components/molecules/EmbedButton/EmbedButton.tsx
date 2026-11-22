import { CheckIcon, ClipboardIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import { Button, Dropdown } from '@/components/atoms'
import { useClipboard } from '@/hooks/useClipboard'
import { useT } from '@/hooks/useT'
import { useLocale } from '@/hooks/usePageContext'
import { absoluteHref } from '@/lib/urls/urls'
import { playerIframe } from '@/lib/media/embed-player'
import type { Locale } from '@/types/sahajcloud'

/**
 * Build the ready-to-paste `<iframe>` snippet for an embed path.
 *
 * The URL comes from `absoluteHref`, which spells the locale prefix the same
 * way `Link` does. The function stays pure and origin-injectable, so it is
 * unit-testable and deterministic in stories.
 */
export function buildEmbedSnippet(embedPath: string, locale: Locale, origin: string): string {
  return playerIframe(absoluteHref(origin, locale, embedPath))
}

export interface EmbedButtonProps {
  /** Locale-agnostic embed path, for example `/meditations/123/embed` or `/lectures/456/embed`. */
  embedPath: string
  /**
   * Locale for path prefixing. This falls back to the current page locale,
   * then to the default one, mirroring `Link`.
   */
  locale?: Locale
  /** Content title, used to label the popover. */
  title?: string
  /**
   * Origin used to build the absolute `src`. It defaults to
   * `window.location.origin`, because the component renders client-only.
   * Override it for stories or tests.
   */
  origin?: string
  className?: string
}

/**
 * An "Embed" popover. It shows a read-only, ready-to-paste `<iframe>`
 * snippet that points at a content item's embed route, with a Copy action
 * and transient "Copied!" feedback.
 *
 * This depends on `window` and the Clipboard API, so it renders client-only
 * through the `index.tsx` barrel (`ClientOnly` and `React.lazy`), and it
 * produces nothing during SSR.
 */
export function EmbedButton({
  embedPath,
  locale,
  title,
  origin,
  className = '',
}: EmbedButtonProps) {
  const t = useT()
  // The locale prop wins; otherwise the page's, or the default outside Vike.
  // `useLocale` owns the no-pageContext guard (Ladle, unit tests).
  const pageLocale = useLocale()
  const resolvedLocale = locale || pageLocale

  const resolvedOrigin = origin ?? (typeof window !== 'undefined' ? window.location.origin : '')

  const snippet = buildEmbedSnippet(embedPath, resolvedLocale, resolvedOrigin)

  const { copy, copied } = useClipboard()

  const heading = title
    ? t('media.general.embed_title', { title })
    : t('media.general.embed_player')

  // A snippet, a field and a button are no `menu`: the panel is a non-modal
  // dialog, named by the heading it shows.
  return (
    <Dropdown
      align="right"
      ariaLabel={heading}
      className={className}
      role="dialog"
      size="lg"
      trigger={(props) => (
        <Button icon={CodeBracketIcon} size="sm" variant="ghost" {...props}>
          {t('media.general.embed')}
        </Button>
      )}
    >
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium text-gray-700">{heading}</p>
        <textarea
          readOnly
          aria-label={t('media.a11y.embed_code')}
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
          {copied ? t('media.general.copied') : t('media.general.copy')}
        </Button>
      </div>
    </Dropdown>
  )
}
