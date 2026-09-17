import { describe, it, expect } from 'vitest'
import { cmsFormSpec, lexicalText, submissionBody } from './cms-forms'
import type { Form } from '../server/payload-types'

/**
 * The fixture is typed `satisfies Form`, so it is checked against the
 * generated CMS types rather than against an idea of them — a field renamed
 * upstream fails `tsc` here instead of passing a test that describes a form
 * the CMS no longer produces.
 */

/** A Lexical document holding one paragraph of text. */
function lexical(text: string) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', version: 1, text }],
        },
      ],
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
  updatedAt: '2026-09-01T00:00:00.000Z',
  createdAt: '2026-09-01T00:00:00.000Z',
} satisfies Form

describe('lexicalText', () => {
  it('flattens a Lexical document to one line of text', () => {
    expect(lexicalText(lexical('Thank you.'))).toBe('Thank you.')
  })

  it('returns undefined for an empty or missing document', () => {
    expect(lexicalText(null)).toBeUndefined()
    expect(lexicalText(lexical('   '))).toBeUndefined()
  })
})

describe('cmsFormSpec', () => {
  it('carries the action type and the email field beside the render config', () => {
    const spec = cmsFormSpec(contactForm)

    expect(spec?.actionType).toBe('contact')
    expect(spec?.emailField).toBe('email')
  })

  it('renders country as a text input, because the option list is not mirrored here', () => {
    const country = cmsFormSpec(contactForm)?.config.fields.find((f) => f.name === 'country')

    expect(country?.blockType).toBe('text')
  })

  it('buckets the authored percentage width into a mobile-first Tailwind class', () => {
    const fields = cmsFormSpec(contactForm)?.config.fields ?? []

    expect(fields.find((f) => f.name === 'name')?.width).toBe('w-full sm:w-1/2')
    // An unset width is full width, not a missing class.
    expect(fields.find((f) => f.name === 'message')?.width).toBe('w-full')
  })

  it('flattens the message block and the confirmation to plain text', () => {
    const spec = cmsFormSpec(contactForm)

    expect(spec?.config.confirmationMessage).toBe('We will be in touch.')
    expect(spec?.config.fields.find((f) => f.blockType === 'message')?.message).toBe(
      'We reply within a week.',
    )
  })

  it('keeps the authored select options', () => {
    const topic = cmsFormSpec(contactForm)?.config.fields.find((f) => f.name === 'topic')

    expect(topic?.options).toEqual([
      { label: 'Classes', value: 'classes' },
      { label: 'Other', value: 'other' },
    ])
    expect(topic?.placeholder).toBe('Pick one')
  })

  it('falls back to the field name when the author left the label blank', () => {
    const spec = cmsFormSpec({ ...contactForm, fields: [{ blockType: 'text', name: 'city' }] })

    expect(spec?.config.fields[0].label).toBe('city')
  })

  it('takes a redirect only when the form confirms by redirecting', () => {
    const redirecting = cmsFormSpec({
      ...contactForm,
      confirmationType: 'redirect',
      redirect: { url: '/thanks' },
    })
    const messaging = cmsFormSpec({ ...contactForm, redirect: { url: '/thanks' } })

    expect(redirecting?.config.redirect).toEqual({ url: '/thanks' })
    expect(messaging?.config.redirect).toBeUndefined()
  })

  it('returns null for a form with no fields, so the caller degrades', () => {
    expect(cmsFormSpec({ ...contactForm, fields: [] })).toBeNull()
  })
})

describe('submissionBody', () => {
  const spec = cmsFormSpec(contactForm)!

  function body(data: Record<string, string | boolean | number>) {
    return submissionBody({
      spec,
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

  it('sends the form id and the action type as the submission type', () => {
    expect(body({ email: 'ada@example.org' })).toMatchObject({ form: '12', type: 'contact' })
  })

  it('stringifies a checkbox, because the stored value is text', () => {
    const pairs = body({ newsletter: true, message: 'Hi' }).submissionData

    expect(pairs).toContainEqual({ field: 'newsletter', value: 'true' })
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

  it('omits senderEmail when the form has no email field', () => {
    const noEmail = cmsFormSpec({
      ...contactForm,
      actionType: 'subscribe',
      fields: [{ blockType: 'text', name: 'name', label: 'Name' }],
    })!
    const result = submissionBody({
      spec: noEmail,
      submission: { form: '12', submissionData: [{ field: 'name', value: 'Ada' }] },
      locale: 'en',
    })

    expect(result.senderEmail).toBeUndefined()
    expect(result.type).toBe('subscribe')
  })
})
