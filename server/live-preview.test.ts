import { SignJWT } from 'jose'
import { beforeAll, describe, expect, it } from 'vitest'

import { verifyLivePreviewToken } from './live-preview'

/**
 * The consumer half of a cross-repo format.
 *
 * SahajCloud mints these tokens; this repo verifies them and imports nothing
 * from there. So the format is written twice, and these cases mint with the
 * **same construction** SahajCloud's `mintLivePreviewToken` uses — an EdDSA
 * compact JWS carrying only `exp`, with no `iat`. A change on either side
 * fails here before it breaks live preview in production.
 */

const NOW = 1_800_000_000

let verifyKeyBase64: string
let otherVerifyKeyBase64: string
let sign: (exp: number) => Promise<string>

/** Web Crypto, not `jose`'s `generateKeyPair`: that returns a Node KeyObject,
 *  and the consumer imports a RAW public key, which only a CryptoKey exports. */
async function ed25519Pair() {
  return (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair
}

const rawBase64 = async (key: CryptoKey) =>
  Buffer.from(await crypto.subtle.exportKey('raw', key)).toString('base64')

beforeAll(async () => {
  const pair = await ed25519Pair()

  verifyKeyBase64 = await rawBase64(pair.publicKey)
  otherVerifyKeyBase64 = await rawBase64((await ed25519Pair()).publicKey)

  sign = (exp) =>
    new SignJWT({})
      .setProtectedHeader({ alg: 'EdDSA' })
      .setExpirationTime(exp)
      .sign(pair.privateKey)
})

describe('verifyLivePreviewToken', () => {
  it('accepts a token SahajCloud would mint', async () => {
    expect(await verifyLivePreviewToken(await sign(NOW + 600), verifyKeyBase64, NOW)).toBe(true)
  })

  it('refuses an expired token, and at the exact expiry second', async () => {
    const token = await sign(NOW)

    expect(await verifyLivePreviewToken(token, verifyKeyBase64, NOW - 1)).toBe(true)
    expect(await verifyLivePreviewToken(token, verifyKeyBase64, NOW)).toBe(false)
  })

  it('refuses a token signed by another key', async () => {
    expect(await verifyLivePreviewToken(await sign(NOW + 600), otherVerifyKeyBase64, NOW)).toBe(
      false,
    )
  })

  it('refuses a payload edited to extend the expiry', async () => {
    const token = await sign(NOW + 600)
    const [header, , signature] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ exp: NOW + 9_999_999 }), 'utf8').toString(
      'base64url',
    )

    expect(
      await verifyLivePreviewToken(`${header}.${forged}.${signature}`, verifyKeyBase64, NOW),
    ).toBe(false)
  })

  it('refuses a token whose header nominates a different algorithm', async () => {
    // The classic JWS confusion. `algorithms: ['EdDSA']` is what refuses it —
    // the header is attacker-controlled, so it cannot be allowed to choose.
    const token = await sign(NOW + 600)
    const [, payload, signature] = token.split('.')
    const header = Buffer.from(JSON.stringify({ alg: 'none' }), 'utf8').toString('base64url')

    expect(
      await verifyLivePreviewToken(`${header}.${payload}.${signature}`, verifyKeyBase64, NOW),
    ).toBe(false)
  })

  it('refuses everything when no verify key is configured', async () => {
    // An environment with no key has no live preview; it does not fall open.
    const token = await sign(NOW + 600)

    expect(await verifyLivePreviewToken(token, undefined, NOW)).toBe(false)
    expect(await verifyLivePreviewToken(token, '', NOW)).toBe(false)
  })

  it('refuses malformed input without throwing', async () => {
    for (const bad of ['', '.', 'nodot', 'a.b', 'a.b.c', '....', 'YQ.YQ.YQ']) {
      expect(await verifyLivePreviewToken(bad, verifyKeyBase64, NOW)).toBe(false)
    }
  })
})
