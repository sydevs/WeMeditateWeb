/**
 * The authored `forms` document, turned into what `FormBuilder` renders and
 * what the unified intake accepts.
 *
 * Two shapes meet here and neither is negotiable. The CMS side is the
 * form-builder plugin's: localized labels, a percentage `width`, a Lexical
 * document for a `message` block, and `actionType` deciding delivery. The
 * component side is `FormBuilderConfig`: a flat field list with Tailwind
 * widths and plain strings. Everything pure lives here so the whole matrix is
 * testable without rendering.
 *
 * The wire contract is SahajCloud's `user-submissions` create
 * (sydevs/SahajCloud#695): `type` comes from the form's `actionType`,
 * `senderEmail` is a real column lifted out of the authored email field, and
 * `submissionData` carries the flat remainder as `[{ field, value }]` text
 * pairs. Only the keys the collection allows may appear in it — the base
 * context set, the type's own, and whatever the form's author named — so a
 * pair invented here comes back as a 400 naming the key.
 */

import type { Form } from '../server/payload-types'
import type {
  FormBuilderConfig,
  FormBuilderField,
  FormBuilderSubmission,
} from '../components/organisms/FormBuilder'

/** One `[{ field, value }]` pair, as the collection stores it. */
export interface SubmissionPair {
  field: string
  value: string
}

/** The body `POST /api/user-submissions` accepts for a form-backed intake. */
export interface SubmissionBody {
  form: string
  type: Form['actionType']
  senderEmail?: string
  submissionData: SubmissionPair[]
}

/**
 * An authored form, ready to render and to submit.
 *
 * `actionType` and `emailField` travel beside the render config because the
 * submit body needs both and neither belongs in `FormBuilderConfig` — the
 * component renders forms that have nothing to do with this CMS.
 */
export interface CmsFormSpec {
  config: FormBuilderConfig
  actionType: Form['actionType']
  /** The authored field whose value becomes the `senderEmail` column. */
  emailField: string | null
}

/** A Lexical document as the CMS stores a `message` block or a confirmation. */
type LexicalDocument = { root?: { children?: unknown[] } } | null | undefined

/** One entry of the plugin's authored field list. */
type FormField = NonNullable<Form['fields']>[number]

/**
 * Tailwind widths for the plugin's percentage `width`, in buckets.
 *
 * Tailwind scans source text, so `w-[${width}%]` produces no class at all —
 * the bucket is what makes an authored width render. Every bucket is full
 * width on mobile and narrows from `sm` up.
 */
function fieldWidth(width?: number | null): string {
  if (width == null || width >= 100) return 'w-full'
  if (width <= 33) return 'w-full sm:w-1/3'
  if (width <= 50) return 'w-full sm:w-1/2'

  return 'w-full sm:w-2/3'
}

/**
 * The `FormBuilder` block type for an authored one.
 *
 * `country` and `state` render as text inputs. The plugin picks them from its
 * own bundled option lists, which this repo does not mirror; a typed answer
 * still submits the pair the collection expects, where rendering nothing would
 * drop a required field and fail the submission server-side.
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

/** The plain text of a Lexical document, or `undefined` when it has none. */
export function lexicalText(document: LexicalDocument): string | undefined {
  const text = collectText(document?.root?.children).replace(/\s+/g, ' ').trim()

  return text.length > 0 ? text : undefined
}

function collectText(nodes: unknown): string {
  if (!Array.isArray(nodes)) return ''

  return nodes
    .map((node) => {
      if (node == null || typeof node !== 'object') return ''
      const candidate = node as { text?: unknown; children?: unknown }

      if (typeof candidate.text === 'string') return candidate.text

      return `${collectText(candidate.children)} `
    })
    .join('')
}

/** The authored field list, as `FormBuilder` takes it. */
function formFields(form: Form): FormBuilderField[] {
  return (form.fields ?? []).map((field) => {
    if (field.blockType === 'message') {
      return {
        // A message block carries no `name`, so the list key falls back to the
        // block's own id.
        name: field.id ?? 'message',
        blockType: 'message',
        label: '',
        message: lexicalText(field.message),
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
      width: fieldWidth(field.width),
      ...(defaultValue != null ? { defaultValue } : {}),
      ...(placeholder ? { placeholder } : {}),
      ...(options ? { options: options.map(({ label, value }) => ({ label, value })) } : {}),
    }
  })
}

/**
 * The authored form as a renderable spec, or `null` when it has no fields.
 *
 * A bare relationship id (an unpublished or unresolvable reference) never
 * reaches here — the caller degrades first, the way every other embedded
 * document does.
 */
export function cmsFormSpec(form: Form): CmsFormSpec | null {
  const fields = formFields(form)

  if (fields.length === 0) return null

  const redirectUrl = form.confirmationType === 'redirect' ? form.redirect?.url : undefined

  return {
    config: {
      id: String(form.id),
      title: form.title,
      fields,
      submitButtonLabel: form.submitButtonLabel ?? undefined,
      confirmationMessage: lexicalText(form.confirmationMessage),
      ...(redirectUrl ? { redirect: { url: redirectUrl } } : {}),
    },
    actionType: form.actionType,
    emailField: form.fields?.find((field) => field.blockType === 'email')?.name ?? null,
  }
}

/**
 * A submitted value as the collection stores it: one text pair, or nothing.
 *
 * `value` is a textarea upstream, so a checkbox arrives as `'true'` / `'false'`
 * and `parseOptIn` reads the first as yes. An empty answer is dropped rather
 * than stored as a blank pair, which keeps the entry count under the
 * collection's cap and the admin list readable.
 */
function pairValue(value: unknown): string | null {
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null
  if (typeof value !== 'string') return null

  return value.length > 0 ? value : null
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
 * exempt from the collection's URL scan — a form on `/en/contact` legitimately
 * names the page it was sent from.
 */
export function submissionBody({
  spec,
  submission,
  locale,
  path,
}: {
  spec: CmsFormSpec
  submission: FormBuilderSubmission
  locale: string
  path?: string
}): SubmissionBody {
  const pairs: SubmissionPair[] = []
  let senderEmail: string | undefined

  for (const { field, value } of submission.submissionData) {
    const text = pairValue(value)

    if (text == null) continue

    if (field === spec.emailField) {
      senderEmail = text
      continue
    }

    pairs.push({ field, value: text })
  }

  pairs.push({ field: 'locale', value: locale })

  if (path) pairs.push({ field: 'path', value: path })

  return {
    form: submission.form,
    type: spec.actionType,
    ...(senderEmail ? { senderEmail } : {}),
    submissionData: pairs,
  }
}
