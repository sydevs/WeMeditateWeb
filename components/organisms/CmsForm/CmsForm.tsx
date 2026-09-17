import { useMemo, useState } from 'react'
import { FormBuilder, type FormBuilderSubmission } from '../FormBuilder'
import { Turnstile } from '../../molecules/Turnstile'
import { useLocale, useT } from '../../../hooks/useT'
import {
  cmsFormSpec,
  submissionBody,
  SUBMISSION_PATH,
  TURNSTILE_TOKEN_HEADER,
  type SubmissionResult,
} from '../../../lib/cms-forms'
import type { Form } from '../../../server/payload-types'

/**
 * An authored CMS form, rendered and wired to the unified intake.
 *
 * This is the one place that knows a form is a CMS document: `FormBuilder`
 * renders any form, `lib/cms-forms` translates the shapes, and this composes
 * them with the captcha and the submit call. The RichText `relationship`
 * converter renders it for a `forms` node embedded in page content.
 *
 * **Every refusal shows one message.** The intake distinguishes a failed
 * captcha from a disposable address from a key the form never declared, but
 * this site has one CMS-owned string for a failed send
 * (`forms.general.submit_error`) and a translation cannot be invented here —
 * the keys come from the CMS schema. So the code is used to decide whether to
 * re-challenge, never to pick the copy.
 */

export interface CmsFormProps {
  /** The `forms` document, populated by the page read. */
  form: Form

  /** Additional CSS classes for the form wrapper. */
  className?: string
}

export function CmsForm({ form, className }: CmsFormProps) {
  const t = useT()
  const locale = useLocale()
  const spec = useMemo(() => cmsFormSpec(form), [form])
  const [token, setToken] = useState<string | null>(null)
  // Bumped on every refusal, and used as the widget's key: a Turnstile token
  // is single-use, so a second attempt needs a fresh widget rather than the
  // spent token the first attempt sent.
  const [attempt, setAttempt] = useState(0)
  const siteKey = import.meta.env.PUBLIC__TURNSTILE_SITE_KEY

  // A form with no fields renders nothing, the way every other embedded
  // document degrades rather than showing an empty shell.
  if (!spec) return null

  const handleSubmit = async (submission: FormBuilderSubmission) => {
    const body = submissionBody({
      spec,
      submission,
      locale,
      path: typeof window === 'undefined' ? undefined : window.location.pathname,
    })

    const response = await fetch(SUBMISSION_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { [TURNSTILE_TOKEN_HEADER]: token } : {}),
      },
      body: JSON.stringify(body),
    })
    const result = (await response.json().catch(() => null)) as SubmissionResult | null

    if (response.ok && result?.ok) {
      return { success: true }
    }

    setToken(null)
    setAttempt((previous) => previous + 1)

    return { success: false, error: { message: t('forms.general.submit_error') } }
  }

  return (
    <FormBuilder
      captcha={
        siteKey ? <Turnstile key={attempt} onToken={setToken} siteKey={siteKey} /> : undefined
      }
      className={className}
      form={spec.config}
      // Until the challenge is solved the CMS would refuse the write, so the
      // button waits rather than spending a round trip to say so. With no site
      // key configured there is nothing to wait for.
      submitDisabled={Boolean(siteKey) && token == null}
      onSubmit={handleSubmit}
    />
  )
}
