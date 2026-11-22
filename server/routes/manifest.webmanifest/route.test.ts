import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { EN_TRANSLATIONS } from '@/lib/i18n/i18n'
import type { SahajCloudEnv } from '@/server/sahajcloud/context'

const { findGlobal } = vi.hoisted(() => ({ findGlobal: vi.fn() }))

vi.mock('@/server/sahajcloud/context', () => ({
  getSahajCloudContext: () => ({ apiKey: 'test-key', baseURL: 'https://sahajcloud.test' }),
}))
vi.mock('@sentry/cloudflare', () => ({ captureMessage: vi.fn() }))
vi.mock('@/server/sahajcloud/payload-client', () => ({
  createPayloadClient: () => ({ findGlobal }),
}))
// One attempt, so no test waits on real backoff.
vi.mock('@/server/error-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/error-utils')>()),
  withRetry: (fn: () => unknown) => fn(),
}))

const { registerManifest } = await import('./route')

function get(path: string) {
  const app = new Hono<SahajCloudEnv>()

  registerManifest(app)

  return app.request(`https://wemeditate.com${path}`)
}

beforeEach(() => {
  findGlobal.mockReset()
  findGlobal.mockResolvedValue(EN_TRANSLATIONS)
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('/manifest.webmanifest', () => {
  it('serves the type the spec names, not the one `c.json` would set', async () => {
    const response = await get('/manifest.webmanifest')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/manifest+json')
  })

  it('answers in the language of the URL it was asked on', async () => {
    const manifest = await (await get('/fr/manifest.webmanifest')).json()

    expect(manifest).toMatchObject({ lang: 'fr', display: 'browser' })
    expect(manifest.name, 'the name comes from the translations').not.toMatch(/^common\./)
  })
})
