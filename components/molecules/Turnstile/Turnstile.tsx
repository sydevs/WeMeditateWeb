import { useEffect, useRef } from 'react'

/**
 * The Cloudflare Turnstile widget, as one token-producing box.
 *
 * Every public write to the CMS requires a Turnstile token in the
 * `x-turnstile-token` header (SahajCloud's write guard), so a form that does
 * not mount this cannot submit at all.
 *
 * The widget is rendered **explicitly**, not by Cloudflare's automatic scan of
 * the document. Vike swaps the page under `<main>` on a client-side
 * navigation, and the automatic scan runs once per document load — so an
 * auto-rendered widget appears on a full page load and never again. Explicit
 * render is tied to this component's own lifecycle instead.
 *
 * It renders no copy of its own, so it needs no translations: the challenge
 * text inside the iframe is Cloudflare's, localized from the page's `lang`.
 */

/** The narrow slice of Cloudflare's global API this component calls. */
interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      'error-callback': () => void
      'expired-callback': () => void
      theme?: 'light' | 'dark' | 'auto'
    },
  ) => string | undefined
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/**
 * One in-flight script load, shared by every widget on the page.
 *
 * Module scope, so two forms in one article do not each inject the script.
 * `turnstile` is set on `window` before the script's `load` fires, so a later
 * mount resolves immediately off the cached promise.
 */
let scriptLoad: Promise<void> | undefined

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve()

  scriptLoad ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')

    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => reject(new Error('Turnstile failed to load')))
    script.src = SCRIPT_SRC
    script.async = true
    document.head.appendChild(script)
  })

  return scriptLoad
}

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

  /** Additional CSS classes for the widget container. */
  className?: string
}

export function Turnstile({ siteKey, onToken, theme = 'light', className = '' }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null)
  // The callback identity changes on every parent render, and re-rendering the
  // widget would throw away a solved challenge. So it stays out of the effect's
  // dependencies and is read through this ref instead.
  const latestOnToken = useRef(onToken)

  latestOnToken.current = onToken

  useEffect(() => {
    let widgetId: string | undefined
    let cancelled = false

    loadTurnstile()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return

        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          callback: (token) => latestOnToken.current(token),
          'error-callback': () => latestOnToken.current(null),
          'expired-callback': () => latestOnToken.current(null),
          theme,
        })
      })
      .catch(() => {
        // A blocked or unreachable challenges.cloudflare.com leaves the form
        // without a token. The submission is then refused by the CMS, which is
        // the same outcome as an unsolved challenge — nothing to recover here.
        if (!cancelled) latestOnToken.current(null)
      })

    return () => {
      cancelled = true

      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [siteKey, theme])

  return <div ref={container} className={className} />
}
