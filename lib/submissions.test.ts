import { describe, it, expect } from 'vitest'
import { submissionBody } from './submissions'
import type { EmbeddedForm } from '../server/sahajcloud-types'

/**
 * The fixture is typed `satisfies EmbeddedForm`, so it is checked against the
 * fields an embedded `forms` relationship actually returns — which is tied to
 * `EMBEDDED_FORM_SELECT` in `server/sahajcloud-client.ts`. A field renamed upstream,
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

describe('submissionBody', () => {
  function body(data: Record<string, string | boolean | number>, form: EmbeddedForm = contactForm) {
    return submissionBody({
      form,
      answers: data,
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
