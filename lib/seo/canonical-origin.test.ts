import { describe, it, expect } from 'vitest'
import { isCanonicalOrigin } from './canonical-origin'

describe('isCanonicalOrigin', () => {
  it.each(['https://wemeditate.com', 'https://www.wemeditate.com'])(
    'allows the real site (%s)',
    (origin) => {
      expect(isCanonicalOrigin(origin)).toBe(true)
    },
  )

  it.each([
    ['a preview Worker', 'https://wemeditate-web-pr-62.workers.dev'],
    ['a preview Pages site', 'https://wemeditate-ladle.pages.dev'],
    ['local development', 'http://localhost:5173'],
    ['the IPv6 loopback, brackets and all', 'http://[::1]:5173'],
    ['a dev server bound to every interface', 'http://0.0.0.0:5173'],
    ['a dev server opened over the LAN', 'http://192.168.1.14:5173'],
    ['the same on a 10/8 network', 'http://10.0.4.7:5173'],
    ['the same on a 172.16/12 network', 'http://172.20.3.9:5173'],
  ])('refuses %s', (_label, origin) => {
    // Every PR builds these. A preview that invites crawlers competes with
    // production for the same content.
    expect(isCanonicalOrigin(origin)).toBe(false)
  })

  it('reads the host, so a port does not make a local origin the real site', () => {
    expect(isCanonicalOrigin('http://127.0.0.1:4173')).toBe(false)
  })

  it('refuses the private ranges only, so a neighbouring address still counts', () => {
    // 172.16 through 172.31 are private. 172.15 is not.
    expect(isCanonicalOrigin('https://172.15.4.4')).toBe(true)
    expect(isCanonicalOrigin('https://10.wemeditate.com')).toBe(true)
  })
})
