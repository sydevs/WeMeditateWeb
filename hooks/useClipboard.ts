import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseClipboardOptions {
  /**
   * How long (ms) the `copied` flag stays true after a successful copy.
   * @default 2000
   */
  timeout?: number
}

export interface UseClipboardResult {
  /**
   * Copy text to the clipboard. Resolves to `true` on success, or `false` when
   * the Clipboard API is unavailable or the write was rejected (for example,
   * an insecure context or denied permission).
   */
  copy: (text: string) => Promise<boolean>
  /** True for `timeout` ms after the most recent successful copy. */
  copied: boolean
}

/**
 * Tiny wrapper around `navigator.clipboard.writeText()`. Exposes a `copied`
 * flag for transient "Copied!" feedback.
 *
 * Guards environments without the Clipboard API (SSR, insecure contexts, and
 * older browsers) by returning `false` instead of throwing an error. The
 * `copied` flag flips back to false after `timeout` ms. The cleanup clears
 * any pending timer when the component unmounts.
 *
 * @example
 * const { copy, copied } = useClipboard()
 * <button onClick={() => copy(snippet)}>{copied ? 'Copied!' : 'Copy'}</button>
 */
export function useClipboard({ timeout = 2000 }: UseClipboardOptions = {}): UseClipboardResult {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear any pending reset timer when the consuming component unmounts.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        return false
      }

      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => setCopied(false), timeout)

        return true
      } catch {
        return false
      }
    },
    [timeout],
  )

  return { copy, copied }
}
