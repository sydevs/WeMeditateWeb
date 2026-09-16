import { beforeAll, describe, expect, it } from 'vitest'

import { previewArgs, verifyLivePreviewToken, type LivePreviewSession } from './live-preview'

/**
 * The consumer half of a cross-repo format.
 *
 * SahajCloud mints these tokens; this repo verifies them and imports nothing
 * from there. So the format is pinned in two places, and these cases mint with
 * the **same construction** SahajCloud's `mintLivePreviewToken` uses. If either
 * side changes shape, a test fails here before live preview does.
 */

const ROLE = 'wemeditate-web-client'
const NOW = 1_800_000_000

let verifyKeyBase64: string
let otherVerifyKeyBase64: string
let sign: (claims: Record<string, unknown>) => Promise<string>

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair

  verifyKeyBase64 = Buffer.from(await crypto.subtle.exportKey('raw', pair.publicKey)).toString(
    'base64',
  )

  const other = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair

  otherVerifyKeyBase64 = Buffer.from(
    await crypto.subtle.exportKey('raw', other.publicKey),
  ).toString('base64')

  // Mirrors SahajCloud's minter: base64url(JSON(claims)) . base64url(sig over that body).
  sign = async (claims) => {
    const body = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url')
    const signature = await crypto.subtle.sign(
      'Ed25519',
      pair.privateKey,
      new TextEncoder().encode(body),
    )

    return `${body}.${Buffer.from(signature).toString('base64url')}`
  }
})

describe('verifyLivePreviewToken', () => {
  it('accepts a token minted for this site', async () => {
    const token = await sign({ role: ROLE, exp: NOW + 600 })

    expect(await verifyLivePreviewToken(token, verifyKeyBase64, NOW)).toBe(true)
  })

  it('refuses a token minted for the atlas client', async () => {
    // One leaked preview URL must not unlock both surfaces.
    const token = await sign({ role: 'sahaj-atlas-client', exp: NOW + 600 })

    expect(await verifyLivePreviewToken(token, verifyKeyBase64, NOW)).toBe(false)
  })

  it('refuses an expired token, including at the exact expiry second', async () => {
    const token = await sign({ role: ROLE, exp: NOW })

    expect(await verifyLivePreviewToken(token, verifyKeyBase64, NOW - 1)).toBe(true)
    expect(await verifyLivePreviewToken(token, verifyKeyBase64, NOW)).toBe(false)
  })

  it('refuses claims edited to extend the expiry', async () => {
    const token = await sign({ role: ROLE, exp: NOW + 600 })
    const forged = Buffer.from(JSON.stringify({ role: ROLE, exp: NOW + 9_999_999 })).toString(
      'base64url',
    )

    expect(
      await verifyLivePreviewToken(`${forged}.${token.split('.')[1]}`, verifyKeyBase64, NOW),
    ).toBe(false)
  })

  it('refuses a token signed by another key', async () => {
    const token = await sign({ role: ROLE, exp: NOW + 600 })

    expect(await verifyLivePreviewToken(token, otherVerifyKeyBase64, NOW)).toBe(false)
  })

  it('refuses everything when no verify key is configured', async () => {
    // An environment with no key has no live preview — it does not fall open.
    const token = await sign({ role: ROLE, exp: NOW + 600 })

    expect(await verifyLivePreviewToken(token, undefined, NOW)).toBe(false)
    expect(await verifyLivePreviewToken(token, '', NOW)).toBe(false)
  })

  it('refuses malformed input without throwing', async () => {
    for (const bad of ['', '.', 'nodot', 'a.b', '....', 'YQ.YQ']) {
      expect(await verifyLivePreviewToken(bad, verifyKeyBase64, NOW)).toBe(false)
    }
  })
})

describe('previewArgs', () => {
  const session = (over: Partial<LivePreviewSession> = {}): LivePreviewSession => ({
    active: true,
    scope: null,
    token: 'tok',
    ...over,
  })

  it('asks for drafts when the panel is editing this read', () => {
    expect(previewArgs(session())).toEqual({ preview: true, previewToken: 'tok' })
    expect(previewArgs(session({ scope: 'wm-web-translations' }), 'wm-web-translations')).toEqual({
      preview: true,
      previewToken: 'tok',
    })
  })

  /**
   * ⚠ The whole reason the scope exists. A translations preview must leave the
   * page itself PUBLISHED, so a translator sees their strings on the real
   * article rather than on someone else's unsaved draft — and a page preview
   * must not hand drafts to the translations read either.
   */
  it('refuses when the panel is editing something else', () => {
    expect(previewArgs(session({ scope: 'wm-web-translations' }))).toEqual({
      preview: false,
      previewToken: undefined,
    })
    expect(previewArgs(session(), 'wm-web-translations')).toEqual({
      preview: false,
      previewToken: undefined,
    })
  })

  it('sends no token off-preview, and none where preview is refused', () => {
    expect(previewArgs(session({ active: false }))).toEqual({
      preview: false,
      previewToken: undefined,
    })
    expect(previewArgs(session({ token: null }))).toEqual({
      preview: true,
      previewToken: undefined,
    })
  })
})
