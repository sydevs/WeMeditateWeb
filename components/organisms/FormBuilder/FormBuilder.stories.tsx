import type { Story, StoryDefault } from '@ladle/react'
import { FormBuilder } from './FormBuilder'
import { submissionBody } from '../../../lib/submissions'
import { StoryWrapper, StorySection } from '../../ladle'
import type { EmbeddedForm } from '../../../server/cms-types'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * Cloudflare's published always-solves test site key. It never reaches a real
 * challenge, so the story can show the captcha gate without a configured site.
 */
const TEST_SITE_KEY = '1x00000000000000000000AA'

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

/** Both fixtures are `satisfies EmbeddedForm`, so they cannot drift from the read. */
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
} satisfies EmbeddedForm

const subscribeForm = {
  id: 2,
  title: 'Monthly letter',
  actionType: 'subscribe',
  confirmationType: 'message',
  confirmationMessage: lexical('Check your inbox to confirm.'),
  fields: [{ blockType: 'email', name: 'email', label: 'Email address', required: true }],
} satisfies EmbeddedForm

/**
 * An authored form, rendered and wired to the unified intake.
 *
 * This is what the RichText renderer puts in place of a `forms` relationship
 * node. Submitting here posts to `/api/submissions`, which Ladle does not
 * serve — so these forms show the captcha gate and the error state, never the
 * confirmation.
 *
 * The first two forms pass Cloudflare's test key, so the captcha renders and
 * the submit button unlocks once it solves. The third passes none, which is
 * what an unconfigured site looks like: no captcha, an enabled button, and a
 * submission the CMS refuses.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="A contact form: the answers travel as text pairs, the email address as a column. The two 50% fields pair up from sm."
      title="Basic Examples"
    >
      <div className="max-w-2xl">
        <FormBuilder form={contactForm} siteKey={TEST_SITE_KEY} />
      </div>
    </StorySection>

    <StorySection
      description="A subscribe form is the same renderer. Only actionType, and so delivery, differs."
      title="Variants"
    >
      <div className="max-w-md">
        <FormBuilder form={subscribeForm} siteKey={TEST_SITE_KEY} />
      </div>
    </StorySection>

    <StorySection
      description="No site key configured: no captcha renders, and the CMS refuses the submission."
      title="States"
    >
      <div className="max-w-md">
        <FormBuilder form={subscribeForm} />
      </div>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="max-w-2xl">
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Create body</h4>
        <pre className="max-h-96 overflow-x-auto rounded bg-gray-900 p-4 text-xs text-gray-100">
          {JSON.stringify(
            submissionBody({
              form: contactForm,
              answers: { name: 'Ada', email: 'ada@example.org', message: 'Hello' },
              locale: 'en',
              path: '/contact',
            }),
            null,
            2,
          )}
        </pre>
      </div>
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'Form Builder'
