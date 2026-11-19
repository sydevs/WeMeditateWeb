// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FormBuilder } from './FormBuilder'
import { enT } from '../../../lib/i18n'
import type { EmbeddedForm } from '../../../server/sahajcloud-types'

/**
 * What a visitor's submit does: which answers reach `/api/submissions`, which
 * stop at the field, and what a refusal or a redirect leaves on screen.
 *
 * The widget is replaced by one that solves itself on mount with a token
 * numbered by mount, so a spent token and a fresh challenge are observable.
 */

const turnstile = vi.hoisted(() => ({ mounts: 0 }))

vi.mock('@marsidev/react-turnstile', async () => {
  const { useEffect } = await import('react')

  return {
    Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => {
      useEffect(() => {
        turnstile.mounts += 1
        onSuccess(`token-${turnstile.mounts}`)
      }, [onSuccess])

      return null
    },
  }
})

const SITE_KEY = '1x00000000000000000000AA'

const options = [
  { label: 'Classes', value: 'classes' },
  { label: 'Something else', value: 'other' },
]

const form = {
  id: 7,
  title: 'Write to us',
  actionType: 'contact',
  confirmationType: 'message',
  fields: [
    { blockType: 'email', name: 'email', label: 'Your email', required: true },
    { blockType: 'textarea', name: 'message', label: 'Message', required: true },
  ],
} satisfies EmbeddedForm

const fetchMock = vi.fn<typeof fetch>()

function answer(status: number, body: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

/** The one body the form posted, parsed. */
function posted() {
  expect(fetchMock).toHaveBeenCalledTimes(1)

  const [url, init] = fetchMock.mock.calls[0]

  return {
    url,
    headers: init?.headers as Record<string, string>,
    body: JSON.parse(String(init?.body)) as {
      submissionData: { field: string; value: string }[]
    },
  }
}

function fillRequired() {
  fireEvent.change(screen.getByLabelText(/Your email/), { target: { value: 'ada@example.org' } })
  fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Hello' } })
}

const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: enT('forms.general.submit') }))

beforeEach(() => {
  turnstile.mounts = 0
  fetchMock.mockReset()
  answer(200, { ok: true })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('FormBuilder — a submission', () => {
  it('posts the answers with the solved token, then thanks the visitor', async () => {
    render(<FormBuilder form={form} siteKey={SITE_KEY} />)
    fillRequired()
    submit()

    expect(await screen.findByRole('status')).toHaveProperty(
      'textContent',
      expect.stringContaining(enT('forms.general.thank_you')),
    )

    const { url, headers, body } = posted()

    expect(url).toBe('/api/submissions')
    expect(headers['x-turnstile-token']).toBe('token-1')
    expect(body).toMatchObject({ form: 7, type: 'contact', senderEmail: 'ada@example.org' })
    expect(body.submissionData).toContainEqual({ field: 'message', value: 'Hello' })
  })

  it('shows one message on a refusal, and re-challenges rather than resend a spent token', async () => {
    answer(403, { ok: false, code: 'captcha_failed' })
    render(<FormBuilder form={form} siteKey={SITE_KEY} />)
    fillRequired()
    submit()

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      enT('forms.general.submit_error'),
    )
    expect(screen.queryByText(enT('forms.general.thank_you'))).toBeNull()
    expect(turnstile.mounts).toBe(2)

    answer(200, { ok: true })
    fetchMock.mockClear()
    submit()

    await screen.findByText(enT('forms.general.thank_you'))
    expect(posted().headers['x-turnstile-token']).toBe('token-2')
  })

  it('stops at an empty required field without posting', async () => {
    render(<FormBuilder form={form} siteKey={SITE_KEY} />)
    submit()

    await screen.findByText(enT('forms.general.field_required', { field: 'Your email' }))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('FormBuilder — the redirect confirmation', () => {
  afterEach(() => {
    vi.useRealTimers()
    window.history.replaceState(null, '', '/')
  })

  // jsdom implements a fragment navigation and no other kind, so the authored
  // URL is a site path that differs from the page only by its fragment.
  it('sends the visitor to an authored redirect once the submission lands', async () => {
    const redirecting = {
      ...form,
      confirmationType: 'redirect',
      redirect: { url: '/#thanks' },
    } satisfies EmbeddedForm

    render(<FormBuilder form={redirecting} siteKey={SITE_KEY} />)
    fillRequired()
    submit()

    await waitFor(() => expect(window.location.hash).toBe('#thanks'))
    // The page is about to leave, so no thank-you replaces the form.
    expect(screen.queryByText(enT('forms.general.thank_you'))).toBeNull()
  })

  it('refuses a script URL, and shows the confirmation instead', async () => {
    const hostile = {
      ...form,
      confirmationType: 'redirect',
      redirect: { url: 'javascript:alert(1)' },
    } satisfies EmbeddedForm

    render(<FormBuilder form={hostile} siteKey={SITE_KEY} />)
    fillRequired()
    submit()

    await screen.findByText(enT('forms.general.thank_you'))
    expect(window.location.href).toBe('http://localhost:3000/')
  })
})

describe('FormBuilder — a required checkbox', () => {
  const consenting = {
    ...form,
    fields: [
      ...form.fields,
      { blockType: 'checkbox', name: 'consent', label: 'I agree', required: true },
    ],
  } satisfies EmbeddedForm

  it('stops an unticked one, and names the error on the control', async () => {
    render(<FormBuilder form={consenting} siteKey={SITE_KEY} />)
    fillRequired()
    submit()

    const error = await screen.findByText(enT('forms.general.field_required', { field: 'I agree' }))
    const checkbox = screen.getByRole('checkbox', { name: 'I agree' })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(checkbox.getAttribute('aria-invalid')).toBe('true')
    expect(error.id).not.toBe('')
    expect(checkbox.getAttribute('aria-describedby')?.split(' ')).toContain(error.id)
  })

  it('posts a ticked one', async () => {
    render(<FormBuilder form={consenting} siteKey={SITE_KEY} />)
    fillRequired()
    fireEvent.click(screen.getByRole('checkbox', { name: 'I agree' }))
    submit()

    await screen.findByText(enT('forms.general.thank_you'))
    expect(posted().body.submissionData).toContainEqual({ field: 'consent', value: 'true' })
  })
})

describe('FormBuilder — a select', () => {
  it('starts a required one on its placeholder, so an untouched one is stopped', async () => {
    const asking = {
      ...form,
      fields: [
        ...form.fields,
        { blockType: 'select', name: 'topic', label: 'Topic', required: true, options },
      ],
    } satisfies EmbeddedForm

    render(<FormBuilder form={asking} siteKey={SITE_KEY} />)

    expect(screen.getByRole<HTMLSelectElement>('combobox', { name: /Topic/ }).value).toBe('')

    fillRequired()
    submit()

    await screen.findByText(enT('forms.general.field_required', { field: 'Topic' }))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps an authored default', async () => {
    const defaulted = {
      ...form,
      fields: [
        ...form.fields,
        { blockType: 'select', name: 'topic', label: 'Topic', defaultValue: 'other', options },
      ],
    } satisfies EmbeddedForm

    render(<FormBuilder form={defaulted} siteKey={SITE_KEY} />)
    fillRequired()
    submit()

    await screen.findByText(enT('forms.general.thank_you'))
    expect(posted().body.submissionData).toContainEqual({ field: 'topic', value: 'other' })
  })
})
