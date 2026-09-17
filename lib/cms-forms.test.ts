import { describe, it, expect } from 'vitest'
import { cmsFormConfig, submissionBody } from './cms-forms'
import type { EmbeddedForm } from '../server/cms-types'

/**
 * The fixture is typed `satisfies EmbeddedForm`, so it is checked against the
 * fields an embedded `forms` relationship actually returns — which is tied to
 * `EMBEDDED_FORM_SELECT` in `server/cms-client.ts`. A field renamed upstream,
 * or dropped from that select, fails `tsc` here instead of passing a test that
 * describes a form the read no longer produces.
 */

/** A Lexical document holding one paragraph of text. */
function lexical(text: string) {
  return {
    root: {
      type: 'root',
      children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text }] }],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

const contactForm = {
  id: 12,
  title: 'Contact us',
  actionType: 'contact',
  submitButtonLabel: 'Send it',
  confirmationType: 'message',
  confirmationMessage: lexical('We will be in touch.'),
  fields: [
    { blockType: 'text', name: 'name', label: 'Your name', required: true, width: 50 },
    { blockType: 'email', name: 'email', label: 'Your email', required: true, width: 50 },
    { blockType: 'country', name: 'country', label: 'Country' },
    {
      blockType: 'select',
      name: 'topic',
      label: 'Topic',
      placeholder: 'Pick one',
      options: [
        { label: 'Classes', value: 'classes' },
        { label: 'Other', value: 'other' },
      ],
    },
    { blockType: 'checkbox', name: 'newsletter', label: 'Keep me posted', defaultValue: false },
    { blockType: 'message', id: 'block-1', message: lexical('We reply within a week.') },
    { blockType: 'textarea', name: 'message', label: 'Message', required: true },
  ],
} satisfies EmbeddedForm

function field(form: EmbeddedForm, name: string) {
  return cmsFormConfig(form)?.fields.find((candidate) => candidate.name === name)
}

describe('cmsFormConfig', () => {
  it('renders country as a text input, because the option list is not mirrored here', () => {
    expect(field(contactForm, 'country')?.blockType).toBe('text')
  })

  it('passes the authored percentage width through as a number', () => {
    // The percentage is the editor's unit. Turning it into a layout class is
    // FormBuilder's business, not this module's.
    expect(field(contactForm, 'name')?.width).toBe(50)
    expect(field(contactForm, 'message')?.width).toBeUndefined()
  })

  it('flattens the message block and the confirmation to plain text', () => {
    const config = cmsFormConfig(contactForm)

    expect(config?.confirmationMessage).toBe('We will be in touch.')
    expect(config?.fields.find((f) => f.blockType === 'message')?.message).toBe(
      'We reply within a week.',
    )
  })

  it('keeps the authored select options and placeholder', () => {
    expect(field(contactForm, 'topic')?.options).toEqual([
      { label: 'Classes', value: 'classes' },
      { label: 'Other', value: 'other' },
    ])
    expect(field(contactForm, 'topic')?.placeholder).toBe('Pick one')
  })

  it('falls back to the field name when the author left the label blank', () => {
    const config = cmsFormConfig({ ...contactForm, fields: [{ blockType: 'text', name: 'city' }] })

    expect(config?.fields[0].label).toBe('city')
  })

  it('takes a redirect only when the form confirms by redirecting', () => {
    const redirecting = cmsFormConfig({
      ...contactForm,
      confirmationType: 'redirect',
      redirect: { url: '/thanks' },
    })
    const messaging = cmsFormConfig({ ...contactForm, redirect: { url: '/thanks' } })

    expect(redirecting?.redirect).toEqual({ url: '/thanks' })
    expect(messaging?.redirect).toBeUndefined()
  })

  it('refuses a redirect the browser must not be sent to, whatever the CMS authored', () => {
    // FormBuilder assigns this to `window.location.href`, and
    // `forms.redirect.url` is a plain CMS text field with no upstream
    // validation. A refused URL leaves the form showing its confirmation
    // message. The gate is the scheme — an editor may send a visitor
    // off-site, but not run code in this origin.
    const refused = ['javascript:alert(1)', 'data:text/html,<script>x</script>', 'not a url']

    for (const url of refused) {
      const config = cmsFormConfig({
        ...contactForm,
        confirmationType: 'redirect',
        redirect: { url },
      })

      expect(config?.redirect, url).toBeUndefined()
    }
  })

  it('keeps a redirect an editor would actually write', () => {
    for (const url of ['/thank-you', 'https://wemeditate.com/thanks']) {
      const config = cmsFormConfig({
        ...contactForm,
        confirmationType: 'redirect',
        redirect: { url },
      })

      expect(config?.redirect, url).toEqual({ url })
    }
  })

  it('returns null for a form with no fields, so the caller degrades', () => {
    expect(cmsFormConfig({ ...contactForm, fields: [] })).toBeNull()
  })
})

describe('submissionBody', () => {
  function body(data: Record<string, string | boolean | number>, form: EmbeddedForm = contactForm) {
    return submissionBody({
      form,
      submission: {
        form: '12',
        submissionData: Object.entries(data).map(([field, value]) => ({ field, value })),
      },
      locale: 'es',
      path: '/es/contacto',
    })
  }

  it('lifts the email answer to senderEmail and drops its pair', () => {
    const result = body({ name: 'Ada', email: 'ada@example.org', message: 'Hello' })

    expect(result.senderEmail).toBe('ada@example.org')
    expect(result.submissionData.map((pair) => pair.field)).not.toContain('email')
  })

  it('sends the form id as a number, and the action type as the submission type', () => {
    // A quoted id reaches the intake as an unresolvable relationship, which
    // silently empties the authored-field allow-list.
    expect(body({ email: 'ada@example.org' })).toMatchObject({ form: 12, type: 'contact' })
  })

  it('stringifies a checkbox, because the stored value is text', () => {
    expect(body({ newsletter: true, message: 'Hi' }).submissionData).toContainEqual({
      field: 'newsletter',
      value: 'true',
    })
  })

  it('drops an empty answer rather than storing a blank pair', () => {
    const pairs = body({ name: '', message: 'Hi' }).submissionData

    expect(pairs.map((pair) => pair.field)).not.toContain('name')
  })

  it('adds the locale and the page path, both base keys the intake accepts', () => {
    const pairs = body({ message: 'Hi' }).submissionData

    expect(pairs).toContainEqual({ field: 'locale', value: 'es' })
    expect(pairs).toContainEqual({ field: 'path', value: '/es/contacto' })
  })

  it('lets an author who named a field `locale` or `path` keep their answer', () => {
    // A repeated key is a 400 at the collection, so the context pairs must
    // never collide with an authored field name.
    const collidingForm = {
      ...contactForm,
      fields: [
        { blockType: 'text', name: 'locale', label: 'Which language?' },
        { blockType: 'text', name: 'path', label: 'Which route?' },
      ],
    } satisfies EmbeddedForm
    const pairs = body(
      { locale: 'Spanish', path: 'the mountain one' },
      collidingForm,
    ).submissionData

    expect(pairs).toEqual([
      { field: 'locale', value: 'Spanish' },
      { field: 'path', value: 'the mountain one' },
    ])
  })

  it('omits senderEmail when the form has no email field', () => {
    const subscribeForm = {
      ...contactForm,
      actionType: 'subscribe',
      fields: [{ blockType: 'text', name: 'name', label: 'Name' }],
    } satisfies EmbeddedForm
    const result = body({ name: 'Ada' }, subscribeForm)

    expect(result.senderEmail).toBeUndefined()
    expect(result.type).toBe('subscribe')
  })
})
