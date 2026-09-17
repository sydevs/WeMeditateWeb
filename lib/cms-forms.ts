/**
 * The authored `forms` document, turned into what `FormBuilder` renders and
 * what the unified intake accepts.
 *
 * Two shapes meet here and neither is negotiable. The CMS side is the
 * form-builder plugin's: localized labels, a percentage `width`, a Lexical
 * document for a `message` block, and `actionType` deciding delivery. The
 * component side is `FormBuilderConfig`: a flat field list of plain values.
 * Everything pure lives here so the whole matrix is testable without
 * rendering.
 *
 * The wire contract is SahajCloud's `user-submissions` create
 * (sydevs/SahajCloud#695): `type` comes from the form's `actionType`,
 * `senderEmail` is a real column lifted out of the authored email field, and
 * `submissionData` carries the flat remainder as `[{ field, value }]` text
 * pairs. Only the keys the collection allows may appear in it — the base
 * context set, the type's own, and whatever the form's author named — so a
 * pair invented here comes back as a 400 naming the key.
 */

import { lexicalDocumentText } from './lexical-text'
import { isSafeNavigationUrl } from './urls'
import type { EmbeddedForm } from '../server/cms-types'
import type {
  FormBuilderConfig,
  FormBuilderField,
  FormBuilderSubmission,
} from '../components/organisms/FormBuilder/FormBuilder'

/**
 * The same-origin route a form posts to. The browser cannot post to the CMS
 * itself: the create needs `SAHAJCLOUD_API_KEY`, a server-only secret.
 */
export const SUBMISSION_PATH = '/api/submissions'

/**
 * ⚠ The captcha token travels as a header, not as document data, because the
 * CMS write guard reads it off the request (`x-turnstile-token`) on the
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

/** One entry of the plugin's authored field list. */
type FormField = NonNullable<EmbeddedForm['fields']>[number]

/**
 * The `FormBuilder` block type for an authored one.
 *
 * `country` and `state` render as text inputs. The plugin picks them from its
 * own bundled option lists, which this repo does not mirror and the API read
 * does not return; a typed answer still submits the pair the collection
 * expects, where rendering nothing would drop a required field and fail the
 * submission server-side.
 */
function blockTypeOf(field: FormField): FormBuilderField['blockType'] {
  switch (field.blockType) {
    case 'country':
    case 'state':
      return 'text'
    default:
      return field.blockType
  }
}

/** The authored field list, as `FormBuilder` takes it. */
function formFields(form: EmbeddedForm): FormBuilderField[] {
  return (form.fields ?? []).map((field) => {
    if (field.blockType === 'message') {
      return {
        // A message block carries no `name`, so the list key falls back to the
        // block's own id.
        name: field.id ?? 'message',
        blockType: 'message',
        label: '',
        message: lexicalDocumentText(field.message),
      }
    }

    const options = 'options' in field ? field.options : null
    const placeholder = 'placeholder' in field ? field.placeholder : null
    const defaultValue = 'defaultValue' in field ? field.defaultValue : null

    return {
      name: field.name,
      blockType: blockTypeOf(field),
      // An author who left the label blank gets the field's own name, which is
      // the only other thing they wrote.
      label: field.label ?? field.name,
      required: field.required ?? undefined,
      ...(field.width != null ? { width: field.width } : {}),
      ...(defaultValue != null ? { defaultValue } : {}),
      ...(placeholder ? { placeholder } : {}),
      ...(options ? { options: options.map(({ label, value }) => ({ label, value })) } : {}),
    }
  })
}

/**
 * The authored form as a `FormBuilder` config, or `null` when it has no
 * fields.
 *
 * A bare relationship id (an unresolvable reference) never reaches here — the
 * caller degrades first, the way every other embedded document does.
 */
export function cmsFormConfig(form: EmbeddedForm): FormBuilderConfig | null {
  const fields = formFields(form)

  if (fields.length === 0) return null

  const redirectUrl = form.confirmationType === 'redirect' ? form.redirect?.url : undefined
  // ⚠ The scheme is checked here, and nowhere else on the path.
  // `FormBuilder` assigns this to `window.location.href`, so an authored
  // `javascript:` URL would run in our origin on every successful
  // submission. `forms.redirect.url` is a plain CMS text field with no
  // upstream validation. A refused URL simply leaves the form showing its
  // confirmation message instead.
  const redirect =
    redirectUrl && isSafeNavigationUrl(redirectUrl) ? { url: redirectUrl } : undefined

  return {
    id: String(form.id),
    title: form.title,
    fields,
    submitButtonLabel: form.submitButtonLabel ?? undefined,
    confirmationMessage: lexicalDocumentText(form.confirmationMessage),
    ...(redirect ? { redirect } : {}),
  }
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
 * The create body for one submission.
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
  submission,
  locale,
  path,
}: {
  form: EmbeddedForm
  submission: FormBuilderSubmission
  locale: string
  path?: string
}): SubmissionBody {
  const emailField = emailFieldName(form)
  const pairs: SubmissionPair[] = []
  const authored = new Set<string>()
  let senderEmail: string | undefined

  for (const { field, value } of submission.submissionData) {
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
    // The form's own numeric id, never the string FormBuilder echoes back.
    form: form.id,
    type: form.actionType,
    ...(senderEmail ? { senderEmail } : {}),
    submissionData: pairs,
  }
}
