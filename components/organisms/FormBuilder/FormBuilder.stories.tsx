import type { Story, StoryDefault } from '@ladle/react'
import { FormBuilder, FormBuilderConfig, FormBuilderSubmission } from './FormBuilder'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * FormBuilder component showcasing dynamic form rendering from PayloadCMS form builder plugin.
 *
 * Demonstrates all supported field types, variants, alignment options, validation, submission handling, and confirmation messages.
 */
export const Default: Story = () => {
  // Mock submission handler that simulates API call
  const handleSubmit = async (data: FormBuilderSubmission) => {
    console.log('Form submitted:', data)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simulate success
    return { success: true }
  }

  // Mock submission handler that simulates validation errors
  const handleSubmitWithErrors = async (data: FormBuilderSubmission) => {
    console.log('Form submitted with errors:', data)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simulate validation errors
    return {
      success: false,
      error: {
        message: 'Please correct the errors below',
        errors: [
          { field: 'email', message: 'This email address is already registered' },
          { field: 'message', message: 'Message must be at least 20 characters long' },
        ],
      },
    }
  }

  // Simple contact form for variant demonstration
  const variantDemoForm: FormBuilderConfig = {
    id: 'variant-demo-form',
    title: 'Get in Touch',
    fields: [
      {
        name: 'name',
        blockType: 'text',
        label: 'Your Name',
        required: true,
        placeholder: 'John Doe',
      },
      {
        name: 'email',
        blockType: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'your@email.com',
      },
      {
        name: 'message',
        blockType: 'textarea',
        label: 'Message',
        required: true,
        placeholder: 'How can we help you?',
      },
    ],
    submitButtonLabel: 'Send',
  }

  // Contact form configuration
  const contactForm: FormBuilderConfig = {
    id: 'contact-form',
    title: 'Contact Us',
    fields: [
      {
        name: 'name',
        blockType: 'text',
        label: 'Full Name',
        required: true,
        placeholder: 'John Doe',
      },
      {
        name: 'email',
        blockType: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'your@email.com',
      },
      {
        name: 'subject',
        blockType: 'select',
        label: 'Subject',
        required: true,
        options: [
          { label: 'General Inquiry', value: 'general' },
          { label: 'Technical Support', value: 'support' },
          { label: 'Feedback', value: 'feedback' },
          { label: 'Partnership', value: 'partnership' },
        ],
      },
      {
        name: 'message',
        blockType: 'textarea',
        label: 'Message',
        required: true,
        placeholder: 'Tell us how we can help...',
      },
      {
        name: 'contactNewsletter',
        blockType: 'checkbox',
        label: 'Subscribe to our newsletter',
      },
    ],
    submitButtonLabel: 'Send Message',
    confirmationMessage: "Thank you for contacting us! We'll get back to you soon.",
  }

  // Registration form with all field types
  const registrationForm: FormBuilderConfig = {
    id: 'registration-form',
    title: 'Create Account',
    fields: [
      {
        name: 'intro',
        blockType: 'message',
        label: '',
        message:
          'Welcome! Please fill out the form below to create your meditation account.',
      },
      {
        name: 'fullName',
        blockType: 'text',
        label: 'Full Name',
        required: true,
        placeholder: 'Enter your full name',
      },
      {
        name: 'regEmail',
        blockType: 'email',
        label: 'Email',
        required: true,
        placeholder: 'your@email.com',
      },
      {
        name: 'age',
        blockType: 'number',
        label: 'Age',
        required: false,
        placeholder: '18',
      },
      {
        name: 'experience',
        blockType: 'select',
        label: 'Meditation Experience',
        required: true,
        placeholder: 'Select your experience level',
        options: [
          { label: 'Beginner', value: 'beginner' },
          { label: 'Intermediate', value: 'intermediate' },
          { label: 'Advanced', value: 'advanced' },
        ],
      },
      {
        name: 'bio',
        blockType: 'textarea',
        label: 'Tell us about yourself',
        required: false,
        placeholder: 'Optional: Share your meditation journey...',
      },
      {
        name: 'terms',
        blockType: 'checkbox',
        label: 'I agree to the Terms and Conditions',
        required: true,
      },
      {
        name: 'regNewsletter',
        blockType: 'checkbox',
        label: 'Send me weekly meditation tips',
      },
    ],
    submitButtonLabel: 'Create Account',
    confirmationMessage: 'Your account has been created successfully! Welcome to our community.',
  }

  // Simple newsletter form
  const newsletterForm: FormBuilderConfig = {
    id: 'newsletter-form',
    fields: [
      {
        name: 'newsletterEmail',
        blockType: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'Enter your email',
      },
    ],
    submitButtonLabel: 'Subscribe',
    confirmationMessage: 'Thank you for subscribing! Check your email to confirm.',
  }

  // Form with validation errors
  const errorForm: FormBuilderConfig = {
    id: 'error-form',
    title: 'Form with Validation Errors',
    fields: [
      {
        name: 'errorEmail',
        blockType: 'email',
        label: 'Email',
        required: true,
        placeholder: 'Try submitting to see server-side errors',
      },
      {
        name: 'errorMessage',
        blockType: 'textarea',
        label: 'Message',
        required: true,
        placeholder: 'This will also show a validation error',
      },
    ],
    submitButtonLabel: 'Submit (Will Show Errors)',
  }

  return (
    <StoryWrapper>
      <StorySection title="Variants">
        <div className="flex flex-wrap gap-8">
          <div className="min-w-2/5">
            <StorySection title="Default Variant" variant="subsection">
              <p className="text-sm text-gray-600 mb-4">
                Uses default input variants with labels above fields and primary button
              </p>
              <div className="max-w-md">
                <FormBuilder form={variantDemoForm} onSubmit={handleSubmit} variant="default" />
              </div>
            </StorySection>
          </div>

          <div className="min-w-2/5">
            <StorySection title="Minimal Variant" variant="subsection">
              <p className="text-sm text-gray-600 mb-4">
                Uses minimal input variants with placeholders instead of labels and outline button
              </p>
              <div className="max-w-md">
                <FormBuilder form={variantDemoForm} onSubmit={handleSubmit} variant="minimal" />
              </div>
            </StorySection>
          </div>
        </div>
      </StorySection>

      <StorySection title="Alignments">
        <div className="flex flex-col gap-8">
          <StorySection title="Left Aligned (Default)" variant="subsection">
            <div className="max-w-md">
              <FormBuilder form={variantDemoForm} onSubmit={handleSubmit} align="left" />
            </div>
          </StorySection>

          <StorySection title="Center Aligned" variant="subsection">
            <div className="max-w-md mx-auto">
              <FormBuilder form={variantDemoForm} onSubmit={handleSubmit} align="center" />
            </div>
          </StorySection>
        </div>
      </StorySection>

      <StorySection title="Contact Form" inContext={true}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="max-w-2xl">
            <FormBuilder form={contactForm} onSubmit={handleSubmit} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Configuration JSON</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">
              {JSON.stringify(contactForm, null, 2)}
            </pre>
          </div>
        </div>
      </StorySection>

      <StorySection title="Registration Form (All Field Types)" inContext={true}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="max-w-2xl">
            <FormBuilder form={registrationForm} onSubmit={handleSubmit} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Configuration JSON</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">
              {JSON.stringify(registrationForm, null, 2)}
            </pre>
          </div>
        </div>
      </StorySection>

      <StorySection title="Simple Newsletter Form" inContext={true}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="max-w-md">
            <FormBuilder form={newsletterForm} onSubmit={handleSubmit} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Configuration JSON</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">
              {JSON.stringify(newsletterForm, null, 2)}
            </pre>
          </div>
        </div>
      </StorySection>

      <StorySection title="Form with Server-Side Validation Errors" inContext={true}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="max-w-2xl">
            <p className="text-sm text-gray-600 mb-4">
              This form simulates server-side validation errors. Try submitting the form to see
              how field-level errors are displayed.
            </p>
            <FormBuilder form={errorForm} onSubmit={handleSubmitWithErrors} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Configuration JSON</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">
              {JSON.stringify(errorForm, null, 2)}
            </pre>
          </div>
        </div>
      </StorySection>

      <div />
    </StoryWrapper>
  )
}

Default.storyName = 'Form Builder'
