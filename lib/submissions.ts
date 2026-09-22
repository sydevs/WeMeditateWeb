/**
 * The wire contract for SahajCloud's unified `user-submissions` intake
 * (sydevs/SahajCloud#695).
 *
 * `type` comes from the form's `actionType`, `senderEmail` is a real column
 * lifted out of the authored email field, and `submissionData` carries the
 * flat remainder as `[{ field, value }]` text pairs. Only the keys the
 * collection allows may appear in it — the base context set, the type's own,
 * and whatever the form's author named — so a pair invented here comes back
 * as a 400 naming the key.
 *
 * Pure, so the whole matrix is testable without rendering.
 */

import type { EmbeddedForm } from '../server/sahajcloud-types'

/**
 * The same-origin route a form posts to. The browser cannot post to SahajCloud
 * itself: the create needs `SAHAJCLOUD_API_KEY`, a server-only secret.
 */
export const SUBMISSION_PATH = '/api/submissions'

/**
 * ⚠ The captcha token travels as a header, not as document data, because the
 * SahajCloud write guard reads it off the request (`x-turnstile-token`) on the
 * built-in create endpoint. Renaming it here breaks every submission.
 */
export const TURNSTILE_TOKEN_HEADER = 'x-turnstile-token'

/** One `[{ field, value }]` pair, as the collection stores it. */
export interface SubmissionPair {
  field: string
  value: string
}

/**
 * The body `POST /api/user-submissions` accepts for a form-backed intake.
 *
 * ⚠ `form` is a **number**, and the string a JSON body makes so easy is not
 * interchangeable. SahajCloud reads the relationship with `relationId()`,
 * which answers `null` for a string — so a quoted id leaves the intake unable
 * to load the form, which silently empties the authored-field allow-list
 * (every field the author named is then refused as unknown), skips the
 * `actionType`-versus-`type` guard, and blanks the admin subject line.
 */
export interface SubmissionBody {
  form: number
  type: EmbeddedForm['actionType']
  senderEmail?: string
  submissionData: SubmissionPair[]
}

/**
 * What the same-origin route answers.
 *
 * `code` is the intake's own refusal code, forwarded for a developer reading
 * the network tab. **The form deliberately does not branch on it.** Whether
 * the captcha token was spent depends on where upstream refused — the write
 * guard verifies it after the cheap content checks and before the collection's
 * own — so re-challenging on every refusal is the only rule that cannot be
 * wrong, and it costs one invisible challenge.
 */
export interface SubmissionResult {
  ok: boolean
  code?: string
}

/**
 * The authored field whose answer becomes the `senderEmail` column.
 *
 * ⚠ The sender's name is not matched this way. `prepareUserSubmission`
 * upstream reads the literal key `name`, and the plugin has no name block
 * type to match on instead — so a field called `fullName` leaves the `users`
 * row named off the email's local part, on first contact and for good.
 * Documented for authors in `components/organisms/FormBuilder/README.md`.
 */
function emailFieldName(form: EmbeddedForm): string | undefined {
  return form.fields?.find((field) => field.blockType === 'email')?.name
}

/**
 * A submitted value as the collection stores it: one text pair, or nothing.
 *
 * `value` is a textarea upstream, so a checkbox arrives as `'true'` / `'false'`
 * and `parseOptIn` reads the first as yes. An empty answer is dropped rather
 * than stored as a blank pair, which keeps the entry count under the
 * collection's cap and the admin list readable.
 */
function pairValue(value: string | boolean | number): string | null {
  if (typeof value === 'number' && !Number.isFinite(value)) return null
  const text = String(value)

  return text.length > 0 ? text : null
}

/**
 * The create body for one submission, from the form and the answers keyed by
 * field name.
 *
 * The email field's answer is lifted to `senderEmail` and its pair dropped:
 * the column is what screening, delivery and the sender's cross-intake history
 * all read, and duplicating it into the blob would put the same address in two
 * places that can disagree.
 *
 * `locale` and `path` are two of the base keys every type accepts, and both are
 * exempt from the collection's URL scan — a form on `/en/contact`
 * legitimately names the page it was sent from.
 */
export function submissionBody({
  form,
  answers,
  locale,
  path,
}: {
  form: EmbeddedForm
  answers: Record<string, string | boolean | number>
  locale: string
  path?: string
}): SubmissionBody {
  const emailField = emailFieldName(form)
  const pairs: SubmissionPair[] = []
  const authored = new Set<string>()
  let senderEmail: string | undefined

  for (const [field, value] of Object.entries(answers)) {
    const text = pairValue(value)

    if (text == null) continue

    if (field === emailField) {
      senderEmail = text
      continue
    }

    authored.add(field)
    pairs.push({ field, value: text })
  }

  // The author's own field wins a name collision. A repeated key is a 400 at
  // the collection, so an author who names a field `locale` or `path` must not
  // have their form broken by the context we add.
  if (!authored.has('locale')) pairs.push({ field: 'locale', value: locale })

  if (path && !authored.has('path')) pairs.push({ field: 'path', value: path })

  return {
    // The form's own numeric id, never a string.
    form: form.id,
    type: form.actionType,
    ...(senderEmail ? { senderEmail } : {}),
    submissionData: pairs,
  }
}
