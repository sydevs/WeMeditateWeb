import { Turnstile as TurnstileWidget } from '@marsidev/react-turnstile'

export interface TurnstileProps {
  /** The Turnstile **site** key. Its secret half lives in the CMS. */
  siteKey: string

  /**
   * The solved token, or `null` when it expired or the challenge failed. A
   * token is single-use: after a submission, remount to get another.
   */
  onToken: (token: string | null) => void

  /** Cloudflare's widget theme. @default 'light' */
  theme?: 'light' | 'dark' | 'auto'

  /**
   * The language the challenge is shown in, as a two-letter code. Cloudflare's
   * own default follows the **browser's** language, not the page's, so a
   * visitor reading the Spanish site in an English-configured browser would get
   * an English challenge in the middle of a Spanish form. Pass the page locale.
   */
  language?: string

  /** Additional CSS classes for the widget container. */
  className?: string
}

/**
 * The Cloudflare Turnstile widget, as one token-producing box.
 *
 * Every public write to the CMS requires a Turnstile token in the
 * `x-turnstile-token` header (SahajCloud's write guard), so a form that does
 * not mount this cannot submit at all.
 *
 * ⚠ **`execution: 'render'` is what survives a client-side navigation.**
 * Cloudflare's automatic scan runs once per document load, and Vike swaps the
 * page under `<main>` without reloading — so a scanned widget would appear on
 * a full load and never again. This ties the challenge to the component's own
 * lifecycle instead.
 *
 * It renders no copy of its own, so it needs no translations from the CMS: the
 * challenge text inside the iframe is Cloudflare's, in the language the
 * `language` prop names.
 */
export function Turnstile({
  siteKey,
  onToken,
  theme = 'light',
  language,
  className = '',
}: TurnstileProps) {
  return (
    <TurnstileWidget
      className={className}
      siteKey={siteKey}
      onSuccess={onToken}
      // A failed, expired or unreachable challenge all leave the form without
      // a token. The submission is then refused by the CMS, which is the same
      // outcome as an unsolved one — nothing to recover here.
      onError={() => onToken(null)}
      onExpire={() => onToken(null)}
      options={{ execution: 'render', theme, ...(language ? { language } : {}) }}
    />
  )
}
