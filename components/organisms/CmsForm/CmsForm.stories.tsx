import type { Story, StoryDefault } from '@ladle/react'
import { CmsForm } from './CmsForm'
import { cmsFormSpec, submissionBody } from '../../../lib/cms-forms'
import { StoryWrapper, StorySection } from '../../ladle'
import type { Form } from '../../../server/payload-types'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/** A Lexical document holding one paragraph. */
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

/** The two fixtures are `satisfies Form`, so they cannot drift from the CMS types. */
const contactForm = {
  id: 1,
  title: 'Write to us',
  actionType: 'contact',
  submitButtonLabel: 'Send message',
  confirmationType: 'message',
  confirmationMessage: lexical('Thank you — we read every message.'),
  fields: [
    { blockType: 'text', name: 'name', label: 'Your name', required: true, width: 50 },
    { blockType: 'email', name: 'email', label: 'Your email', required: true, width: 50 },
    { blockType: 'message', id: 'note', message: lexical('We usually reply within a week.') },
    { blockType: 'textarea', name: 'message', label: 'Message', required: true },
  ],
  updatedAt: '2026-09-01T00:00:00.000Z',
  createdAt: '2026-09-01T00:00:00.000Z',
} satisfies Form

const subscribeForm = {
  id: 2,
  title: 'Monthly letter',
  actionType: 'subscribe',
  confirmationType: 'message',
  confirmationMessage: lexical('Check your inbox to confirm.'),
  fields: [{ blockType: 'email', name: 'email', label: 'Email address', required: true }],
  updatedAt: '2026-09-01T00:00:00.000Z',
  createdAt: '2026-09-01T00:00:00.000Z',
} satisfies Form

/**
 * An authored CMS form, rendered and wired to the unified intake.
 *
 * This is what the RichText renderer puts in place of a `forms` relationship
 * node. Submitting here posts to `/api/submissions`, which Ladle does not
 * serve — so the forms below show the captcha gate and the error state, and
 * the confirmation state lives in the FormBuilder story.
 *
 * No captcha renders without `PUBLIC__TURNSTILE_SITE_KEY`, and the submit
 * button then stays enabled: the CMS refuses the write, which is the honest
 * outcome of an unconfigured site.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="A contact form: the answers travel as text pairs, the email address as a column."
      title="Basic Examples"
    >
      <div className="max-w-2xl">
        <CmsForm form={contactForm} />
      </div>
    </StorySection>

    <StorySection
      description="A subscribe form is the same renderer. Only actionType, and so delivery, differs."
      title="Variants"
    >
      <div className="max-w-md">
        <CmsForm form={subscribeForm} />
      </div>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900">Render config</h4>
          <pre className="max-h-96 overflow-x-auto rounded bg-gray-900 p-4 text-xs text-gray-100">
            {JSON.stringify(cmsFormSpec(contactForm), null, 2)}
          </pre>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900">Create body</h4>
          <pre className="max-h-96 overflow-x-auto rounded bg-gray-900 p-4 text-xs text-gray-100">
            {JSON.stringify(
              submissionBody({
                spec: cmsFormSpec(contactForm)!,
                submission: {
                  form: '1',
                  submissionData: [
                    { field: 'name', value: 'Ada' },
                    { field: 'email', value: 'ada@example.org' },
                    { field: 'message', value: 'Hello' },
                  ],
                },
                locale: 'en',
                path: '/contact',
              }),
              null,
              2,
            )}
          </pre>
        </div>
      </div>
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'CMS Form'
