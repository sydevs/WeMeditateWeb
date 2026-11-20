import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSahajCloudContext, type SahajCloudEnv } from './sahajcloud-context'

const CLOUD = 'https://cloud.sydevelopers.com'

beforeEach(() => {
  vi.stubEnv('PUBLIC__SAHAJCLOUD_URL', CLOUD)
  vi.stubEnv('SAHAJCLOUD_API_KEY', 'build-key')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getSahajCloudContext', () => {
  it('reads the base URL the build embedded', () => {
    expect(getSahajCloudContext()).toEqual({ apiKey: 'build-key', baseURL: CLOUD })
  })

  it('falls back to a local SahajCloud in development only', () => {
    vi.stubEnv('PUBLIC__SAHAJCLOUD_URL', '')
    vi.stubEnv('DEV', true)
    expect(getSahajCloudContext().baseURL).toBe('http://localhost:3000')
  })

  it('refuses a production build that names no SahajCloud, saying which variable', () => {
    vi.stubEnv('PUBLIC__SAHAJCLOUD_URL', '')
    vi.stubEnv('DEV', false)
    expect(() => getSahajCloudContext()).toThrow(
      'SahajCloud context validation failed: baseURL: PUBLIC__SAHAJCLOUD_URL is not set in this build',
    )
  })

  it('refuses a base URL that is not a URL', () => {
    vi.stubEnv('PUBLIC__SAHAJCLOUD_URL', 'cloud.sydevelopers.com')
    expect(() => getSahajCloudContext()).toThrow('baseURL: Base URL must be a valid URL')
  })

  it('refuses a missing API key', () => {
    vi.stubEnv('SAHAJCLOUD_API_KEY', '')
    expect(() => getSahajCloudContext()).toThrow('apiKey: ')
  })

  it('prefers the Worker secret over the build env inside a request', async () => {
    const app = new Hono<SahajCloudEnv>()
      .use(contextStorage())
      .get('/', (c) => c.json(getSahajCloudContext()))
    const response = await app.request('/', {}, { SAHAJCLOUD_API_KEY: 'worker-key' })

    expect(await response.json()).toEqual({ apiKey: 'worker-key', baseURL: CLOUD })
  })
})
