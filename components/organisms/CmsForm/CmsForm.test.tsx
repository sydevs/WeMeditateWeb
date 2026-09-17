import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CmsForm } from './CmsForm'
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

  it('spans an authored width from sm up, and full width below it', () => {
    const wide = { ...form, fields: [{ ...form.fields[0], width: 50 }] } satisfies EmbeddedForm
    const html = renderToStaticMarkup(<CmsForm form={wide} />)

    // A literal class, so Tailwind's scanner emits the CSS. The grid itself is
    // single-column until sm.
    expect(html).toContain('sm:col-span-6')
    expect(html).toContain('grid-cols-1')
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
    const html = renderToStaticMarkup(<CmsForm form={form} siteKey="1x00000000000000000000AA" />)

    expect(html).toContain('disabled=""')
  })
})
