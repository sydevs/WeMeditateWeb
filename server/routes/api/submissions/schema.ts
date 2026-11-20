/**
 * What `POST /api/submissions` accepts, checked before SahajCloud is called.
 */

import { z } from 'zod'

/**
 * ⚠ The loosest bounds SahajCloud allows (`src/collections/UserSubmissions/
 * submissionData.ts`: 40 entries, 100-character keys, and 5000 for its
 * longest-valued key), in characters. `email` is not one of them: it is
 * RFC 5321's longest address.
 */
const SUBMISSION_BOUNDS = { entries: 40, field: 100, value: 5000, email: 254 } as const

/**
 * One submission the same-origin forms route will forward to SahajCloud.
 *
 * ⚠ The bounds are a cheap refusal at the edge, never the enforcement — the
 * collection re-checks every one per type, per key, against the fields the
 * form's author declared, which only it knows.
 *
 * ⚠ `form` is a **number**. A quoted id reaches the intake as an unresolvable
 * relationship; `SubmissionBody` in `lib/submissions.ts` states what that costs.
 *
 * `type` is narrowed to the two form-backed intakes. Registrations and event
 * proposals are the atlas widget's, and neither carries a `form`.
 */
export const submissionSchema = z.object({
  form: z.number().int().positive('Form must be a document id'),
  type: z.enum(['contact', 'subscribe']),
  senderEmail: z
    .email('Sender email must be an email address')
    .max(SUBMISSION_BOUNDS.email)
    .optional(),
  submissionData: z
    .array(
      z.object({
        field: z.string().min(1).max(SUBMISSION_BOUNDS.field),
        value: z.string().max(SUBMISSION_BOUNDS.value),
      }),
    )
    .max(SUBMISSION_BOUNDS.entries),
})

/**
 * The most bytes a submission's request body may carry before the route
 * refuses it unread.
 *
 * Six bytes a character is `JSON.stringify`'s worst case (a control character
 * becomes `\u001f`), and 4 KiB covers the JSON around the strings, so no body
 * `submissionSchema` accepts is refused for its size. The bound only stops a
 * body the schema would refuse anyway from being buffered and parsed first.
 */
export const SUBMISSION_BODY_LIMIT =
  6 *
    (SUBMISSION_BOUNDS.entries * (SUBMISSION_BOUNDS.field + SUBMISSION_BOUNDS.value) +
      SUBMISSION_BOUNDS.email) +
  4096

