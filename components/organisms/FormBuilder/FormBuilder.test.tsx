import { afterEach, describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FormBuilder } from './FormBuilder'
import type { EmbeddedForm } from '../../../server/cms-types'

/**
 * The implementation, not the barrel. `index.tsx` wraps this in `ClientOnly`,
 * so the markup below is what a visitor gets after hydration; the barrel's
 * server-side fallback is asserted in `RichText.test.tsx`.
 *
 * `useEffect` does not run under `renderToStaticMarkup`, so the captcha here
 * is an empty container — which is exactly the unsolved state the submit gate
 * keys on.
 *
 * The fixture is `satisfies EmbeddedForm`, so it is checked against the fields
 * an embedded `forms` relationship actually returns.
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
} satisfies EmbeddedForm

// `siteKey` defaults to `PUBLIC__TURNSTILE_SITE_KEY`, and `.env.example` tells
// a developer to set it. So the unconfigured case is stubbed rather than
// assumed, or the assertion below passes or fails by whose machine it runs on.
afterEach(() => {
  vi.unstubAllEnvs()
})

describe('FormBuilder', () => {
  it('renders the authored title, fields and button label', () => {
    const html = renderToStaticMarkup(<FormBuilder form={form} />)

    expect(html).toContain('Write to us')
    expect(html).toContain('Your email')
    expect(html).toContain('type="email"')
    expect(html).toContain('<textarea')
    expect(html).toContain('Send message')
  })

  it('renders nothing for a form with no fields', () => {
    expect(renderToStaticMarkup(<FormBuilder form={{ ...form, fields: [] }} />)).toBe('')
  })

  it('spans an authored width from sm up, and full width below it', () => {
    const wide = { ...form, fields: [{ ...form.fields[0], width: 50 }] } satisfies EmbeddedForm
    const html = renderToStaticMarkup(<FormBuilder form={wide} />)

    // A literal class, so Tailwind's scanner emits the CSS. The grid itself is
    // single-column until sm.
    expect(html).toContain('sm:col-span-6')
    expect(html).toContain('grid-cols-1')
  })

  it('leaves submit enabled with an unsolved captcha, and with none', () => {
    // A blocked or unreachable challenge.cloudflare.com never yields a token,
    // so a button that waited for one would dead-end with nothing saying why.
    // The refusal path shows the error instead. `disabled:` appears in the
    // button's Tailwind classes, so the attribute is what to match.
    vi.stubEnv('PUBLIC__TURNSTILE_SITE_KEY', '')
    expect(renderToStaticMarkup(<FormBuilder form={form} />)).not.toContain('disabled=""')

    const withCaptcha = renderToStaticMarkup(
      <FormBuilder form={form} siteKey="1x00000000000000000000AA" />
    )

    expect(withCaptcha).not.toContain('disabled=""')
  })
})
