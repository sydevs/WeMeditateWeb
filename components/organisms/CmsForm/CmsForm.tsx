import { useMemo, useState } from 'react'
import { FormBuilder, type FormBuilderSubmission } from '../FormBuilder/FormBuilder'
import { Turnstile } from '../../molecules/Turnstile'
import { useLocale, useOptionalPageContext, useT } from '../../../hooks/useT'
import {
  cmsFormConfig,
  submissionBody,
  SUBMISSION_PATH,
  TURNSTILE_TOKEN_HEADER,
} from '../../../lib/cms-forms'
import { normalizeContentPath } from '../../../lib/urls'
import type { EmbeddedForm } from '../../../server/cms-types'

/**
 * An authored CMS form, rendered and wired to the unified intake.
 *
 * This is the one place that knows a form is a CMS document: `FormBuilder`
 * renders any form, `lib/cms-forms` translates the shapes, and this composes
 * them with the captcha and the submit call. The RichText `relationship`
 * converter renders it for a `forms` node embedded in page content.
 *
 * **Every refusal shows one message, and re-challenges.** The intake
 * distinguishes a failed captcha from a disposable address from a key the form
 * never declared, but this site has one CMS-owned string for a failed send
 * (`forms.general.submit_error`) and a translation cannot be invented here —
 * the keys come from the CMS schema. Re-challenging regardless is deliberate
 * too: see `SubmissionResult`.
 *
 * ⚠ Imported through `../FormBuilder/FormBuilder`, not the barrel, and this
 * module is itself loaded only in the browser (see `index.tsx`). Reaching it
 * through `components/organisms` would pull every other organism into the
 * code-split chunk.
 */

export interface CmsFormProps {
  /** The `forms` document, populated by the page read. */
  form: EmbeddedForm

  /**
   * The Turnstile **site** key. Unset, no captcha renders and the CMS refuses
   * the submission — which is the honest outcome of an unconfigured site.
   * @default import.meta.env.PUBLIC__TURNSTILE_SITE_KEY
   */
  siteKey?: string

  /** Additional CSS classes for the form wrapper. */
  className?: string
}

export function CmsForm({
  form,
  siteKey = import.meta.env.PUBLIC__TURNSTILE_SITE_KEY,
  className,
}: CmsFormProps) {
  const t = useT()
  const locale = useLocale()
  // The page this form sits on, from the same object the locale comes from, so
  // the two `submissionData` pairs cannot disagree. Spelled the way every
  // other consumer spells a path — `urlPathname` still carries
  // `+onBeforeRoute`'s `/index` for the home page.
  const path = normalizeContentPath(useOptionalPageContext()?.urlPathname)
  const config = useMemo(() => cmsFormConfig(form), [form])
  const [token, setToken] = useState<string | null>(null)
  // Bumped on every refusal, and used as the widget's key: a Turnstile token
  // is single-use, so a second attempt needs a fresh widget rather than the
  // spent token the first attempt sent.
  const [attempt, setAttempt] = useState(0)

  // A form with no fields renders nothing, the way every other embedded
  // document degrades rather than showing an empty shell.
  if (!config) return null

  const handleSubmit = async (submission: FormBuilderSubmission) => {
    let response: Response

    try {
      response = await fetch(SUBMISSION_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { [TURNSTILE_TOKEN_HEADER]: token } : {}),
        },
        body: JSON.stringify(submissionBody({ form, submission, locale, path })),
      })
    } catch {
      // A dropped connection may still have reached the CMS and spent the
      // token, so this re-challenges like any other failure rather than
      // letting FormBuilder catch the throw with the token intact.
      return refuse()
    }

    return response.ok ? { success: true } : refuse()
  }

  /** Every failure looks the same to the visitor, and costs a fresh challenge. */
  function refuse() {
    setToken(null)
    setAttempt((previous) => previous + 1)

    return { success: false, error: { message: t('forms.general.submit_error') } }
  }

  return (
    <FormBuilder
      captcha={
        siteKey ? (
          <Turnstile key={attempt} language={locale} siteKey={siteKey} onToken={setToken} />
        ) : undefined
      }
      className={className}
      form={config}
      onSubmit={handleSubmit}
    />
  )
}
