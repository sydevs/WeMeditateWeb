import { afterEach, describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CmsForm } from './CmsForm'
import type { Form } from '../../../server/payload-types'

/**
 * The server render, which is what a crawler and a JS-less visitor get. The
 * captcha is absent here by construction: `useEffect` does not run under
 * `renderToStaticMarkup`, and no site key is configured under test.
 *
 * The fixture is `satisfies Form`, so it is checked against the generated CMS
 * types rather than against an idea of them.
 */

const form = {
  id: 7,
  title: 'Write to us',
  actionType: 'contact',
  submitButtonLabel: 'Send message',
  confirmationType: 'message',
  fields: [
    { blockType: 'email', name: 'email', label: 'Your email', required: true },
    { blockType: 'textarea', name: 'message', label: 'Message', required: true },
  ],
  updatedAt: '2026-09-01T00:00:00.000Z',
  createdAt: '2026-09-01T00:00:00.000Z',
} satisfies Form

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('CmsForm', () => {
  it('renders the authored title, fields and button label', () => {
    const html = renderToStaticMarkup(<CmsForm form={form} />)

    expect(html).toContain('Write to us')
    expect(html).toContain('Your email')
    expect(html).toContain('type="email"')
    expect(html).toContain('<textarea')
    expect(html).toContain('Send message')
  })

  it('renders nothing for a form with no fields', () => {
    expect(renderToStaticMarkup(<CmsForm form={{ ...form, fields: [] }} />)).toBe('')
  })

  it('leaves submit enabled when no captcha is configured', () => {
    // An unconfigured site must not present a form nobody can send. The CMS
    // refuses the write instead, which is visible rather than silent.
    // `disabled:` appears in the button's Tailwind classes, so the attribute
    // is what to match, not the word.
    const html = renderToStaticMarkup(<CmsForm form={form} />)

    expect(html).not.toContain('disabled=""')
  })

  it('holds submit until the captcha is solved when a site key is configured', () => {
    vi.stubEnv('PUBLIC__TURNSTILE_SITE_KEY', '1x00000000000000000000AA')

    const html = renderToStaticMarkup(<CmsForm form={form} />)

    expect(html).toContain('disabled=""')
  })
})
