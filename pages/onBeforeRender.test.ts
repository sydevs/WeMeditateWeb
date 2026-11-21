/**
 * No `+` prefix on the filename: Vike loads every `+`-prefixed file under
 * `pages/` as a config file. See docs/rules/testing.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PageContextServer } from 'vike/types'
import { onBeforeRender } from './+onBeforeRender'
import { EN_TRANSLATIONS } from '@/lib/i18n/i18n'
import type { LivePreviewSession } from '@/server/live-preview'
import type { WebTranslations } from '@/lib/i18n/web-translations'

const reads = vi.hoisted(() => ({ loadTranslations: vi.fn(), loadLivePreview: vi.fn() }))

vi.mock('@/server/site-context', () => ({ loadTranslations: reads.loadTranslations }))

// The real `toClientState` and `LIVE_PREVIEW_OFF`: stripping the token is
// what this hook is trusted with.
vi.mock('@/server/live-preview', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/live-preview')>()),
  loadLivePreview: reads.loadLivePreview,
}))

const TOKEN = 'eyJhbGciOiJFZERTQSJ9.live-preview-token'
const pageContext = { urlOriginal: '/fr/about' } as unknown as PageContextServer
const french = { common: { a11y: { next: 'Suivant' } } } as unknown as WebTranslations

const previewing: LivePreviewSession = {
  active: true,
  scope: 'wm-web-translations',
  token: TOKEN,
}

beforeEach(() => {
  reads.loadTranslations.mockReset().mockResolvedValue(french)
  reads.loadLivePreview.mockReset().mockResolvedValue(previewing)
})

describe('onBeforeRender', () => {
  it("puts the locale's strings and the preview verdict on pageContext", async () => {
    const result = await onBeforeRender(pageContext)

    expect(reads.loadTranslations).toHaveBeenCalledExactlyOnceWith(pageContext)
    expect(reads.loadLivePreview).toHaveBeenCalledExactlyOnceWith(pageContext)
    expect(result).toEqual({
      pageContext: {
        translations: french,
        livePreview: { active: true, scope: 'wm-web-translations' },
      },
    })
  })

  // `passToClient` serialises whatever this returns into the page.
  it('never hands the preview token to the client', async () => {
    const result = await onBeforeRender(pageContext)

    expect(result.pageContext.livePreview).toEqual({ active: true, scope: 'wm-web-translations' })
    expect(JSON.stringify(result)).not.toContain(TOKEN)
  })

  // Vike runs this for `_error` too, and an error page that cannot render its
  // own message is a blank screen.
  it.each([
    ['the translations read', () => reads.loadTranslations.mockRejectedValue(new Error('boom'))],
    ['the preview read', () => reads.loadLivePreview.mockRejectedValue(new Error('boom'))],
  ])('falls back to English and no preview when %s throws', async (_, fail) => {
    fail()

    await expect(onBeforeRender(pageContext)).resolves.toEqual({
      pageContext: {
        translations: EN_TRANSLATIONS,
        livePreview: { active: false, scope: null },
      },
    })
  })
})
