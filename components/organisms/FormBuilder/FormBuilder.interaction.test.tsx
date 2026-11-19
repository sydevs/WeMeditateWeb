// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FormBuilder } from './FormBuilder'
import { enT } from '../../../lib/i18n'
import type { EmbeddedForm } from '../../../server/sahajcloud-types'

/**
 * What a visitor's submit does: which answers reach `/api/submissions`, which
 * stop at the field, and what a refusal or a redirect leaves on screen.
 *
 * The widget is replaced by one the test solves, with a token numbered by
 * mount, so a spent token and a fresh challenge are observable. It is solved
 * inside `act`, never on mount: the widget a refusal remounts would otherwise
 * hand over its token outside `act`, and a submit made before React commits
 * it still sends the previous render's token.
 */

const turnstile = vi.hoisted(() => ({ mounts: 0, solve: (): void => undefined }))

vi.mock('@marsidev/react-turnstile', async () => {
  const { useEffect } = await import('react')

  return {
    Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => {
      useEffect(() => {
        turnstile.mounts += 1
        const token = `token-${turnstile.mounts}`

        turnstile.solve = () => onSuccess(token)
      }, [onSuccess])

      return null
    },
  }
})

/** Solves the widget on screen, and commits its token before the test goes on. */
const solve = () => act(() => turnstile.solve())

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

/** The form, with its first challenge already solved. */
function renderForm(embedded: EmbeddedForm) {
  render(<FormBuilder form={embedded} siteKey={SITE_KEY} />)
  solve()
}

beforeEach(() => {
  turnstile.mounts = 0
  turnstile.solve = () => undefined
  fetchMock.mockReset()
  answer(200, { ok: true })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('FormBuilder — a submission', () => {
  it('posts the answers with the solved token, then thanks the visitor', async () => {
    renderForm(form)
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
    renderForm(form)
    fillRequired()
    submit()

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      enT('forms.general.submit_error'),
    )
    expect(screen.queryByText(enT('forms.general.thank_you'))).toBeNull()
    // The refusal remounted the widget, whose effect runs after that commit.
    await waitFor(() => expect(turnstile.mounts).toBe(2))

    answer(200, { ok: true })
    fetchMock.mockClear()
    solve()
    submit()

    await screen.findByText(enT('forms.general.thank_you'))
    expect(posted().headers['x-turnstile-token']).toBe('token-2')
  })

  it('stops at an empty required field without posting', async () => {
    renderForm(form)
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

    renderForm(redirecting)
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

    renderForm(hostile)
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
    renderForm(consenting)
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
    renderForm(consenting)
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

    renderForm(asking)

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

    renderForm(defaulted)
    fillRequired()
    submit()

    await screen.findByText(enT('forms.general.thank_you'))
    expect(posted().body.submissionData).toContainEqual({ field: 'topic', value: 'other' })
  })
})
